// ─── Sound: key pops, ball sounds, and the footer toggle ───────────────────
// Everything is synthesized with Web Audio (no audio files). Sound is off by
// default; the "Sounds" key in the footer turns it on and the choice is
// remembered. The AudioContext is only created the first time a sound
// actually plays, which is always inside a click or key press (browsers
// require a user gesture before audio can start).
//
// Exposes `Sound.thwack()` and `Sound.pock(scale)` for toys.js. Both do
// nothing while sound is off. Remove this file (and its <script> tags) to
// make the site silent.

const Sound = (() => {
  const STORAGE_KEY = "sounds";
  let enabled = loadEnabled();
  let ctx = null;
  let ballBus = null; // tennis sounds go through a reverb ("stadium echo")

  // ─── Preference (best effort; storage can be unavailable) ──────────────
  function loadEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "on";
    } catch (e) {
      return false;
    }
  }
  function saveEnabled() {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch (e) {}
  }

  // ─── Audio graph, built on first use ───────────────────────────────────
  function audio() {
    if (!ctx) {
      ctx = new AudioContext();

      ballBus = ctx.createGain();
      ballBus.connect(ctx.destination); // dry

      const reverb = ctx.createConvolver();
      reverb.buffer = impulse(1.6);
      const wet = ctx.createGain();
      wet.gain.value = 0.45;
      ballBus.connect(reverb);
      reverb.connect(wet);
      wet.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // A reverb impulse: stereo noise that fades out as (1 - t)^3.
  function impulse(seconds) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
      }
    }
    return buffer;
  }

  // ─── Two building blocks ───────────────────────────────────────────────
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

  // A short burst of filtered white noise.
  function noise(filterType, frequency, q, peak, seconds, out) {
    const t = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = envelope(peak, seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    source.start(t);
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

  // Racquet hitting the ball: a round body, a low thump, a crisp click of
  // strings, and a little felt.
  function thwack() {
    if (!enabled) return;
    audio();
    sweep(440, 140, 0.45, 0.09, ballBus);
    sweep(200, 85, 0.3, 0.12, ballBus);
    noise("bandpass", 2500, 0.8, 0.32, 0.03, ballBus);
    noise("lowpass", 900, 1, 0.22, 0.05, ballBus);
  }

  // Ball landing; `scale` makes later bounces quieter.
  function pock(scale = 1) {
    if (!enabled) return;
    audio();
    sweep(300, 150, 0.26 * scale, 0.06, ballBus);
    noise("bandpass", 1200, 1, 0.14 * scale, 0.03, ballBus);
  }

  // ─── Key pops: pointer down, or Enter/Space on a focused key ───────────
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".key")) pop();
  });
  document.addEventListener("keydown", (e) => {
    const pressKey = e.key === "Enter" || e.key === " ";
    if (pressKey && !e.repeat && e.target.classList.contains("key")) pop();
  });

  // ─── Footer toggle ─────────────────────────────────────────────────────
  const footerLinks = document.querySelector(".footer-links");
  if (footerLinks) {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "sound-toggle";
    toggle.className = "key key-sm";
    const showState = () => {
      toggle.setAttribute("aria-pressed", enabled);
      toggle.innerHTML = `Sounds <small>${enabled ? "on" : "off"}</small>`;
    };
    toggle.addEventListener("click", () => {
      enabled = !enabled;
      saveEnabled();
      showState();
      // Turning sound on pops once so you hear what you turned on. (Turning
      // it off already popped on the press, while sound was still on.)
      if (enabled) pop();
    });
    showState();
    footerLinks.append(toggle);
  }

  return { thwack, pock };
})();
