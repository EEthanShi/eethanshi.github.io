/* Site content. Edit this file to update news and publications; main.js renders it.
 *
 * Publication fields
 *   id        short unique id (used in links like #pub-s3gnn and to look up BibTeX in bibtex.js)
 *   title     exact paper title;  titleHtml optional HTML version (e.g. superscripts)
 *   short     label used on the research-theme cards (shortHtml for an HTML version)
 *   authors   in order; mark equal contribution with a trailing "*"; "Dai Shi" is bolded automatically
 *   venue     short badge text, e.g. "ICML 2026";  venueFull optional long name shown under the authors
 *   type      "conference" | "journal" | "workshop" | "preprint"
 *   status    "published" | "under_review" | "preprint"
 *   award     optional, e.g. "Spotlight"
 *   year      number
 *   topics    ids from `topics` below
 *   selected  true to show in the default "Selected" view
 *   links     { paper, arxiv, openreview, code, project, video }  (omit any you do not have)
 *   tldr      optional one-sentence summary (shown in the "Selected" view)
 *
 * BibTeX lives in bibtex.js, keyed by id. Papers without an entry get one generated from these fields.
 */
window.SITE = {
  updated: "2026-10",

  profiles: {
    scholar: ""
  },

  topics: [
    {
      id: "stochastic",
      label: "Stochastic dynamics",
      title: "Stochastic dynamics & operator learning",
      blurb: "Neural operators and neural differential equations for SDEs, SPDEs and rough differential equations: Wiener-chaos operators that return whole solution paths in one forward pass, branched rough-path models for Itô and manifold-valued dynamics, operators for singular SPDEs, and a benchmark that tests them. Applications include volatility and covariance forecasting, financial time-series extrapolation, molecular dynamics and flood forecasting.",
      keyPapers: ["chaos", "bnrde", "spdebench", "wcno_singular"]
    },
    {
      id: "graph",
      label: "Graph learning",
      title: "Graph learning",
      blurb: "Architectures and theory for message passing: long-range mixing without eigendecompositions, Koopman and dynamic-mode views of GNNs, over-squashing and over-smoothing, and diffusion models that generate GNN weights.",
      keyPapers: ["s3gnn", "dmdgnn", "gnndiff", "oversquashing"]
    },
    {
      id: "llm",
      label: "LLMs, interpretability & RL",
      title: "Foundation models, interpretability & RL",
      blurb: "How large models represent and use information: why studies disagree on whether different models learn the same representations, whether LLMs can override their default completion when a prompt's constraints demand it, how feature superposition can lock a reinforcement-learning policy into a worse action, and LLM-assisted data annotation.",
      keyPapers: ["act", "relgs", "plato_aristotle", "superposition_traps"]
    },
    {
      id: "geometry",
      label: "Geometry & optimization",
      title: "Geometry, optimization & optimal transport",
      blurb: "Riemannian optimization and optimal transport: optimization on the manifold of transport plans, learning the ground metric, orthogonal fine-tuning of large models, and the geometry of how stochastic optimizers select among flat minima.",
      keyPapers: ["cmm_ot", "riemannian_ground_metric", "loft", "flat_minima"]
    },
    { id: "science", label: "AI for science & health" }
  ],

  news: [
    { date: "2026-10", html: "New preprint: <a href=\"#pub-plato_aristotle\" data-pub=\"plato_aristotle\">From Plato to Aristotle</a>, toward a general theory of representation hypotheses (<a href=\"#video\">watch the video</a>)." },
    { date: "2026-09", html: "Three papers accepted at <strong>NeurIPS 2026</strong>: <a href=\"#pub-spdebench\" data-pub=\"spdebench\">SPDEBench</a>, <a href=\"#pub-relgs\" data-pub=\"relgs\">RelGS</a> and <a href=\"#pub-loft\" data-pub=\"loft\">LOFT</a>." },
    { date: "2026-09", html: "Accepted papers are out for the <a href=\"https://eethanshi.github.io/stochastic-dynamics-2026/\">NeurIPS 2026 Workshop on AI for Stochastic Dynamics</a>, which I am organizing as Program Chair. See you in Sydney on 11 December." },
    { date: "2026-08", html: "Our survey on <a href=\"#pub-oversquashing\" data-pub=\"oversquashing\">over-squashing in graph neural networks</a> is published in <strong>IEEE TPAMI</strong>." },
    { date: "2026-05", html: "Three papers accepted at <strong>ICML 2026</strong>: <a href=\"#pub-s3gnn\" data-pub=\"s3gnn\">S<sup>3</sup>GNN</a> (Spotlight), <a href=\"#pub-chaos\" data-pub=\"chaos\">Expanding the Chaos</a> and <a href=\"#pub-bnrde\" data-pub=\"bnrde\">Branched Neural RDEs</a>." },
    { date: "2026-03", html: "Joined the <strong>University of Cambridge</strong> as a Postdoctoral Research Fellow with José Miguel Hernández-Lobato." },
    { date: "2026-01", html: "<a href=\"#pub-atom\" data-pub=\"atom\">ATOM</a>, a pretrained neural operator for multi-task molecular dynamics, accepted at <strong>ICLR 2026</strong>." },
    { date: "2025-12", html: "My team placed <strong>2nd</strong> in the <a href=\"https://hackathon2.deepintomlf.ai/competitions/92/\">Singular Stochastic PDE Learning Competition</a>, learning solutions of the dynamical Φ<sup>4</sup><sub>2</sub> model." },
    { date: "2025-09", html: "<a href=\"#pub-act\" data-pub=\"act\">ACT as Human</a>, on multimodal LLM data annotation, accepted at <strong>NeurIPS 2025</strong>." },
    { date: "2025-01", html: "Two papers accepted at <strong>ICLR 2025</strong>: <a href=\"#pub-dmdgnn\" data-pub=\"dmdgnn\">DMD-GNN</a> and <a href=\"#pub-gnndiff\" data-pub=\"gnndiff\">GNN-Diff</a>." }
  ],

  publications: [
    /* ---------------- Under review ---------------- */
    {
      id: "plato_aristotle", short: "Plato to Aristotle",
      title: "From Plato to Aristotle: Toward a General Theory of Representation Hypotheses",
      authors: ["Dai Shi", "Andi Han", "Xiaoyu Li", "Luke Thompson", "José Miguel Hernández-Lobato"],
      venue: "ICLR 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["llm"], selected: true,
      links: { arxiv: "https://arxiv.org/abs/2610.20286", code: "https://github.com/EEthanShi/LRH", video: "https://www.youtube.com/watch?v=dmv-Oj-_XFI" },
      tldr: "Shows that conflicting findings on whether models converge to shared representations come from alignment criteria sitting at different points of one lattice, and tests this on pretrained and theoretical models."
    },
    {
      id: "canonical_jump", short: "Canonical completion",
      title: "When the Canonical Completion Is Wrong: Formalizing and Measuring the Jump in Large Language Models",
      authors: ["Dai Shi", "Xiaoyu Li", "José Miguel Hernández-Lobato"],
      venue: "ICLR 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["llm"], selected: true,
      links: { arxiv: "https://arxiv.org/abs/2608.26187", code: "https://github.com/EEthanShi/kan-jump-test" },
      tldr: "Formalizes a “jump” as a finite extension problem whose constraints rule out the canonical Kan-extension completion, and tests whether fourteen language models find the correct alternative."
    },
    {
      id: "superposition_traps", short: "Superposition traps in RL",
      title: "Self-Confirming Superposition Traps in Reinforcement Learning",
      authors: ["Dai Shi", "Andi Han", "Feng Chen", "Yiqun Duan", "Junbin Gao", "José Miguel Hernández-Lobato"],
      venue: "ICLR 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["llm"], selected: true,
      links: { arxiv: "https://arxiv.org/abs/2609.32966", code: "https://github.com/EEthanShi/self-confirming-superposition-traps" },
      tldr: "Shows that a policy's own data can induce feature interference that depresses the value of a better action and locks in a worse policy, and tests ways to break the loop."
    },
    {
      id: "pcno", short: "Paracontrolled neural operator",
      title: "Paracontrolled Neural Operator for Singular SPDEs",
      authors: ["Dai Shi", "Luke Thompson", "Andi Han", "Junbin Gao", "José Miguel Hernández-Lobato"],
      venue: "ICLR 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["stochastic"],
      links: {}
    },
    {
      id: "sketches_nystrom", short: "Reusing random sketches",
      title: "The Geometry of Reusing Random Sketches: Pathwise-Certified Riemannian Nyström–Newton Methods",
      authors: ["Dai Shi", "Xiaoyu Li", "Andi Han"],
      venue: "AAAI 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["geometry"],
      links: {}
    },
    {
      id: "flat_minima", short: "Flat-minima selection",
      title: "How Do Stochastic Optimizers Select Within Flat Minima? An Intrinsic Riemannian Theory",
      authors: ["Dai Shi", "Xiaoyu Li", "Luke Thompson", "José Miguel Hernández-Lobato", "Andi Han"],
      venue: "AAAI 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["geometry"],
      links: {}
    },
    {
      id: "anchoring_stiefel", short: "Anchoring on the Stiefel manifold",
      title: "When Does Anchoring Help in Random Submanifold Descent? A Minimax Law on the Stiefel Manifold",
      authors: ["Xiaoyu Li", "Luke Thompson", "Dai Shi", "Jiaojiao Jiang", "Junbin Gao", "Andi Han"],
      venue: "AAAI 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["geometry"],
      links: {}
    },
    {
      id: "muon_polar", short: "Muon's spectral core",
      title: "Exact Polar Is Not a Statistical Surrogate for Fixed-Depth Newton–Schulz: A Population-Risk Separation for the Spectral Core of Muon",
      authors: ["Xiaoyu Li", "L. Zhao", "Zhizhou Sha", "Dai Shi", "José Miguel Hernández-Lobato", "Andi Han"],
      venue: "AAAI 2027", type: "conference", status: "under_review", year: 2026,
      topics: ["geometry"],
      links: {}
    },

    /* ---------------- 2026 ---------------- */
    {
      id: "s3gnn", short: "S³GNN", shortHtml: "S<sup>3</sup>GNN",
      title: "S3GNN: Efficient Global Mixing and Local Message Passing for Long-Range Graph Learning",
      titleHtml: "S<sup>3</sup>GNN: Efficient Global Mixing and Local Message Passing for Long-Range Graph Learning",
      authors: ["Dai Shi*", "Luke Thompson*", "Linhan Luo*", "Lequan Lin", "Andi Han", "Junbin Gao", "José Miguel Hernández-Lobato"],
      venue: "ICML 2026", award: "Spotlight", type: "conference", status: "published", year: 2026,
      topics: ["graph"], selected: true,
      links: { paper: "https://proceedings.mlr.press/v306/shi26t.html", arxiv: "https://arxiv.org/abs/2605.23467", openreview: "https://openreview.net/forum?id=9SCVnAxoKK", code: "https://github.com/EEthanShi/S3-GNN" },
      tldr: "A lightweight global–local graph architecture with GCN-level layer cost and no eigendecomposition. It cuts error by up to an order of magnitude with up to 50% fewer parameters on long-range graph benchmarks, knowledge-graph QA and mesh-based fluid dynamics."
    },
    {
      id: "chaos", short: "Expanding the Chaos",
      title: "Expanding the Chaos: Neural Operator for Stochastic (Partial) Differential Equations",
      authors: ["Dai Shi*", "Lequan Lin*", "Andi Han*", "Luke Thompson*", "José Miguel Hernández-Lobato", "Zhiyong Wang", "Junbin Gao"],
      venue: "ICML 2026", type: "conference", status: "published", year: 2026,
      topics: ["stochastic"], selected: true,
      links: { paper: "https://proceedings.mlr.press/v306/shi26i.html", arxiv: "https://arxiv.org/abs/2601.01021", openreview: "https://openreview.net/forum?id=uZWpKAqjEg", code: "https://github.com/EEthanShi/SDENO" },
      tldr: "Projects the driving noise onto Wiener-chaos features and learns the expansion coefficients with neural operators, reconstructing SDE/SPDE solution paths in one forward pass; applied to scientific solvers, diffusion sampling, financial extrapolation and flood forecasting."
    },
    {
      id: "bnrde", short: "Branched neural RDEs",
      title: "Learning Manifold and Itô Dynamics with Branched Neural Rough Differential Equations",
      authors: ["Luke Thompson*", "Dai Shi*", "Lequan Lin", "Junbin Gao", "Andi Han"],
      venue: "ICML 2026", type: "conference", status: "published", year: 2026,
      topics: ["stochastic", "geometry"], selected: true,
      links: { paper: "https://proceedings.mlr.press/v306/thompson26a.html", arxiv: "https://arxiv.org/abs/2606.05272", openreview: "https://openreview.net/forum?id=k2DxnK87ml", code: "https://github.com/luke-a-thompson/Branched-Neural-Rough-Differential-Equations" },
      tldr: "Extends neural rough differential equations to branched rough paths, so one model can learn Itô-type and manifold-valued dynamics while preserving geometric constraints in volatility, SO(3) and covariance forecasting."
    },
    {
      id: "relgs", short: "RelGS",
      title: "RelGS: Relation-Aware Gaussian Splatting for Open-Vocabulary 3D Scene Understanding",
      authors: ["Kai Zhao*", "Dai Shi*", "Yixin Chen", "Ye Wang", "Oula Ghannoum", "Yi Guo"],
      venue: "NeurIPS 2026", type: "conference", status: "published", year: 2026,
      topics: ["llm"], selected: true,
      links: { paper: "https://neurips.cc/virtual/2026/poster/155343", openreview: "https://openreview.net/forum?id=6Jo2q08Opd" },
      tldr: "A 3D Gaussian-splatting scene representation with object nodes, verified attributes and an LLM-checked relation graph, so that language queries about attributes and spatial relations can locate objects."
    },
    {
      id: "spdebench", short: "SPDEBench",
      title: "SPDEBench: An Extensive Benchmark for Learning Stochastic PDEs",
      authors: ["Yuantu Zhu*", "Zheyan Li*", "Dai Shi", "Luke Thompson", "Oliver Nash", "Jose Miguel Lara Rangel", "Siran Li", "Bingguang Chen", "Rongchan Zhu", "Qi Meng", "Hao Ni"],
      venue: "NeurIPS 2026", type: "conference", status: "published", year: 2026,
      topics: ["stochastic", "science"], selected: true,
      links: { paper: "https://neurips.cc/virtual/2026/poster/139762", arxiv: "https://arxiv.org/abs/2505.18511", code: "https://github.com/DeepIntoStreams/SPDEBench", video: "#video-spdebench" },
      tldr: "The first benchmark covering both regular and singular SPDEs: ready-to-use datasets with renormalization-aware data generation, baseline models including neural operators, and seven evaluation metrics."
    },
    {
      id: "loft", short: "LOFT",
      title: "LOFT: Low-Rank Orthogonal Fine-Tuning via Task-Aware Support Selection",
      authors: ["Lanxin Zhao", "Bamdev Mishra", "Pratik Jawanpuria", "Lequan Lin", "Dai Shi", "Junbin Gao", "Andi Han"],
      venue: "NeurIPS 2026", type: "conference", status: "published", year: 2026,
      topics: ["llm", "geometry"],
      links: { paper: "https://neurips.cc/virtual/2026/poster/154983", arxiv: "https://arxiv.org/abs/2605.11872", code: "https://github.com/Kris-camp/loft" }
    },
    {
      id: "atom", short: "ATOM",
      title: "ATOM: A Pretrained Neural Operator for Multitask Molecular Dynamics",
      authors: ["Luke Thompson", "Davy Guan", "Slade Matthews", "Dai Shi", "Junbin Gao", "Andi Han"],
      venue: "ICLR 2026", type: "conference", status: "published", year: 2026,
      topics: ["stochastic", "science"], selected: true,
      links: { paper: "https://iclr.cc/virtual/2026/poster/10008346", arxiv: "https://arxiv.org/abs/2510.05482", openreview: "https://openreview.net/forum?id=e9cV4xSjbR", code: "https://github.com/luke-a-thompson/ATOM" },
      tldr: "A pretrained transformer neural operator that predicts several future molecular states in parallel and generalizes to unseen molecules, released with TG80: over 2.5 million femtoseconds of trajectories across 80 compounds."
    },
    {
      id: "oversquashing", short: "Over-squashing survey",
      title: "Exposition on Over-Squashing Problem of GNNs: Current Methods, Benchmarks and Challenges",
      authors: ["Dai Shi", "Andi Han", "Lequan Lin", "Yi Guo", "Junbin Gao"],
      venue: "IEEE TPAMI", venueFull: "IEEE Transactions on Pattern Analysis and Machine Intelligence, 48(11), 2026", type: "journal", status: "published", year: 2026,
      topics: ["graph"], selected: true,
      links: { paper: "https://doi.org/10.1109/TPAMI.2026.3725957", arxiv: "https://arxiv.org/abs/2311.07073" },
      tldr: "A survey of over-squashing in message-passing GNNs: how it is formulated, three families of remedies, its links to expressive power and over-smoothing, benchmarks, and open questions."
    },
    {
      id: "prism", short: "PRISM forecasting",
      title: "Diffusion Denoised and Physics-Regularized Inter-Series Model for Long-Horizon Multivariate Time-Series Forecasting",
      authors: ["Hongwei Ma", "Jiayu Fang", "Dai Shi", "Zhiqi Shao", "Junbin Gao"],
      venue: "Information Fusion", venueFull: "Information Fusion, vol. 133, 104325, 2026", type: "journal", status: "published", year: 2026,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1016/j.inffus.2026.104325" }
    },
    {
      id: "supportcal", short: "SupportCal",
      title: "SupportCal: Label-Free Calibration of Post-Trained LLMs via Reference Support and Corroboration",
      authors: ["Linhan Luo", "Lequan Lin", "Dai Shi", "Feng Chen", "José Miguel Hernández-Lobato", "Junbin Gao"],
      venue: "NeurIPS 2026 Workshop", venueFull: "NeurIPS 2026 Workshop on AI for Stochastic Dynamics", type: "workshop", status: "published", year: 2026,
      topics: ["llm"],
      links: { arxiv: "https://arxiv.org/abs/2609.24303", openreview: "https://openreview.net/forum?id=zjBjHulxD2" }
    },
    {
      id: "extragradient", short: "Coupling geometry of extragradient",
      title: "Same Sample or Fresh? The Coupling Geometry of Stochastic Extragradient",
      authors: ["Xiaoyu Li", "Dai Shi", "Jiaojiao Jiang", "Junbin Gao", "Andi Han"],
      venue: "NeurIPS 2026 Workshop", venueFull: "NeurIPS 2026 Workshop on AI for Stochastic Dynamics", type: "workshop", status: "published", year: 2026,
      topics: ["geometry"],
      links: { openreview: "https://openreview.net/forum?id=Tq62MyX4US" }
    },
    {
      id: "superposition_survey", short: "Superposition survey",
      title: "Feature Superposition in Neural Networks: From Theory to Practice",
      authors: ["Dai Shi", "Xiaoyu Li", "Andi Han", "José Miguel Hernández-Lobato"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2026,
      topics: ["llm"],
      links: { arxiv: "https://arxiv.org/abs/2609.06862", project: "https://github.com/EEthanShi/awesome-superposition", video: "https://www.youtube.com/watch?v=scsMqFfoiKY" }
    },
    {
      id: "ball_box", short: "The Ball and the Box",
      title: "The Ball and the Box: Two Geometries of Computation in Superposition",
      authors: ["Xiaoyu Li", "Lequan Lin", "Dai Shi", "Jiaojiao Jiang", "Junbin Gao", "Andi Han"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2026,
      topics: ["llm"],
      links: { arxiv: "https://arxiv.org/abs/2610.11744" }
    },
    {
      id: "peft_atlas", short: "Categorical atlas of PEFT",
      title: "A Categorical Atlas of Parameter-Efficient Fine-Tuning: Cones, Orbits, and Gauges",
      authors: ["Xiaoyu Li", "Zhizhou Sha", "Chiwun Yang", "Dai Shi"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2026,
      topics: ["llm"],
      links: { arxiv: "https://arxiv.org/abs/2610.12728" }
    },
    {
      id: "mistake_bounded", short: "Mistake-bounded generation",
      title: "On Computational Hardness of Mistake-Bounded Language Generation: A Random-Oracle Query Separation",
      authors: ["Xiaoyu Li", "Andi Han", "Dai Shi", "Jiaojiao Jiang", "Junbin Gao"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2026,
      topics: ["llm"],
      links: { arxiv: "https://arxiv.org/abs/2608.05029" }
    },
    {
      id: "flood_harvest", short: "Flood and Harvest",
      title: "Flood and Harvest: The Provable Necessity of Trivia for Generating Valuable Mathematics via the Lens of Language Generation in the Limit",
      authors: ["Xiaoyu Li", "Andi Han", "Dai Shi", "Zheng Gao", "Jiaojiao Jiang", "Junbin Gao"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2026,
      topics: ["llm"],
      links: { arxiv: "https://arxiv.org/abs/2606.14688" }
    },
    {
      id: "concord", short: "CONCORD forecasting",
      title: "Concept-Oriented Graph-Coupled Dynamics for Forecasting",
      authors: ["Junbin Gao", "Hongwei Ma", "Dai Shi", "Minh-Ngoc Tran"],
      venue: "Research Square", type: "preprint", status: "preprint", year: 2026,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.21203/rs.3.rs-9264919/v1" }
    },
    {
      id: "wcno_singular", short: "Wiener-chaos NO for singular SPDEs",
      title: "Wiener Chaos Expansion based Neural Operator for Singular Stochastic Partial Differential Equations",
      authors: ["Dai Shi", "Luke Thompson", "Andi Han", "Peiyan Hu", "Junbin Gao", "José Miguel Hernández-Lobato"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2026,
      topics: ["stochastic"],
      links: { arxiv: "https://arxiv.org/abs/2603.08219" }
    },

    /* ---------------- 2025 ---------------- */
    {
      id: "act", short: "ACT as Human",
      title: "ACT as Human: Multimodal Large Language Model Data Annotation with Critical Thinking",
      authors: ["Lequan Lin", "Dai Shi", "Andi Han", "Feng Chen", "Qiuzheng Chen", "Jiawen Li", "Zhaoyang Li", "Jiyuan Zhang", "Zhenbang Sun", "Junbin Gao"],
      venue: "NeurIPS 2025", type: "conference", status: "published", year: 2025,
      topics: ["llm"], selected: true,
      links: { paper: "https://proceedings.neurips.cc/paper_files/paper/2025/hash/22bbfc36cb32d0baf7cd1c832da6f5e9-Abstract-Conference.html", arxiv: "https://arxiv.org/abs/2511.09833", openreview: "https://openreview.net/forum?id=V1FlwrsseI" },
      tldr: "An annotator–judge–human-review pipeline in which multimodal LLMs label data and flag likely errors for people to check. Models trained on its labels stay within 2% of those trained on fully human labels on most benchmarks, while human annotation cost falls by up to 90%."
    },
    {
      id: "dmdgnn", short: "DMD-GNN",
      title: "When Graph Neural Networks Meet Dynamic Mode Decomposition",
      authors: ["Dai Shi*", "Lequan Lin*", "Andi Han", "Zhiyong Wang", "Yi Guo", "Junbin Gao"],
      venue: "ICLR 2025", type: "conference", status: "published", year: 2025,
      topics: ["graph", "stochastic"], selected: true,
      links: { arxiv: "https://arxiv.org/abs/2410.05593", openreview: "https://openreview.net/forum?id=duGygkA3QR", code: "https://github.com/EEthanShi/Graph-DMD" },
      tldr: "Connects GNN feature propagation with Koopman theory and uses dynamic mode decomposition to estimate a low-rank operator, giving models for directed, large-scale, long-range, spatio-temporal and link-prediction tasks."
    },
    {
      id: "gnndiff", short: "GNN-Diff",
      title: "Diffusing to the Top: Boost Graph Neural Networks with Minimal Hyperparameter Tuning",
      authors: ["Lequan Lin*", "Dai Shi*", "Andi Han", "Zhiyong Wang", "Junbin Gao"],
      venue: "ICLR 2025", type: "conference", status: "published", year: 2025,
      topics: ["graph"], selected: true,
      links: { arxiv: "https://arxiv.org/abs/2410.05697", openreview: "https://openreview.net/forum?id=D756s2YQ6b", code: "https://github.com/lequanlin/GNN-Diff" },
      tldr: "A graph-conditioned latent diffusion model (GNN-Diff) that generates strong GNN weights from checkpoints of a coarse hyperparameter search, validated in 166 experiments across 10 architectures and 20 datasets."
    },
    {
      id: "ufgtime", short: "UFGTime",
      title: "UFGTime: Mining Intertwined Dependencies in Multivariate Time Series via an Efficient Pure Graph Approach",
      authors: ["Ruikun Li*", "Dai Shi*", "Ye Xiao*", "Junbin Gao"],
      venue: "PVLDB 2025", venueFull: "Proceedings of the VLDB Endowment, 18(9), 2025", type: "journal", status: "published", year: 2025,
      topics: ["graph"], selected: true,
      links: { paper: "https://doi.org/10.14778/3746405.3746436", code: "https://github.com/WonderHeiYi/UFGTIME" },
      tldr: "A pure-graph model for multivariate time-series forecasting: it builds a sparse spectral graph from Fourier-transformed series and applies graph framelet message passing, forecasting at near-linear cost."
    },
    {
      id: "frameless_kd", short: "Frameless graph distillation",
      title: "Frameless Graph Knowledge Distillation",
      authors: ["Dai Shi*", "Zhiqi Shao*", "Junbin Gao", "Zhiyong Wang", "Yi Guo"],
      venue: "IEEE TNNLS", venueFull: "IEEE Transactions on Neural Networks and Learning Systems, 36(5), 2025", type: "journal", status: "published", year: 2025,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1109/TNNLS.2024.3442379", arxiv: "https://arxiv.org/abs/2307.06631", code: "https://github.com/EEthanShi/Frameless_Graph_Distillation" }
    },
    {
      id: "riemannian_ground_metric", short: "Riemannian ground-metric learning",
      title: "A Riemannian Approach to Ground Metric Learning for Optimal Transport",
      authors: ["Pratik Jawanpuria", "Dai Shi", "Bamdev Mishra", "Junbin Gao"],
      venue: "ICASSP 2025", type: "conference", status: "published", year: 2025,
      topics: ["geometry"],
      links: { paper: "https://doi.org/10.1109/ICASSP49660.2025.10890250", arxiv: "https://arxiv.org/abs/2409.10085" }
    },
    {
      id: "specstg", short: "SpecSTG",
      title: "SpecSTG: A Fast Spectral Diffusion Framework for Probabilistic Spatio-Temporal Traffic Forecasting",
      authors: ["Lequan Lin", "Dai Shi", "Andi Han", "Junbin Gao"],
      venue: "IJCNN 2025", venueFull: "IJCNN 2025; also at the ICLR 2025 DeLTa Workshop", type: "conference", status: "published", year: 2025,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1109/IJCNN64981.2025.11227295", arxiv: "https://arxiv.org/abs/2401.08119", openreview: "https://openreview.net/forum?id=GZpNzgf0ic", code: "https://github.com/lequanlin/SpecSTG" }
    },
    {
      id: "quasi_framelets", short: "Quasi-framelets",
      title: "Quasi-Framelets: Robust Graph Neural Networks via Adaptive Framelet Convolution",
      authors: ["Mengxi Yang", "Dai Shi", "Xuebin Zheng", "Jie Yin", "Junbin Gao"],
      venue: "IJMLC", venueFull: "International Journal of Machine Learning and Cybernetics, 16(2), 2025", type: "journal", status: "published", year: 2025,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1007/s13042-024-02286-1", arxiv: "https://arxiv.org/abs/2201.04728", code: "https://github.com/mengxang/quasi-framelet" }
    },
    {
      id: "design_universe", short: "Design your own universe",
      title: "Design Your Own Universe: A Physics-Informed Agnostic Method for Enhancing Graph Neural Networks",
      authors: ["Dai Shi*", "Andi Han*", "Lequan Lin*", "Yi Guo", "Zhiyong Wang", "Junbin Gao"],
      venue: "IJMLC", venueFull: "International Journal of Machine Learning and Cybernetics, 16(2), 2025", type: "journal", status: "published", year: 2025,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1007/s13042-024-02326-w", arxiv: "https://arxiv.org/abs/2401.14580" }
    },
    {
      id: "amd_genes", short: "Key genes in AMD",
      title: "Machine Learning-Based Prediction of Key Genes Correlated to the Subretinal Lesion Severity in a Mouse Model of Age-Related Macular Degeneration",
      authors: ["Kuan Yan", "Yue Zeng", "Dai Shi", "Ting Zhang", "Dmytro Matsypura", "Mark C. Gillies", "Ling Zhu", "Junbin Gao"],
      venue: "BIOSTEC 2025", venueFull: "BIOINFORMATICS 2025, part of BIOSTEC 2025 (SciTePress)", type: "conference", status: "published", year: 2025,
      topics: ["science"],
      links: { paper: "https://doi.org/10.5220/0013245600003911", arxiv: "https://arxiv.org/abs/2409.05047" }
    },
    {
      id: "pseudotime", short: "Graph pseudotime & neural SDEs",
      title: "Graph Pseudotime Analysis and Neural Stochastic Differential Equations for Analyzing Retinal Degeneration Dynamics and Beyond",
      authors: ["Dai Shi*", "Kuan Yan*", "Lequan Lin", "Yue Zeng", "Ting Zhang", "Jialing Zhang", "Dmytro Matsypura", "Mark C. Gillies", "Ling Zhu", "Junbin Gao"],
      venue: "ICLR 2025 Workshop", venueFull: "ICLR 2025 Workshop on Machine Learning for Genomics Explorations (MLGenX)", type: "workshop", status: "published", year: 2025,
      topics: ["stochastic", "science"],
      links: { arxiv: "https://arxiv.org/abs/2502.06126", openreview: "https://openreview.net/forum?id=zeIFBzx1hf" }
    },

    /* ---------------- 2024 ---------------- */
    {
      id: "neural_diffusion_survey", short: "Neural diffusion survey",
      title: "From Continuous Dynamics to Graph Neural Networks: Neural Diffusion and Beyond",
      authors: ["Andi Han", "Dai Shi", "Lequan Lin", "Junbin Gao"],
      venue: "TMLR", award: "Survey Certification", venueFull: "Transactions on Machine Learning Research, 2024", type: "journal", status: "published", year: 2024,
      topics: ["graph"],
      links: { openreview: "https://openreview.net/forum?id=fPQSxjqa2o", arxiv: "https://arxiv.org/abs/2310.10121" }
    },
    {
      id: "plap_framelet_tmlr", short: "p-Laplacian framelet GCNs",
      title: "Revisiting Generalized p-Laplacian Regularized Framelet GCNs: Convergence, Energy Dynamic and as Non-Linear Diffusion",
      authors: ["Dai Shi*", "Zhiqi Shao*", "Yi Guo", "Qibin Zhao", "Junbin Gao"],
      venue: "TMLR", venueFull: "Transactions on Machine Learning Research, 2024", type: "journal", status: "published", year: 2024,
      topics: ["graph"],
      links: { openreview: "https://openreview.net/forum?id=q4iSLPoFe7", arxiv: "https://arxiv.org/abs/2305.15639" }
    },
    {
      id: "enhancing_framelet_plap", short: "Framelet GCNs with p-Laplacian",
      title: "Enhancing Framelet GCNs with Generalized p-Laplacian Regularization",
      authors: ["Zhiqi Shao", "Dai Shi", "Andi Han", "Andrey Vasnev", "Yi Guo", "Junbin Gao"],
      venue: "IJMLC", venueFull: "International Journal of Machine Learning and Cybernetics, 15(4), 2024", type: "journal", status: "published", year: 2024,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1007/s13042-023-01982-8", arxiv: "https://arxiv.org/abs/2210.15092", code: "https://github.com/superca729/pL-UFG" }
    },
    {
      id: "bregman_gnn", short: "Bregman GNN",
      title: "Bregman Graph Neural Network",
      authors: ["Jiayu Zhai", "Lequan Lin", "Dai Shi", "Junbin Gao"],
      venue: "ICASSP 2024", type: "conference", status: "published", year: 2024,
      topics: ["graph"],
      links: { paper: "https://doi.org/10.1109/ICASSP48485.2024.10447956", arxiv: "https://arxiv.org/abs/2309.06645", code: "https://github.com/jiayuzhai1207/BregmanGNN" }
    },

    /* ---------------- 2023 ---------------- */
    {
      id: "hrgcn", short: "GCN vs. attention expressivity",
      title: "A New Perspective on the Expressive Equivalence Between Graph Convolution and Attention Models",
      authors: ["Dai Shi", "Zhiqi Shao", "Andi Han", "Yi Guo", "Junbin Gao"],
      venue: "ACML 2023", venueFull: "Asian Conference on Machine Learning, PMLR 222", type: "conference", status: "published", year: 2023,
      topics: ["graph"],
      links: { paper: "https://proceedings.mlr.press/v222/shi24a.html", code: "https://github.com/EEthanShi/HRGCN-high-rank-GCN-" }
    },
    {
      id: "fplm", short: "Fixed point Laplacian mapping",
      title: "Fixed Point Laplacian Mapping: A Geometrically Correct Manifold Learning Algorithm",
      authors: ["Dai Shi", "Andi Han", "Yi Guo", "Junbin Gao"],
      venue: "IJCNN 2023", type: "conference", status: "published", year: 2023,
      topics: ["geometry"],
      links: { paper: "https://doi.org/10.1109/IJCNN54540.2023.10191488", arxiv: "https://arxiv.org/abs/2106.01608", code: "https://github.com/EEthanShi/Fixed-Point-Laplacian-Mapping-A-Geometrically-Correct-Manifold-Learning-Algorithm" }
    },
    {
      id: "unify_oversmoothing", short: "Over-smoothing vs. over-squashing",
      title: "Unifying Over-Smoothing and Over-Squashing in Graph Neural Networks: A Physics Informed Approach and Beyond",
      authors: ["Zhiqi Shao", "Dai Shi", "Andi Han", "Yi Guo", "Qibin Zhao", "Junbin Gao"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2023,
      topics: ["graph"],
      links: { arxiv: "https://arxiv.org/abs/2309.02769", code: "https://github.com/EEthanShi/G_MHKG" }
    },
    {
      id: "curvature_framelet", short: "Curvature and framelet GCNs",
      title: "How Curvature Enhance the Adaptation Power of Framelet GCNs",
      authors: ["Dai Shi", "Yi Guo", "Zhiqi Shao", "Junbin Gao"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2023,
      topics: ["graph"],
      links: { arxiv: "https://arxiv.org/abs/2307.09768", code: "https://github.com/EEthanShi/curvature_enhanced_graph_convolution" }
    },

    /* ---------------- 2022 and earlier ---------------- */
    {
      id: "framelet_energy", short: "Framelet energy & gradient flow",
      title: "Generalized Energy and Gradient Flow via Graph Framelets",
      authors: ["Andi Han", "Dai Shi", "Zhiqi Shao", "Junbin Gao"],
      venue: "arXiv", type: "preprint", status: "preprint", year: 2022,
      topics: ["graph"],
      links: { arxiv: "https://arxiv.org/abs/2210.04124" }
    },
    {
      id: "cmm_ot", short: "Coupling matrix manifolds",
      title: "Coupling Matrix Manifolds Assisted Optimization for Optimal Transport Problems",
      authors: ["Dai Shi", "Junbin Gao", "Xia Hong", "S. T. Boris Choy", "Zhiyong Wang"],
      venue: "Machine Learning", venueFull: "Machine Learning (Springer), 110(3), 2021", type: "journal", status: "published", year: 2021,
      topics: ["geometry"], selected: true,
      links: { paper: "https://doi.org/10.1007/s10994-020-05931-2", arxiv: "https://arxiv.org/abs/1911.06905", code: "https://github.com/EEthanShi/Code-for-Coupling-Matrix-Manifolds-Assisted-Optimization-for-Optimal-Transport" },
      tldr: "Defines the manifold of coupling matrices (transport plans), derives its Riemannian geometry, and solves a range of optimal transport problems with Riemannian gradient and trust-region methods."
    }
  ]
};
