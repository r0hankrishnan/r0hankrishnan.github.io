// Optional motion polish (pairs with effects.css). Each block is
// independent and does nothing if its element isn't on the page, so one
// file serves both pages. Delete a block to drop that effect.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Now block types itself out the first time it scrolls into view ───────
(function typeNowBlock() {
  const block = document.getElementById("now-block");
  if (!block || reducedMotion) return;

  // Wrap every character in a hidden span and reveal them in order. The text
  // keeps its full size the whole time, so the layout never shifts.
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const chars = [];
  textNodes.forEach((node) => {
    const spans = [...node.textContent].map((c) => {
      const span = document.createElement("span");
      span.className = "untyped";
      span.textContent = c;
      return span;
    });
    chars.push(...spans);
    node.replaceWith(...spans);
  });

  const CHARS_PER_TICK = 3;
  function type() {
    let i = 0;
    const timer = setInterval(() => {
      chars
        .slice(i, i + CHARS_PER_TICK)
        .forEach((span) => span.classList.remove("untyped"));
      i += CHARS_PER_TICK;
      if (i >= chars.length) clearInterval(timer);
    }, 16);
  }

  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    type();
  }, { threshold: 0.4 }).observe(block);
})();

// ─── Writing filters: one underline that slides to the active button ──────
(function slidingFilterUnderline() {
  const filters = document.querySelector(".filters");
  if (!filters) return;

  const bar = document.createElement("span");
  bar.className = "filter-indicator";
  filters.append(bar);
  filters.classList.add("has-indicator");

  function move() {
    const active = filters.querySelector("button.active");
    bar.style.left = `${active.offsetLeft}px`;
    bar.style.width = `${active.offsetWidth}px`;
    bar.style.top = `${active.offsetTop + active.offsetHeight}px`;
  }
  // script.js's click handlers run first, so `.active` is already updated.
  filters.addEventListener("click", move);
  window.addEventListener("resize", move);
  document.fonts.ready.then(move);
  move();
})();

// ─── Steam rising off the winning noodle (animated in effects.css) ────────
(function addSteam() {
  const reel = document.getElementById("reel-window");
  if (!reel) return;
  reel.insertAdjacentHTML(
    "beforeend",
    '<div class="steam" aria-hidden="true"><span></span><span></span><span></span></div>',
  );
})();
