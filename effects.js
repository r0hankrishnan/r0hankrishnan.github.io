// Optional motion polish (pairs with effects.css). Each block is
// independent and does nothing if its element isn't on the page, so one
// file serves both pages. Delete a block to drop that effect.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Now block types itself out the first time it scrolls into view ───────
(function typeNowBlock() {
  const block = document.getElementById("now-block");
  if (!block || reducedMotion) return;

  // Hold the final height so the page doesn't jump while lines fill in.
  block.style.minHeight = `${block.offsetHeight}px`;

  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const texts = nodes.map((node) => node.textContent);
  nodes.forEach((node) => (node.textContent = ""));

  const CHARS_PER_TICK = 3;
  function type() {
    let i = 0;
    const timer = setInterval(() => {
      let budget = CHARS_PER_TICK;
      while (budget > 0 && i < nodes.length) {
        const node = nodes[i];
        const remaining = texts[i].length - node.textContent.length;
        const take = Math.min(budget, remaining);
        node.textContent = texts[i].slice(0, node.textContent.length + take);
        budget -= take;
        if (node.textContent.length === texts[i].length) i++;
      }
      if (i >= nodes.length) clearInterval(timer);
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
