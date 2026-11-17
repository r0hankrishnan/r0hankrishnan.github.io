// Optional motion polish (pairs with effects.css). Each block is
// independent and does nothing if its element isn't on the page, so one
// file serves both pages. Delete a block to drop that effect.

// ─── Keys look pressed while Enter or Space is held ───────────────────────
// The mouse gets this from :active; keyboards don't, so .is-down (base.css)
// gives the same squish. focusout clears it if focus moves mid-press (e.g.
// a Close key that shuts its dialog on keydown).
(function keyboardPress() {
  const isPressKey = (e) => e.key === "Enter" || e.key === " ";
  const isKey = (el) => el.classList.contains("key");

  document.addEventListener("keydown", (e) => {
    if (isPressKey(e) && isKey(e.target)) e.target.classList.add("is-down");
  });
  document.addEventListener("keyup", (e) => {
    if (isPressKey(e) && isKey(e.target)) e.target.classList.remove("is-down");
  });
  document.addEventListener("focusout", (e) => {
    if (isKey(e.target)) e.target.classList.remove("is-down");
  });
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
