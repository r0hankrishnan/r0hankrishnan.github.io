// ─── Sound: key pops and the on/off toggle ────────────────────────────────
// Everything is synthesized with Web Audio (no audio files). Sound is on by
// default; the "Sound" switch in the floating nav turns it off and the
// choice is remembered. Nothing ever plays on page load: the AudioContext is
// only created the first time a sound plays, which is always inside a click
// or key press (browsers require a user gesture before audio can start).
//
// Exposes `Sound.tick()` and `Sound.chime()` for the noodle reel (both do
// nothing while sound is off) and `Sound.isOn()` for game-sound.js. Remove this file (and its <script> tags) to
// make the site silent.

const Sound = (function sound() {
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
  // A sine that sweeps from one pitch to another (or holds one, if `from`
  // equals `to`) with a quick attack and an exponential decay, starting
  // `delay` seconds from now.
  function sweep(from, to, peak, seconds, delay = 0) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
    const gain = envelope(t, peak, seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  function envelope(t, peak, seconds) {
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
    sweep(380, 720, 0.07, 0.07);
  }

  // Noodle reel: a short falling click each time a cup passes the window.
  function tick() {
    if (!enabled) return;
    audio();
    sweep(1600, 1100, 0.035, 0.03);
  }

  // Noodle reel landing: two bright notes, a fifth apart (C6 then G6).
  function chime() {
    if (!enabled) return;
    audio();
    sweep(1046.5, 1046.5, 0.06, 0.35);
    sweep(1568, 1568, 0.05, 0.5, 0.09);
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

  const isOn = () => enabled;

  return { tick, chime, isOn };
})();
