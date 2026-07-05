// ─── Email copy-to-clipboard ─────────────────────────────────────────────
document.querySelectorAll("a[data-copy]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const email = link.dataset.copy;
    navigator.clipboard.writeText(email).then(() => {
      const original = link.textContent;
      link.textContent = "Copied!";
      link.classList.add("copied");
      setTimeout(() => {
        link.textContent = original;
        link.classList.remove("copied");
      }, 1800);
    });
  });
});

// ─── Row hover-edge effect (delegated, covers .project and dynamic .post) ─
document.addEventListener("mouseover", (e) => {
  const row = e.target.closest(".project, .post");
  if (!row) return;
  const rect = row.getBoundingClientRect();
  const enteredFromBottom = e.clientY - rect.top > rect.height / 2;
  row.style.setProperty("--edge", enteredFromBottom ? "bottom" : "top");
});

// ─── Shared pagination control (used by projects + writing) ───────────────
function renderPaginationControls({
  afterEl,
  containerId,
  total,
  pageSize,
  page,
  onChange,
}) {
  const old = document.getElementById(containerId);
  if (old) old.remove();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return;

  const container = document.createElement("div");
  container.id = containerId;
  container.className = "pagination";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => onChange(page - 1));

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `${page} / ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => onChange(page + 1));

  container.append(prevBtn, info, nextBtn);
  afterEl.after(container);
}

// ─── Projects ──────────────────────────────────────────────────────────────
const projectsData = [
  {
    title: "Frame Finder",
    status: "in progress",
    demoUrl: "https://frame-finder.up.railway.app/",
    codeUrl: "https://github.com/r0hankrishnan/frame-finder",
    desc: "Semantic search for tennis racquets — plain-language queries matched to frames via a hybrid BM25 + embedding retrieval pipeline with LLM-based query parsing. Served through a FastAPI backend, deployed on Railway.",
  },
  {
    title: "Flight Delay Predictor",
    status: "complete",
    demoUrl: "https://phl-delay-prediction.streamlit.app/",
    codeUrl: "https://github.com/r0hankrishnan/flight-delays-prediction",
    desc: "A probability model for flight delay risk, built on a custom dataset joining BTS flight records with OpenMeteo weather data. Shipped as a FastAPI endpoint with a Streamlit demo.",
  },
  {
    title: "Datashelf",
    status: "published, PyPI",
    demoUrl: "https://pypi.org/project/datashelf/",
    codeUrl: "https://github.com/r0hankrishnan/datashelf",
    desc: "A lightweight Python library for versioned tabular data storage, with hash-based deduplication.",
  },
];

const PROJECTS_PAGE_SIZE = 3;
let currentProjectsPage = 1;

function renderProjects() {
  const list = document.getElementById("project-list");
  const total = projectsData.length;
  const page = projectsData.slice(
    (currentProjectsPage - 1) * PROJECTS_PAGE_SIZE,
    currentProjectsPage * PROJECTS_PAGE_SIZE,
  );

  list.innerHTML = page
    .map(
      (p) => `
    <div class="project">
      <div class="project-heading">
        <span>
          <a class="project-title" href="${p.demoUrl}" target="_blank" rel="noopener">${p.title}</a>
          <span class="project-status"> — ${p.status}</span>
        </span>
        <a class="project-code" href="${p.codeUrl}" target="_blank" rel="noopener">code</a>
      </div>
      <p class="project-desc">${p.desc}</p>
    </div>
  `,
    )
    .join("");

  renderPaginationControls({
    afterEl: list,
    containerId: "projects-pagination",
    total,
    pageSize: PROJECTS_PAGE_SIZE,
    page: currentProjectsPage,
    onChange: (newPage) => {
      currentProjectsPage = newPage;
      renderProjects();
    },
  });
}

renderProjects();

// ─── Writing feed: fetch, filter, paginate ────────────────────────────────
const MEDIUM_URL =
  "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@rohan.krishnan";
const SUBSTACK_URL =
  "https://api.rss2json.com/v1/api.json?rss_url=https://rohankrishnan.substack.com/feed";
const PAGE_SIZE = 5;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

let allArticles = [];
let activeFilter = "all";
let currentPage = 1;

function formatDate(str) {
  const d = new Date(str);
  return isNaN(d) ? "" : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getFiltered() {
  const base =
    activeFilter === "all"
      ? [...allArticles]
      : allArticles.filter((a) => a.sourceKey === activeFilter);
  return base.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function renderWriting() {
  const list = document.getElementById("post-list");
  const filtered = getFiltered();
  const total = filtered.length;
  const page = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (!total) {
    const msg =
      activeFilter === "all"
        ? "Nothing here yet. Check back soon."
        : `Nothing on ${activeFilter === "medium" ? "Medium" : "Substack"} yet.`;
    list.innerHTML = `<p class="post empty">${msg}</p>`;
    renderPaginationControls({
      afterEl: list,
      containerId: "writing-pagination",
      total: 0,
      pageSize: PAGE_SIZE,
      page: 1,
      onChange: () => {},
    });
    return;
  }

  list.innerHTML = page
    .map(
      (a) => `
    <a class="post" data-source="${a.sourceKey}" href="${a.link}" target="_blank" rel="noopener">
      <span class="post-title">${a.title}</span>
      <span class="post-meta">${a.source}, ${formatDate(a.pubDate)}</span>
    </a>
  `,
    )
    .join("");

  renderPaginationControls({
    afterEl: list,
    containerId: "writing-pagination",
    total,
    pageSize: PAGE_SIZE,
    page: currentPage,
    onChange: (newPage) => {
      currentPage = newPage;
      renderWriting();
    },
  });
}

Promise.all([
  fetch(MEDIUM_URL)
    .then((r) => r.json())
    .catch(() => ({ items: [] })),
  fetch(SUBSTACK_URL)
    .then((r) => r.json())
    .catch(() => ({ items: [] })),
]).then(([medium, substack]) => {
  allArticles = [
    ...(medium.items || []).map((a) => ({
      ...a,
      source: "Medium",
      sourceKey: "medium",
    })),
    ...(substack.items || []).map((a) => ({
      ...a,
      source: "Substack",
      sourceKey: "substack",
    })),
  ];
  renderWriting();
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    currentPage = 1;
    renderWriting();
  });
});
