// ─── Tennis ball toy (styles in toys.css) ──────────────────────────────────
// Click: the ball is hit (thwack), bounces, and lands twice (pock). The
// sounds come from sound.js and stay silent while sound is off. game.js
// opens Rally Run from the same click, timed to land after the bounce.

(function ballToy() {
  const button = document.getElementById("ball");
  if (!button) return;
  const ball = button.querySelector(".ball");
  const hasSound = typeof Sound !== "undefined";

  button.addEventListener("click", () => {
    if (hasSound) {
      Sound.thwack();
      setTimeout(() => Sound.pock(1), 350); // first landing
      setTimeout(() => Sound.pock(0.4), 700); // small second bounce
    }
    ball.classList.add("is-bouncing");
  });
  ball.addEventListener("animationend", () => {
    ball.classList.remove("is-bouncing");
  });
})();
