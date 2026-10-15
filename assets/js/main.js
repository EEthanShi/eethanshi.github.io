/* Renders research themes, news and publications from window.SITE (assets/js/data.js)
   and BibTeX from window.BIBTEX (assets/js/bibtex.js).
   To update the site, edit data.js — this file should rarely need changes. */
(function () {
  "use strict";

  var ME = "Dai Shi";
  var NEWS_VISIBLE = 6;

  // ---------- helpers ----------

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(d) {
    // "2026-05" -> "May 2026"; "2026" -> "2026"
    var m = /^(\d{4})(?:-(\d{2}))?/.exec(d || "");
    if (!m) return esc(d);
    return m[2] ? MONTHS[parseInt(m[2], 10) - 1] + " " + m[1] : m[1];
  }

  function isUnderReview(p) { return p.status === "under_review"; }
  function isPreprint(p) { return p.status === "preprint"; }
  function isPublished(p) { return !isUnderReview(p) && !isPreprint(p); }
  function hasLinks(p) { return !!p.links && Object.keys(p.links).some(function (k) { return p.links[k]; }); }

  function focusHeading(el) {
    if (!el) return;
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }

  // ---------- theme toggle ----------

  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  var themeBtn = $(".theme-toggle");
  function syncThemeBtn() { if (themeBtn) themeBtn.setAttribute("aria-pressed", currentTheme() === "dark" ? "true" : "false"); }
  if (themeBtn) {
    syncThemeBtn();
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      storageSet("theme", next);
      syncThemeBtn();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", syncThemeBtn);
    }
  }

  // ---------- mobile menu ----------

  var menuBtn = $(".menu-toggle");
  var nav = $("#site-nav");
  var header = $(".site-header");
  if (menuBtn && nav) {
    var closeMenu = function (returnFocus) {
      nav.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      if (returnFocus) menuBtn.focus();
    };
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) { var first = $("a", nav); if (first) first.focus(); }
    });
    $all("a", nav).forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
    });
    if (header) {
      header.addEventListener("focusout", function (e) {
        if (nav.classList.contains("is-open") && !header.contains(e.relatedTarget)) closeMenu(false);
      });
    }
  }

  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Highlight the nav link of the section in view.
  if ("IntersectionObserver" in window && nav) {
    var navLinks = $all('a[href^="#"]', nav);
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (!a) return;
        if (e.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
          a.classList.add("is-active");
          a.setAttribute("aria-current", "location");
        } else if (a.classList.contains("is-active")) {
          a.classList.remove("is-active");
          a.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ---------- video: load the YouTube player only when clicked ----------

  $all(".yt-facade").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(a.getAttribute("data-yt")) + "?autoplay=1&rel=0";
      iframe.title = a.getAttribute("data-yt-title") || "YouTube video";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      a.parentNode.replaceChild(iframe, a);
      iframe.focus();
    });
  });

  // ---------- data guard ----------

  var SITE = window.SITE;
  if (!SITE) {
    // data.js failed to load or has a syntax error: hide empty sections and point to the CV.
    if (window.console) console.error("assets/js/data.js failed to load or has a syntax error");
    ["research", "news"].forEach(function (id) { var s = document.getElementById(id); if (s) s.hidden = true; });
    var pl = $("#pub-list");
    if (pl) pl.innerHTML = '<p class="noscript-note">The publication list failed to load. My papers are also listed on <a href="https://openreview.net/profile?id=~Dai_Shi1">OpenReview</a>.</p>';
    var pc = $(".pub-controls"); if (pc) pc.hidden = true;
    return;
  }

  // ---------- profile links that are filled from data ----------

  var profiles = SITE.profiles || {};
  Object.keys(profiles).forEach(function (key) {
    var url = profiles[key];
    if (!url) return;
    $all('[data-link="' + key + '"], [data-link-text="' + key + '"]').forEach(function (el) {
      var a = el.tagName === "A" ? el : $("a", el);
      if (a) a.href = url;
      el.hidden = false;
    });
  });

  if (SITE.updated) { var up = $("#updated"); if (up) up.textContent = fmtDate(SITE.updated); }

  // ---------- publications ----------

  var pubs = (SITE.publications || []).slice();
  var pubById = {};
  pubs.forEach(function (p) { pubById[p.id] = p; });
  var topics = SITE.topics || [];
  var topicById = {};
  topics.forEach(function (t) { topicById[t.id] = t; });

  var state = { view: "selected", topic: null };

  function authorsHtml(list) {
    return (list || []).map(function (a) {
      var eq = /\*$/.test(a);
      var name = a.replace(/\*$/, "");
      var html = esc(name) + (eq ? "<sup>*</sup>" : "");
      return name === ME ? '<span class="me">' + html + "</span>" : html;
    }).join(", ");
  }

  function bibKey(p) {
    var first = ((p.authors && p.authors[0]) || "anon").replace(/\*$/, "").split(" ").pop().toLowerCase();
    if (first.normalize) first = first.normalize("NFD").replace(/[̀-ͯ]/g, "");
    first = first.replace(/[^a-z]/g, "");
    var word = (p.title || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ")
      .filter(function (w) { return w.length > 3; })[0] || "paper";
    return first + (p.year || "") + word;
  }

  // Protect acronyms and mixed-case words so BibTeX styles do not lowercase them.
  function protectCaps(title) {
    return title.replace(/\b([A-Za-z]*[A-Z][A-Za-z0-9]*[A-Z0-9][A-Za-z0-9]*)\b/g, "{$1}");
  }

  function makeBibtex(p) {
    if (p.bibtex) return p.bibtex.trim();
    if (window.BIBTEX && window.BIBTEX[p.id]) return window.BIBTEX[p.id].trim();
    var L = p.links || {};
    var isJournal = p.type === "journal";
    var unpublished = isUnderReview(p) || isPreprint(p);
    var lines = [
      "@" + (unpublished ? "misc" : isJournal ? "article" : "inproceedings") + "{" + bibKey(p) + ",",
      "  title     = {" + protectCaps(p.title) + "},",
      "  author    = {" + (p.authors || []).map(function (a) { return a.replace(/\*$/, ""); }).join(" and ") + "},"
    ];
    if (unpublished) {
      lines.push("  note      = {" + (isUnderReview(p) ? "Under review" : "Preprint") + "},");
    } else if (isJournal) {
      lines.push("  journal   = {" + p.venue + "},");
    } else {
      lines.push("  booktitle = {" + (p.venueFull || p.venue) + "},");
    }
    if (L.arxiv) {
      var id = (/abs\/([^v\s?#]+)/.exec(L.arxiv) || [])[1];
      if (id) lines.push("  eprint    = {" + id + "},", "  archivePrefix = {arXiv},");
    }
    var doi = L.paper && (/doi\.org\/(.+)$/.exec(L.paper) || [])[1];
    if (doi) lines.push("  doi       = {" + doi + "},");
    var url = L.paper || L.openreview || L.arxiv;
    if (url && !doi) lines.push("  url       = {" + url + "},");
    lines.push("  year      = {" + p.year + "}");
    return lines.join("\n") + "\n}";
  }

  function pubHtml(p) {
    var L = p.links || {};
    var main = L.paper || L.openreview || L.arxiv || L.code || "";
    var badges = "";
    if (isUnderReview(p)) {
      badges += '<span class="badge review">Under review' + (p.venue ? " · " + esc(p.venue) : "") + "</span>";
    } else if (isPreprint(p)) {
      badges += '<span class="badge review">Preprint</span>';
    } else {
      badges += '<span class="badge' + (p.type === "workshop" ? " workshop" : "") + '">' + esc(p.venue) + "</span>";
    }
    if (p.award) badges += '<span class="badge award">' + esc(p.award) + "</span>";

    var titleInner = p.titleHtml || esc(p.title);
    var title = main ? '<a href="' + esc(main) + '">' + titleInner + "</a>" : titleInner;

    var actions = [];
    if (L.paper) actions.push('<a href="' + esc(L.paper) + '">Paper</a>');
    if (L.arxiv) actions.push('<a href="' + esc(L.arxiv) + '">arXiv</a>');
    if (L.openreview) actions.push('<a href="' + esc(L.openreview) + '">OpenReview</a>');
    if (L.code) actions.push('<a href="' + esc(L.code) + '">Code</a>');
    if (L.project) actions.push('<a href="' + esc(L.project) + '">Project</a>');
    if (L.video) actions.push('<a href="' + esc(L.video) + '">Video</a>');
    var bib = "";
    if (hasLinks(p)) {
      actions.push('<button type="button" class="bib-toggle" aria-expanded="false" aria-controls="bib-' + esc(p.id) + '">BibTeX</button>');
      bib = '<div class="bibtex" id="bib-' + esc(p.id) + '"><pre>' + esc(makeBibtex(p)) + '</pre><button type="button" class="copy">Copy</button></div>';
    }

    var venueFull = p.venueFull && p.venueFull !== p.venue ? '<p class="venue-full">' + esc(p.venueFull) + "</p>" : "";
    var tldr = p.tldr && state.view === "selected" ? '<p class="tldr">' + p.tldr + "</p>" : "";

    return '<li class="pub" id="pub-' + esc(p.id) + '">' +
      '<div class="venue">' + badges + "</div>" +
      '<div class="pub-body">' +
        '<h4 class="title">' + title + "</h4>" +
        '<p class="authors">' + authorsHtml(p.authors) + "</p>" +
        venueFull + tldr +
        (actions.length ? '<div class="actions">' + actions.join("") + "</div>" : "") +
        bib +
      "</div>" +
    "</li>";
  }

  function groupHtml(title, list, hideTitle) {
    if (!list.length) return "";
    return '<div class="pub-group"><h3' + (hideTitle ? ' class="visually-hidden"' : "") + ">" + esc(title) + "</h3>" +
      '<ul class="pubs">' + list.map(pubHtml).join("") + "</ul></div>";
  }

  function filtered() {
    return pubs.filter(function (p) {
      if (state.view === "selected" && !p.selected) return false;
      if (state.topic && (p.topics || []).indexOf(state.topic) < 0) return false;
      return true;
    });
  }

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  function renderPubs() {
    var host = $("#pub-list");
    if (!host) return;
    var list = filtered();
    var review = list.filter(isUnderReview);
    var preprints = list.filter(isPreprint);
    var published = list.filter(isPublished);
    var html = "";

    if (state.view === "selected") {
      html += groupHtml("Selected publications", published, true);
      html += groupHtml("Recent work under review", review);
      html += groupHtml("Preprints", preprints);
    } else {
      var years = {};
      published.forEach(function (p) { (years[p.year] = years[p.year] || []).push(p); });
      Object.keys(years).sort(function (a, b) { return b - a; }).forEach(function (y) {
        html += groupHtml(y, years[y]);
      });
      html += groupHtml("Under review", review);
      html += groupHtml("Preprints", preprints);
    }
    if (!list.length) html = '<p class="empty-state">No papers match this filter.</p>';
    host.innerHTML = html;

    var count = $("#pub-count");
    if (count) {
      var topicName = state.topic && topicById[state.topic] ? " · " + topicById[state.topic].label : "";
      if (state.view === "selected") {
        count.textContent = "showing " + plural(list.length, "selected paper", "selected papers") + topicName;
      } else {
        var peer = published.filter(function (p) { return p.type !== "workshop"; }).length;
        var parts = [plural(peer, "peer-reviewed paper", "peer-reviewed papers")];
        var ws = published.length - peer;
        if (ws) parts.push(plural(ws, "workshop paper", "workshop papers"));
        if (review.length) parts.push(review.length + " under review");
        if (preprints.length) parts.push(plural(preprints.length, "preprint", "preprints"));
        count.textContent = parts.join(", ") + topicName;
      }
    }

    $all("[data-view]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-view") === state.view ? "true" : "false");
    });
    $all("[data-topic]").forEach(function (b) {
      var t = b.getAttribute("data-topic") || null;
      b.setAttribute("aria-pressed", t === state.topic ? "true" : "false");
    });
  }

  function renderChips() {
    var host = $("#topic-chips");
    if (!host) return;
    host.innerHTML = '<button type="button" class="chip" data-topic="">All topics</button>' +
      topics.map(function (t) {
        return '<button type="button" class="chip" data-topic="' + esc(t.id) + '">' + esc(t.label) + "</button>";
      }).join("");
  }

  // Show a paper even if the current filter hides it, scroll to it and (optionally) move focus to it.
  function revealPub(id, moveFocus) {
    var p = pubById[id];
    if (!p) return false;
    if (!filtered().some(function (x) { return x.id === id; })) {
      state.topic = null;
      if (!p.selected) state.view = "all";
      renderPubs();
    }
    var el = document.getElementById("pub-" + id);
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.classList.remove("is-flash");
    void el.offsetWidth;
    el.classList.add("is-flash");
    if (moveFocus) focusHeading($(".title", el));
    return true;
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t.closest) return;

    var viewBtn = t.closest("[data-view]");
    if (viewBtn) { state.view = viewBtn.getAttribute("data-view"); renderPubs(); return; }

    var chip = t.closest("[data-topic]");
    if (chip) { state.topic = chip.getAttribute("data-topic") || null; renderPubs(); return; }

    var bib = t.closest(".bib-toggle");
    if (bib) {
      var box = document.getElementById(bib.getAttribute("aria-controls"));
      var open = box.classList.toggle("is-open");
      bib.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }

    var copy = t.closest(".bibtex .copy");
    if (copy) {
      var pre = copy.parentNode.querySelector("pre");
      var text = pre.textContent;
      var reset = function (ms) { setTimeout(function () { copy.textContent = "Copy"; }, ms); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(pre);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) {}
        copy.textContent = ok ? "Copied" : "Press Ctrl/⌘+C";
        reset(2500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { copy.textContent = "Copied"; reset(1500); }, fallback);
      } else {
        fallback();
      }
      return;
    }

    var seeAll = t.closest("[data-theme-filter]");
    if (seeAll) {
      state.view = "all";
      state.topic = seeAll.getAttribute("data-theme-filter");
      renderPubs();
      var head = document.getElementById("pubs-title");
      if (head) { head.scrollIntoView(); focusHeading(head); }
      return;
    }

    var jump = t.closest("a[data-pub]");
    if (jump && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
      var id = jump.getAttribute("data-pub");
      if (revealPub(id, true)) {
        e.preventDefault();
        if (history.replaceState) history.replaceState(null, "", "#pub-" + id);
      }
    }
  });

  // ---------- research themes ----------

  function renderThemes() {
    var host = $("#themes");
    if (!host) return;
    host.innerHTML = topics.filter(function (t) { return t.blurb; }).map(function (t) {
      var key = (t.keyPapers || []).map(function (id) {
        var p = pubById[id];
        if (!p) return "";
        var note = isUnderReview(p) ? ' <span class="chip-note">under review</span>' : isPreprint(p) ? ' <span class="chip-note">preprint</span>' : "";
        return '<a href="#pub-' + esc(id) + '" data-pub="' + esc(id) + '">' + (p.shortHtml || esc(p.short || p.title)) + note + "</a>";
      }).join("");
      return '<article class="theme">' +
        "<h3>" + esc(t.title || t.label) + "</h3>" +
        "<p>" + t.blurb + "</p>" +
        '<div class="theme-papers">' + key + "</div>" +
        '<button type="button" class="see-all" data-theme-filter="' + esc(t.id) + '">All papers on this theme →</button>' +
      "</article>";
    }).join("");
  }

  // ---------- news ----------

  function renderNews() {
    var host = $("#news-list");
    if (!host) return;
    var items = (SITE.news || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    host.innerHTML = items.map(function (n, i) {
      return '<li class="' + (i >= NEWS_VISIBLE ? "is-hidden" : "") + '">' +
        '<time datetime="' + esc(n.date) + '">' + fmtDate(n.date) + "</time>" +
        '<div class="item">' + n.html + "</div></li>";
    }).join("");
    var more = $("#news-more");
    if (more && items.length > NEWS_VISIBLE) {
      more.hidden = false;
      more.addEventListener("click", function () {
        var expanding = $all("li.is-hidden", host).length > 0;
        $all("li", host).forEach(function (li, i) { li.classList.toggle("is-hidden", !expanding && i >= NEWS_VISIBLE); });
        more.textContent = expanding ? "Show less" : "Show all news";
        more.setAttribute("aria-expanded", expanding ? "true" : "false");
      });
    }
  }

  renderChips();
  renderThemes();
  renderNews();
  renderPubs();

  // Deep links to a paper, e.g. #pub-s3gnn, on load and on later hash changes.
  function openHash() {
    var m = /^#pub-(.+)$/.exec(location.hash);
    if (m) setTimeout(function () { revealPub(decodeURIComponent(m[1]), false); }, 50);
  }
  openHash();
  window.addEventListener("hashchange", openHash);
})();
