// ─── Email copy-to-clipboard ─────────────────────────────────────────────
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

// ─── Row hover-edge effect (delegated, covers .project and dynamic .post) ─
document.addEventListener('mouseover', e => {
  const row = e.target.closest('.project, .post');
  if (!row) return;
  const rect = row.getBoundingClientRect();
  const enteredFromBottom = (e.clientY - rect.top) > rect.height / 2;
  row.style.setProperty('--edge', enteredFromBottom ? 'bottom' : 'top');
});

// ─── Writing feed: fetch, filter, paginate ────────────────────────────────
const MEDIUM_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@rohan.krishnan';
const SUBSTACK_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://rohankrishnan.substack.com/feed';
const PAGE_SIZE = 6;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let allArticles = [];
let activeFilter = 'all';
let currentPage = 1;

function formatDate(str) {
  const d = new Date(str);
  return isNaN(d) ? '' : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getFiltered() {
  const base = activeFilter === 'all'
    ? [...allArticles]
    : allArticles.filter(a => a.sourceKey === activeFilter);
  return base.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function renderWriting() {
  const list = document.getElementById('post-list');
  const filtered = getFiltered();
  const total = filtered.length;
  const page = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!total) {
    const msg = activeFilter === 'all'
      ? 'Nothing here yet. Check back soon.'
      : `Nothing on ${activeFilter === 'medium' ? 'Medium' : 'Substack'} yet.`;
    list.innerHTML = `<p class="post empty">${msg}</p>`;
    renderPagination(0);
    return;
  }

  list.innerHTML = page.map(a => `
    <a class="post" data-source="${a.sourceKey}" href="${a.link}" target="_blank" rel="noopener">
      <span class="post-title">${a.title}</span>
      <span class="post-meta">${a.source}, ${formatDate(a.pubDate)}</span>
    </a>
  `).join('');

  renderPagination(total);
}

function renderPagination(total) {
  const old = document.getElementById('writing-pagination');
  if (old) old.remove();

  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;

  const container = document.createElement('div');
  container.id = 'writing-pagination';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; renderWriting(); });

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `${currentPage} / ${totalPages}`;

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; renderWriting(); });

  container.append(prevBtn, info, nextBtn);
  document.getElementById('post-list').after(container);
}

Promise.all([
  fetch(MEDIUM_URL).then(r => r.json()).catch(() => ({ items: [] })),
  fetch(SUBSTACK_URL).then(r => r.json()).catch(() => ({ items: [] })),
]).then(([medium, substack]) => {
  allArticles = [
    ...(medium.items   || []).map(a => ({ ...a, source: 'Medium', sourceKey: 'medium' })),
    ...(substack.items || []).map(a => ({ ...a, source: 'Substack', sourceKey: 'substack' })),
  ];
  renderWriting();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    currentPage = 1;
    renderWriting();
  });
});