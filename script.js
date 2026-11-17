// ─── Site info (email, résumé link, "now" block, copyright year) ─────────
// Values live in data/site.js (loaded before this file) as `siteData`, so
// they only need to be updated in one place.
function renderSiteInfo() {
  const email = document.getElementById("email-link");
  email.href = `mailto:${siteData.email}`;
  email.dataset.copy = siteData.email;
  document.getElementById("resume-link").href = siteData.resumeUrl;

  const yearEl = document.getElementById("copyright-year");
  if (yearEl) yearEl.textContent = siteData.copyrightYear;

  renderNow();
}

// One ledger row per field: the field name in the margin, the value beside it.
function renderNow() {
  const n = siteData.now;
  const fields = [
    ["Location", n.location],
    ["Study", n.study],
    ["Role", n.role],
    ["Building", n.building, n.buildingNote],
    ["Reading", n.reading],
  ];
  const list = document.getElementById("now-list");
  list.replaceChildren(
    ...fields.map(([name, value, note]) => {
      const row = document.createElement("div");
      row.className = "row";
      const dt = document.createElement("dt");
      dt.className = "row-margin label";
      dt.textContent = name;
      const dd = document.createElement("dd");
      dd.className = "row-body";
      dd.textContent = value;
      if (note) {
        const small = document.createElement("span");
        small.className = "now-note";
        small.textContent = note;
        dd.append(small);
      }
      row.append(dt, dd);
      return row;
    }),
  );
}
renderSiteInfo();

// ─── Copy to clipboard (delegated, works for anything rendered later) ─────
// Clicking any element with `data-copy` copies that text. `data-bubble`
// shows a "Copied" bubble above it (base.css); the status element announces
// the same thing to screen readers. If the clipboard is unavailable, the
// bubble shows the text itself so it can still be copied by hand.
const copyStatus = document.createElement("p");
copyStatus.className = "sr-only";
copyStatus.setAttribute("role", "status");
document.body.append(copyStatus);

const BUBBLE_MS = 1600;
const bubbleTimers = new WeakMap();

document.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-copy]");
  if (!el) return;
  e.preventDefault();
  const text = el.dataset.copy;

  try {
    await navigator.clipboard.writeText(text);
    el.dataset.bubble = "Copied";
    copyStatus.textContent = `Copied ${text}`;
  } catch (err) {
    el.dataset.bubble = text;
    copyStatus.textContent = `Could not copy automatically: ${text}`;
  }

  clearTimeout(bubbleTimers.get(el));
  bubbleTimers.set(
    el,
    setTimeout(() => {
      delete el.dataset.bubble;
      copyStatus.textContent = "";
    }, BUBBLE_MS),
  );
});

// ─── Shared pagination control (used by projects + writing) ───────────────
// Rebuilds the Previous / Next nav after `afterEl`, or removes it when
// everything fits on one page. Because the buttons are rebuilt on every
// page change, focus is moved to the new button in the same spot (or the
// other one if that spot is now disabled) so keyboard users don't lose
// their place.
function renderPagination({ afterEl, id, label, page, totalPages, onChange }) {
  const old = document.getElementById(id);
  let focusedText = null;
  if (old && old.contains(document.activeElement)) {
    focusedText = document.activeElement.textContent;
  }
  if (old) old.remove();
  if (totalPages <= 1) return;

  const nav = document.createElement("nav");
  nav.id = id;
  nav.className = "pagination";
  nav.setAttribute("aria-label", label);

  const prev = makePageButton("Previous", page === 1, () => onChange(page - 1));
  const next = makePageButton("Next", page === totalPages, () =>
    onChange(page + 1),
  );
  const info = document.createElement("span");
  info.className = "label";
  info.textContent = `Page ${page} of ${totalPages}`;

  nav.append(prev, info, next);
  afterEl.after(nav);

  if (focusedText) {
    let target = focusedText === "Next" ? next : prev;
    if (target.disabled) target = target === next ? prev : next;
    target.focus();
  }
}

function makePageButton(text, disabled, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key key-sm";
  button.textContent = text;
  button.disabled = disabled;
  button.addEventListener("click", onClick);
  return button;
}

