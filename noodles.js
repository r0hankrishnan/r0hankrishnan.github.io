// ─── BACKGROUND REMOVAL (canvas flood-fill) ──────────────────────────────────
// Runs on page load for any image not yet cached. Result stored in localStorage
// keyed by src, so subsequent loads are instant.

const BG_CACHE_KEY = 'noodles-bg-cache-v2';

function getBgCache() {
  try { return JSON.parse(localStorage.getItem(BG_CACHE_KEY) || '{}'); } catch(e) { return {}; }
}

function setBgCache(cache) {
  try { localStorage.setItem(BG_CACHE_KEY, JSON.stringify(cache)); } catch(e) {}
}

async function processImages() {
  const cache = getBgCache();
  for (const img of document.querySelectorAll('.noodles-img')) {
    const src = img.getAttribute('src');
    if (!src) continue;
    if (cache[src]) { img.src = cache[src]; continue; }
    try {
      const dataUrl = await removeBg(src);
      cache[src] = dataUrl;
      setBgCache(cache);
      img.src = dataUrl;
    } catch(e) {
      console.warn('BG removal failed for', src, e);
    }
  }
}

function removeBg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { try { resolve(removeBgCanvas(img)); } catch(e) { reject(e); } };
    img.onerror = reject;
    img.src = src;
  });
}

function removeBgCanvas(img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;

  const px = (x, y) => { const i = (y*W+x)*4; return [data[i], data[i+1], data[i+2]]; };
  const corners = [px(0,0), px(W-1,0), px(0,H-1), px(W-1,H-1)];
  const bg = corners.reduce((a,c) => [a[0]+c[0], a[1]+c[1], a[2]+c[2]], [0,0,0]).map(v => Math.round(v/4));

  const TOLERANCE = 42;
  const dist = (r,g,b) => Math.sqrt((r-bg[0])**2 + (g-bg[1])**2 + (b-bg[2])**2);

  const visited = new Uint8Array(W*H);
  const toErase = new Uint8Array(W*H);
  const queue = [];

  const enqueue = (x, y) => {
    const idx = y*W+x;
    if (visited[idx]) return;
    visited[idx] = 1;
    const i = idx*4;
    if (data[i+3] === 0 || dist(data[i], data[i+1], data[i+2]) <= TOLERANCE) {
      toErase[idx] = 1; queue.push(x, y);
    }
  };

  for (let x = 0; x < W; x++) { enqueue(x, 0); enqueue(x, H-1); }
  for (let y = 0; y < H; y++) { enqueue(0, y); enqueue(W-1, y); }
  while (queue.length) {
    const y = queue.pop(), x = queue.pop();
    for (const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])
      if (nx>=0 && ny>=0 && nx<W && ny<H) enqueue(nx, ny);
  }

  for (let i = 0; i < W*H; i++) if (toErase[i]) data[i*4+3] = 0;

  // Feather edges
  for (let y = 1; y < H-1; y++)
    for (let x = 1; x < W-1; x++) {
      const idx = y*W+x;
      if (!toErase[idx] && [toErase[(y-1)*W+x], toErase[(y+1)*W+x], toErase[y*W+x-1], toErase[y*W+x+1]].some(Boolean))
        data[idx*4+3] = Math.round(data[idx*4+3] * 0.5);
    }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png', 0.9);
}

// ─── THEME ───────────────────────────────────────────────────────────────────
const root = document.documentElement;
const btn = document.getElementById('theme-toggle');
const btnSticky = document.getElementById('theme-toggle-sticky');
const saved = localStorage.getItem('theme');
const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let isDark = saved ? saved === 'dark' : sysDark;

function setToggleIcon(dark) {
  const icon = lucide.createElement(lucide.icons[dark ? 'Sun' : 'Moon']);
  icon.style.cssText = 'width:13px;height:13px;stroke:currentColor;fill:none;';
  [btn, btnSticky].forEach(b => { if (b) { b.innerHTML = ''; b.appendChild(icon.cloneNode(true)); } });
}

function applyTheme(dark) {
  isDark = dark;
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  setToggleIcon(dark);
}

btn.addEventListener('click', () => applyTheme(!isDark));
btnSticky.addEventListener('click', () => applyTheme(!isDark));
applyTheme(isDark);
lucide.createIcons();

