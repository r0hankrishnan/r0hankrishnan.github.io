/* ── Theme — persisted via localStorage ─────────────
    Reads saved preference on load, falls back to
    system preference. Saves on every toggle.
─────────────────────────────────────────────────── */
const root = document.documentElement;
const btn = document.getElementById('theme-toggle');
const btnSticky = document.getElementById('theme-toggle-sticky');
const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const saved = localStorage.getItem('theme');
let isDark = saved ? saved === 'dark' : false;

function setToggleIcon(dark) {
  const newIcon = lucide.createElement(lucide.icons[dark ? 'Sun' : 'Moon']);
  newIcon.style.cssText = 'width:13px;height:13px;stroke:currentColor;fill:none;';
  [btn, btnSticky].forEach(b => {
    if (b) { b.innerHTML = ''; b.appendChild(newIcon.cloneNode(true)); }
  });
}
function applyTheme(dark) {
isDark = dark;
root.setAttribute('data-theme', dark ? 'dark' : 'light');
localStorage.setItem('theme', dark ? 'dark' : 'light');
setToggleIcon(dark);
}

btn.addEventListener('click', () => applyTheme(!isDark));
btnSticky.addEventListener('click', () => applyTheme(!isDark));

/* ── Sticky nav — shows when header scrolls out ──── */
const stickyNav = document.getElementById('sticky-nav');
const siteHeader = document.getElementById('site-header');

const headerObserver = new IntersectionObserver(
  ([entry]) => {
    const hidden = !entry.isIntersecting;
    stickyNav.classList.toggle('visible', hidden);
    btn.style.opacity = hidden ? '0' : '1';
    btn.style.pointerEvents = hidden ? 'none' : 'auto';
  },
  { threshold: 0 }
);
headerObserver.observe(siteHeader);


/* ── Email copy — all [data-copy] anchors ───────────
    Clicking copies the data-copy value to clipboard
    and briefly shows "Copied!" as feedback.
─────────────────────────────────────────────────── */
document.querySelectorAll('a[data-copy]').forEach(link => {
link.addEventListener('click', e => {
    e.preventDefault();
    const email = link.dataset.copy;
    navigator.clipboard.writeText(email).then(() => {
    const original = link.textContent;
    link.textContent = 'Copied!';
    link.classList.add('copied');
    setTimeout(() => {
        link.textContent = original;
        link.classList.remove('copied');
    }, 1800);
    });
});
});


/* ── Articles + filters + pagination ─────────────── */
const MEDIUM_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@rohan.krishnan';
const SUBSTACK_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://rohankrishnan.substack.com/feed';
const PAGE_SIZE = 6;

let allArticles = [];
let activeSource = 'all';
let currentPage = 1;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(str) {
const d = new Date(str);
return isNaN(d) ? '' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getFiltered() {
const base = activeSource === 'all'
    ? [...allArticles]
    : allArticles.filter(a => a.source === activeSource);
return base.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function renderArticles() {
const list = document.getElementById('article-list');
const filtered = getFiltered();
const total = filtered.length;
const page = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

if (!total) {
    list.innerHTML = `<p style="font-size:0.9rem;color:var(--muted);padding:18px 0;border-bottom:1px solid var(--rule)">No articles yet.</p>`;
    renderPagination(0);
    return;
}

list.innerHTML = page.map(a => `
    <a class="article" href="${a.link}" target="_blank" rel="noopener">
    <div class="article-meta">
        <span class="article-source">${a.source}</span>
        <span class="article-title">${a.title}</span>
    </div>
    <span class="article-date">${formatDate(a.pubDate)}</span>
    </a>
`).join('');

renderPagination(total);
}

function renderPagination(total) {
const old = document.getElementById('article-pagination');
if (old) old.remove();

const totalPages = Math.ceil(total / PAGE_SIZE);
if (totalPages <= 1) return;

const container = document.createElement('div');
container.id = 'article-pagination';
container.style.cssText = `
    display: flex; gap: 8px; align-items: center;
    padding: 20px 0 4px; font-family: var(--sans);
    font-size: 0.6rem; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--muted);
`;

const prevBtn = document.createElement('button');
prevBtn.textContent = '← Prev';
prevBtn.disabled = currentPage === 1;
stylePageBtn(prevBtn);
prevBtn.addEventListener('click', () => { currentPage--; renderArticles(); });

const info = document.createElement('span');
info.textContent = `${currentPage} / ${totalPages}`;
info.style.cssText = 'flex: 1; text-align: center;';

const nextBtn = document.createElement('button');
nextBtn.textContent = 'Next →';
nextBtn.disabled = currentPage === totalPages;
stylePageBtn(nextBtn);
nextBtn.addEventListener('click', () => { currentPage++; renderArticles(); });

container.append(prevBtn, info, nextBtn);
document.getElementById('article-list').after(container);
}

function stylePageBtn(btn) {
btn.style.cssText = `
    font-family: var(--sans); font-size: 0.6rem; font-weight: 300;
    letter-spacing: 0.12em; text-transform: uppercase;
    background: none; border: 1px solid var(--rule);
    color: var(--muted); padding: 5px 10px; cursor: pointer;
    border-radius: 2px; transition: opacity 0.2s;
`;
btn.onmouseenter = () => { if (!btn.disabled) btn.style.opacity = '0.6'; };
btn.onmouseleave = () => { btn.style.opacity = '1'; };
if (btn.disabled) btn.style.opacity = '0.3';
}

Promise.all([
fetch(MEDIUM_URL).then(r => r.json()).catch(() => ({ items: [] })),
fetch(SUBSTACK_URL).then(r => r.json()).catch(() => ({ items: [] })),
]).then(([medium, substack]) => {
allArticles = [
    ...(medium.items   || []).map(a => ({ ...a, source: 'Medium' })),
    ...(substack.items || []).map(a => ({ ...a, source: 'Substack' })),
];
renderArticles();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeSource = btn.dataset.source;
    currentPage  = 1;
    renderArticles();
});
});


/* ── Section tracking — drives all nav indicators ── */
const snavItems = document.querySelectorAll('.snav-item');
const allSections = document.querySelectorAll('section[id]');
const headerLinks = document.querySelectorAll('.header-nav a[href^="#"]');
const stickyLinks = document.querySelectorAll('.sticky-links a[href^="#"]');

function setActiveSection(id) {
[snavItems, headerLinks, stickyLinks].forEach(group => {
    group.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
});
}

allSections.forEach(s => {
new IntersectionObserver(entries => {
    entries.forEach(entry => {
    if (entry.isIntersecting) setActiveSection(entry.target.id);
    });
}, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
});

/* ── Lucide icons ─────────────────────────────────
    createIcons() first (renders all data-lucide els),
    then applyTheme overwrites the toggle icon correctly.
─────────────────────────────────────────────────── */
lucide.createIcons();
applyTheme(isDark);
