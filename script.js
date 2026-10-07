// ─── Site info (email, résumé link, "now" block, copyright year) ─────────
// Values live in data/site.js (loaded before this file) as `siteData`, so
// they only need to be updated in one place.
function renderSiteInfo() {
  document
    .querySelectorAll("#email-link-hero, #email-link-footer")
    .forEach((link) => link.setAttribute("data-copy", siteData.email));
  document
    .querySelectorAll("#resume-link-hero, #resume-link-footer")
    .forEach((link) => link.setAttribute("href", siteData.resumeUrl));

  const yearEl = document.getElementById("copyright-year");
  if (yearEl) yearEl.textContent = siteData.copyrightYear;

  const nowEl = document.getElementById("now-block");
  if (nowEl) {
    const n = siteData.now;
    const lines = [
      `now = {`,
      `  location: <span class="str">"${n.location}"</span>,`,
      `  study:    <span class="str">"${n.study}"</span>,`,
      `  role:     <span class="str">"${n.role}"</span>,`,
      `  building: <span class="str">"${n.building}"</span>,  <span class="comment">// ${n.buildingNote}</span>`,
      `  reading:  <span class="str">"${n.reading}"</span>,`,
      `}<span class="cursor"></span>`,
    ];
    nowEl.innerHTML = lines
      .map((line) => `<span class="line">${line}</span>`)
      .join("");
  }
}
renderSiteInfo();

// ─── Email copy-to-clipboard (delegated, works regardless of render order) ─
// The `.copied` class shows a "Copied" tooltip (styles.css). The status
// element announces the copy to screen readers, which can't see the tooltip.
const copyStatus = document.createElement("p");
copyStatus.setAttribute("role", "status");
copyStatus.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)";
document.body.append(copyStatus);

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-copy]");
  if (!link) return;
  e.preventDefault();
  navigator.clipboard.writeText(link.dataset.copy).then(() => {
    link.classList.add("copied");
    copyStatus.textContent = "Email address copied";
    setTimeout(() => {
      link.classList.remove("copied");
      copyStatus.textContent = "";
    }, 1800);
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
// Content lives in data/projects.js (loaded before this file) as `projectsData`.

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
        </span>
        <a class="project-code" href="${p.codeUrl}" target="_blank" rel="noopener">code</a>
      </div>
      <span class="project-status">  ${p.status}</span>
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