// Build slot machine UI, then enable it once bg removal is done
// so the reel uses processed transparent images, not raw jpgs.
buildSpinUI();
document.getElementById('spin-action').disabled = true;
document.getElementById('spin-btn').style.opacity = '0.4';
document.getElementById('spin-btn').style.pointerEvents = 'none';
processImages().then(() => {
  document.getElementById('spin-action').disabled = false;
  document.getElementById('spin-btn').style.opacity = '';
  document.getElementById('spin-btn').style.pointerEvents = '';
});

// ─── SLOT MACHINE ─────────────────────────────────────────────────────────────

function buildSpinUI() {
  // ── Floating trigger button
  const spinBtn = document.createElement('button');
  spinBtn.id = 'spin-btn';
  spinBtn.textContent = 'Spin';
  document.body.appendChild(spinBtn);

  // ── Overlay + modal
  const overlay = document.createElement('div');
  overlay.id = 'spin-overlay';
  overlay.innerHTML = `
    <div id="spin-modal">
      <button id="spin-close"><i data-lucide="x"></i></button>
      <p class="spin-eyebrow">tonight's noodles</p>
      <div id="reel-window">
        <div id="reel-idle"><span>——</span></div>
        <div id="reel-strip" style="display:none"></div>
      </div>
      <p id="spin-result-label"></p>
      <button id="spin-action">Spin for noodles</button>
    </div>
  `;
  document.body.appendChild(overlay);
  lucide.createIcons();

  // ── Wire open/close
  spinBtn.addEventListener('click', () => overlay.classList.add('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.getElementById('spin-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.getElementById('spin-action').addEventListener('click', runSpin);

  function closeModal() {
    overlay.classList.remove('open');
  }
}

function getNoodleData() {
  // Scrape current processed src + label from every noodles-item on the page
  return [...document.querySelectorAll('.noodles-item')].map(el => ({
    src:   el.querySelector('.noodles-img').src,
    label: el.querySelector('.noodles-label')?.textContent.trim() ?? '',
  }));
}

async function runSpin() {
  const items = getNoodleData();
  if (!items.length) return;

  const action = document.getElementById('spin-action');
  const resultLabel = document.getElementById('spin-result-label');
  const reelWindow = document.getElementById('reel-window');
  const idle = document.getElementById('reel-idle');
  const strip = document.getElementById('reel-strip');

  action.disabled = true;
  action.textContent = 'Spinning…';
  resultLabel.style.opacity = '0';
  resultLabel.textContent = '';

  const winner = items[Math.floor(Math.random() * items.length)];

  // Build strip: several shuffled passes so the reel feels long,
  // winner locked as the very last frame.
  const REPS   = 6;
  const frameH = 110; // reel-frame 100px + 10px gap

  const reelItems = [];
  for (let i = 0; i < REPS; i++) {
    reelItems.push(...[...items].sort(() => Math.random() - 0.5));
  }
  reelItems.push(winner);

  strip.innerHTML = reelItems.map(r =>
    `<div class="reel-frame"><img src="${r.src}" alt="" /></div>`
  ).join('');

  // Reset strip to top before animating
  strip.style.transition = 'none';
  strip.style.transform  = 'translateY(0)';
  // Force reflow so the transition:none takes effect before we add the animation
  strip.getBoundingClientRect();

  idle.style.display  = 'none';
  strip.style.display = 'flex';

  // Target: winner frame centered in the 120px window (center = 60px, img = 100px so offset by 50)
  const finalIdx    = reelItems.length - 1;
  const finalOffset = -(finalIdx * frameH) + (reelWindow.clientHeight / 2 - 50);

  // Single smooth animation: cubic-bezier that starts fast and decelerates hard.
  // (0.15, 0, 0.1, 1) — slow initial acceleration, then very long ease-out tail.
  await animateReel(strip, finalOffset, 2400, 'cubic-bezier(0.15, 0, 0.1, 1)');

  // ── Result reveal: accent ring pulse on the reel window, label fades in
  reelWindow.classList.add('reel-winner');
  setTimeout(() => reelWindow.classList.remove('reel-winner'), 600);

  resultLabel.textContent = winner.label;
  resultLabel.style.opacity = '1';
  action.textContent = 'Spin again';
  action.disabled = false;
}

function animateReel(el, toY, durationMs, easing) {
  return new Promise(resolve => {
    el.style.transition = `transform ${durationMs}ms ${easing}`;
    el.style.transform  = `translateY(${toY}px)`;
    setTimeout(resolve, durationMs);
  });
}

// ── Slot machine is initialised above, after processImages resolves.