// ─── Rally Run sound: an 8-bit tennis theme and three effects ──────────────
// game.js calls these if this file is loaded; delete it (and its <script>
// tag) to make the game silent. Everything follows the site's Sound switch
// (sound.js), and is synthesized with Web Audio like the rest of the site.
//
//   GameSound.startMusic()  the theme loops until stopMusic()
//   GameSound.stopMusic()
//   GameSound.serve()       a rising arpeggio when a rally starts
//   GameSound.jump()        a quick upward blip
//   GameSound.fault()       a thud and a falling tone when the ball is hit

const GameSound = (() => {
  // ─── The theme: 8 bars in C major, 150 BPM, on an eighth-note grid ─────
  const STEP = 60 / 150 / 2; // seconds per eighth note
  const STEPS_PER_BAR = 8;
  const MUSIC_VOLUME = 0.12;

  // Lead melody per bar: [step, MIDI note, length in steps]
  const MELODY = [
    [[0, 76, 1], [1, 79, 1], [2, 84, 2], [4, 83, 1], [5, 79, 1], [6, 76, 1], [7, 79, 1]],
    [[0, 81, 2], [2, 84, 2], [4, 88, 2], [6, 84, 1], [7, 81, 1]],
    [[0, 77, 1], [1, 81, 1], [2, 84, 1], [3, 81, 1], [4, 77, 1], [5, 81, 1], [6, 84, 1], [7, 86, 1]],
    [[0, 86, 2], [2, 83, 2], [4, 79, 4]],
    [[0, 84, 2], [2, 88, 2], [4, 91, 2], [6, 88, 1], [7, 84, 1]],
    [[0, 81, 1], [1, 84, 1], [2, 88, 2], [4, 86, 1], [5, 84, 1], [6, 83, 1], [7, 81, 1]],
    [[0, 77, 1], [1, 81, 1], [2, 84, 2], [4, 86, 1], [5, 83, 1], [6, 79, 2]],
    [[0, 84, 2], [2, 79, 2], [4, 84, 4]],
  ];

  // Bass root for each half bar: C, Am, F, G, C, Am, F then G, C.
  const ROOTS = [
    [48, 48],
    [45, 45],
    [41, 41],
    [43, 43],
    [48, 48],
    [45, 45],
    [41, 43],
    [48, 48],
  ];
  // Bouncing bass: root, octave, fifth, octave (semitones above the root)
  const BASS_PATTERN = [0, 12, 7, 12];

  let ctx = null;
  let noiseBuffer = null;
  let session = null; // the current play-through's gain node
  let timer = null;
  let nextBarTime = 0;
  let barCount = 0;

  const isOn = () => typeof Sound !== "undefined" && Sound.isOn();
  const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

  function audio() {
    if (!ctx) {
      ctx = new AudioContext();
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // ─── Building blocks ───────────────────────────────────────────────────

  // A single chip note: an oscillator with a short attack, a held level and
  // a quick release at the end. `glideTo` bends the pitch over the note.
  function note(type, frequency, t, length, peak, out, glideTo) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(peak * 0.7, t + Math.max(0.01, length - 0.02));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + length + 0.02);
  }

  // A burst of filtered noise (hi-hat, the fault thud).
  function noise(t, filterType, frequency, peak, length, out) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    source.start(t, Math.random() * 0.5, length + 0.02);
  }

  // ─── The theme ─────────────────────────────────────────────────────────

  function scheduleBar(count, start) {
    const bar = count % MELODY.length;
    const at = (step) => start + step * STEP;

    for (const [step, midi, steps] of MELODY[bar]) {
      note("square", freq(midi), at(step), steps * STEP * 0.9, 0.09, session);
    }
    for (let step = 0; step < STEPS_PER_BAR; step++) {
      const root = ROOTS[bar][step < 4 ? 0 : 1];
      const midi = root + BASS_PATTERN[step % 4];
      note("triangle", freq(midi), at(step), STEP * 0.85, 0.22, session);
      // Hi-hat on the off-beats
      if (step % 2 === 1) noise(at(step), "highpass", 7000, 0.035, 0.05, session);
    }
  }

  function scheduler() {
    while (nextBarTime < ctx.currentTime + 0.3) {
      scheduleBar(barCount, nextBarTime);
      nextBarTime += STEPS_PER_BAR * STEP;
      barCount++;
    }
  }

  function startMusic() {
    if (!isOn() || session) return;
    audio();
    // Each play-through gets its own gain node so notes already queued by a
    // previous one fade out with it instead of overlapping.
    session = ctx.createGain();
    session.gain.value = MUSIC_VOLUME;
    session.connect(ctx.destination);
    barCount = 0;
    nextBarTime = ctx.currentTime + 0.05;
    scheduler();
    timer = setInterval(scheduler, 100);
  }

  function stopMusic() {
    if (!session) return;
    clearInterval(timer);
    const fading = session;
    session = null;
    const now = ctx.currentTime;
    fading.gain.setValueAtTime(fading.gain.value, now);
    fading.gain.linearRampToValueAtTime(0, now + 0.15);
    setTimeout(() => fading.disconnect(), 250);
  }

  // The tab going to the background pauses the game loop, so pause the
  // music too. It comes back on the next serve.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMusic();
  });

  // ─── Effects ───────────────────────────────────────────────────────────

  function serve() {
    if (!isOn()) return;
    audio();
    const t = ctx.currentTime;
    [72, 76, 79, 84].forEach((midi, i) => {
      note("square", freq(midi), t + i * 0.06, 0.07, 0.08, ctx.destination);
    });
  }

  function jump() {
    if (!isOn()) return;
    audio();
    note("square", 260, ctx.currentTime, 0.12, 0.07, ctx.destination, 620);
  }

  function fault() {
    if (!isOn()) return;
    audio();
    const t = ctx.currentTime;
    noise(t, "lowpass", 800, 0.18, 0.15, ctx.destination);
    note("square", 600, t + 0.04, 0.5, 0.08, ctx.destination, 90);
  }

  return { startMusic, stopMusic, serve, jump, fault };
})();
