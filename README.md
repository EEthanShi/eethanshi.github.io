# Dai (Ethan) Shi — personal website

Plain HTML/CSS/JS, no build step. Served by GitHub Pages at <https://eethanshi.github.io/>.

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构和固定文字（简介、经历、教育、技能、学术服务） |
| `assets/js/data.js` | **日常只改这个**：研究方向、News、论文列表、Google Scholar 链接 |
| `assets/js/main.js` | 把 `data.js` 渲染成页面（筛选、BibTeX、主题切换），一般不用动 |
| `assets/css/style.css` | 样式；颜色都在文件顶部的 `:root` 变量里，暗色模式在下面重新定义 |
| `assets/cv/Dai_Shi_CV.pdf` | 网站上 "CV" 按钮下载的文件，换新版直接覆盖同名文件 |
| `assets/img/profile.jpg` | 头像（4:5 竖图，480×600 左右即可） |

## 常见更新

**加一条 News**：在 `data.js` 的 `news` 数组里加一行，日期写 `"YYYY-MM"`，会自动按时间排序，默认显示最新 6 条。

```js
{ date: "2026-11", html: "Gave a talk at ... <a href=\"https://...\">slides</a>." },
```

**加一篇论文**：复制 `publications` 里任意一条改字段。要点：

- 作者名后加 `*` 表示共同一作；`"Dai Shi"` 会自动加粗。
- `status: "under_review"` 会显示 "Under review" 标签，并排在最前面；接收后改成 `"published"`，把 `venue` 改成正式会议名。
- `selected: true` 的论文出现在默认的 "Selected" 视图里，其余只在 "All" 里显示。
- `topics` 决定它出现在哪个研究方向的筛选里（`stochastic` / `graph` / `llm` / `geometry` / `science`）。
- `links` 里有哪个链接就显示哪个按钮：`paper`、`arxiv`、`openreview`、`code`、`project`。
- 不写 `bibtex` 会自动生成一条；想用官方的就把 DBLP / arXiv 的 BibTeX 粘到 `bibtex` 字段里。

**换 CV**：把新 PDF 覆盖到 `assets/cv/Dai_Shi_CV.pdf`。公开网站上的 CV 不要带手机号。现在这份是用 Overleaf 里 `Ethan_CV/CV_ai_industry.tex` 编译的，只把手机号那一行换成了主页链接；改完 Overleaf 后可以这样重新生成（不会改动原文件）：

```bash
sed -E 's|\+44 [0-9 ]+[0-9]|\\href{https://eethanshi.github.io/}{eethanshi.github.io}|' "../应用/Overleaf/Ethan_CV/CV_ai_industry.tex" > /tmp/cv_public.tex && tectonic /tmp/cv_public.tex && cp /tmp/cv_public.pdf assets/cv/Dai_Shi_CV.pdf
```

**BibTeX**：官方 BibTeX 在 `assets/js/bibtex.js`，按论文 `id` 对应；没有的会根据 `data.js` 自动生成。

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

## 发布（GitHub Pages）

仓库：<https://github.com/EEthanShi/eethanshi.github.io>（公开），Pages 从 `main` 分支根目录发布，网址 <https://eethanshi.github.io/>。

第一次发布是用 GitHub API 上传的，因为这台电脑上的 `git` 需要先同意 Xcode 许可协议。以后想用 git 更新，先在终端运行一次：

```bash
sudo xcodebuild -license accept
```

然后在本文件夹里把它和线上仓库关联起来（只需要一次）：

```bash
git init -b main && git remote add origin git@github.com:EEthanShi/eethanshi.github.io.git && git fetch origin && git reset origin/main
```

之后每次修改：

```bash
git add -A && git commit -m "Update site" && git push
```

已有的 workshop 页面（`EEthanShi/stochastic-dynamics-2026` 仓库）继续在 <https://eethanshi.github.io/stochastic-dynamics-2026/> 访问，不受影响。
