// ─── Sound: key pops and the on/off toggle ────────────────────────────────
// Everything is synthesized with Web Audio (no audio files). Sound is on by
// default; the "Sound" switch in the floating nav turns it off and the
// choice is remembered. Nothing ever plays on page load: the AudioContext is
// only created the first time a sound plays, which is always inside a click
// or key press (browsers require a user gesture before audio can start).
//
// Remove this file (and its <script> tags) to make the site silent.

(function sound() {
  const STORAGE_KEY = "sounds";
  let enabled = loadEnabled();
  let ctx = null;

  // ─── Preference (best effort; storage can be unavailable) ──────────────
  function loadEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch (e) {
      return true;
    }
  }
  function saveEnabled() {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch (e) {}
  }

  // ─── Audio, created on first use ───────────────────────────────────────
  function audio() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // ─── Building blocks ───────────────────────────────────────────────────
  // A sine that sweeps from one pitch to another with a quick attack and
  // an exponential decay.
  function sweep(from, to, peak, seconds, out) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
    const gain = envelope(peak, seconds);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  function envelope(peak, seconds) {
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    return gain;
  }

  // ─── The sounds (values tuned by ear) ──────────────────────────────────
  // Key press: a soft rising pop.
  function pop() {
    if (!enabled) return;
    audio();
    sweep(380, 720, 0.07, 0.07, ctx.destination);
  }

  // ─── Key pops: pointer down, or Enter/Space on a focused key ───────────
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".key")) pop();
  });
  document.addEventListener("keydown", (e) => {
    const pressKey = e.key === "Enter" || e.key === " ";
    if (pressKey && !e.repeat && e.target.classList.contains("key")) pop();
  });

  // ─── On/off switch in the floating nav ─────────────────────────────────
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "sound-toggle";
    toggle.className = "sound-switch";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-label", "Sound");
    toggle.innerHTML =
      '<span class="sound-switch-label">Sound</span><span class="sound-switch-track"></span>';
    const showState = () => toggle.setAttribute("aria-checked", enabled);
    toggle.addEventListener("click", () => {
      enabled = !enabled;
      saveEnabled();
      showState();
      if (enabled) pop(); // so you hear what you turned on
    });
    showState();
    nav.append(toggle);
  }
})();
