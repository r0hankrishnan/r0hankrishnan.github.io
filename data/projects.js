// ─── Projects content ──────────────────────────────────────────────────────
// To add a project: append an object below with the same 5 fields.
// To update: edit the fields in place. To remove: delete the object.
// Order here is the display order (most recent/relevant first).

const projectsData = [
  {
    title: "Frame Finder",
    status: "Complete, live demo available",
    demoUrl: "https://frame-finder.up.railway.app/",
    codeUrl: "https://github.com/r0hankrishnan/frame-finder",
    desc: "Semantic search for tennis racquets — plain-language queries matched to frames via a hybrid BM25 + embedding retrieval pipeline with LLM-based query parsing. Served through a FastAPI backend, deployed on Railway.",
  },
  {
    title: "Flight Delay Predictor",
    status: "Complete, live demo available",
    demoUrl: "https://phl-delay-prediction.streamlit.app/",
    codeUrl: "https://github.com/r0hankrishnan/flight-delays-prediction",
    desc: "A probability model for flight delay risk, built on a custom dataset joining BTS flight records with OpenMeteo weather data. Shipped as a FastAPI endpoint with a Streamlit demo.",
  },
  {
    title: "Datashelf",
    status: "Published, available on PyPI",
    demoUrl: "https://pypi.org/project/datashelf/",
    codeUrl: "https://github.com/r0hankrishnan/datashelf",
    desc: "A lightweight Python library for versioned tabular data storage, with hash-based deduplication.",
  },
];