// ─── Projects ──────────────────────────────────────────────────────────────
// Content lives in data/projects.js (loaded before this file) as `projectsData`.

const PROJECTS_PAGE_SIZE = 3;
let currentProjectsPage = 1;

// One primary action per project. With `install`, the copyable command is
// the primary key and the demo link steps down to a secondary key.
function projectActions(p) {
  const demoText = p.demoLabel || "Try the demo";
  if (!p.install) {
    return `<a class="key primary" href="${p.demoUrl}" target="_blank" rel="noopener">${demoText}</a>`;
  }
  return `
    <button type="button" class="key primary cmd" data-copy="${p.install}"><span class="sr-only">Copy </span>${p.install}</button>
    <a class="key" href="${p.demoUrl}" target="_blank" rel="noopener">${demoText}</a>`;
}

function renderProjects() {
  const list = document.getElementById("project-list");
  const totalPages = Math.ceil(projectsData.length / PROJECTS_PAGE_SIZE);
  const page = projectsData.slice(
    (currentProjectsPage - 1) * PROJECTS_PAGE_SIZE,
    currentProjectsPage * PROJECTS_PAGE_SIZE,
  );

  list.innerHTML = page
    .map(
      (p) => `
    <article class="row project">
      <div class="row-margin">
        <span class="label">${p.status}</span>
        <a href="${p.codeUrl}" target="_blank" rel="noopener">Code<span class="sr-only"> for ${p.title}</span></a>
      </div>
      <div class="row-body">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <p class="keys">${projectActions(p)}</p>
      </div>
    </article>
  `,
    )
    .join("");

  renderPagination({
    afterEl: list,
    id: "projects-pagination",
    label: "Projects pages",
    page: currentProjectsPage,
    totalPages,
    onChange: (newPage) => {
      currentProjectsPage = newPage;
      renderProjects();
    },
  });
}

renderProjects();

// ─── Writing: filter, paginate ────────────────────────────────────────────
// Posts live in data/posts.js (loaded before this file) as `postsData`.
const PAGE_SIZE = 5;
let activeSource = null; // null means all sources
let currentPage = 1;

// "2024-10-18" → "Oct 2024". Dates are read as UTC so a post never shows up
// a day (or a month) early in western timezones.
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getFiltered() {
  let posts = postsData;
  if (activeSource) posts = posts.filter((p) => p.source === activeSource);
  // ISO dates sort correctly as plain strings.
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
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
    const msg = activeSource
      ? `Nothing on ${activeSource} yet.`
      : "Nothing here yet. Check back soon.";
    list.innerHTML = `<p class="row empty">${msg}</p>`;
    document.getElementById("writing-pagination")?.remove();
    return;
  }

  list.innerHTML = page
    .map(
      (p) => `
    <a class="row post" href="${p.url}" target="_blank" rel="noopener">
      <span class="row-margin">
        <span class="label">${p.source}</span>
        <span>${formatDate(p.date)}</span>
      </span>
      <span class="row-body">${p.title}</span>
    </a>
  `,
    )
    .join("");

  renderPagination({
    afterEl: list,
    id: "writing-pagination",
    label: "Writing pages",
    page: currentPage,
    totalPages: Math.ceil(total / PAGE_SIZE),
    onChange: (newPage) => {
      currentPage = newPage;
      renderWriting();
    },
  });
}

// Filter keys ("All" plus one per source) are only worth showing when
// there's more than one source. They're toggles: exactly one has
// aria-pressed="true".
function renderFilters() {
  const sources = [...new Set(postsData.map((p) => p.source))];
  if (sources.length < 2) return;

  const group = document.getElementById("post-filters");
  const buttons = [null, ...sources].map((source) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key key-sm";
    button.textContent = source || "All";
    button.setAttribute("aria-pressed", source === activeSource);
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", b === button));
      activeSource = source;
      currentPage = 1;
      renderWriting();
    });
    return button;
  });
  group.append(...buttons);
  group.hidden = false;
}

renderFilters();
renderWriting();
