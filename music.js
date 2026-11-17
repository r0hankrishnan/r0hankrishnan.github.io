// ─── The record: a little shop-music jazz loop, synthesized live ──────────
// Clicking the record (#record, in the Now heading) starts the loop; clicking
// again stops it. It also stops when the tab is hidden. The music is an
// explicit request, so it plays even when the footer's "Sounds" toggle is
// off. The record's look is in toys.css; this file only sets aria-pressed
// and the hint text. Remove this file to make the record inert.
//
// How it plays: a timer wakes up every 100ms and, whenever the next bar is
// about to start, schedules that whole bar on the audio clock. Scheduling
// ahead on the audio clock keeps the timing tight even if the page is busy.

(function jazzRecord() {
  const record = document.getElementById("record");
  if (!record) return;
  const tip = record.querySelector(".tip");
  const restingTip = tip.textContent;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ─── The tune: 8 bars in F at 132 BPM, swung eighths ───────────────────
  const BEAT = 60 / 132; // seconds
  const SWING = 0.62; // where the off-beat eighth lands within the beat
  const BARS = 8;

  // Chord voicings (MIDI note numbers)
  const Fmaj7 = [57, 60, 64, 67];
  const D7 = [54, 60, 64, 69];
  const Gm7 = [58, 62, 65, 69];
  const C7 = [58, 62, 64, 69];
  const Am7 = [60, 64, 67, 71];
  const F6 = [57, 60, 62, 65];

  // Per bar: [beat, chord] changes.
  const CHORDS = [
    [[0, Fmaj7]],
    [[0, D7]],
    [[0, Gm7]],
    [[0, C7]],
    [[0, Am7]],
    [[0, D7]],
    [[0, Gm7], [2, C7]],
    [[0, F6]],
  ];

  // Walking bass: one note per beat.
  const BASS = [
    [41, 45, 48, 49],
    [38, 42, 45, 42],
    [43, 46, 50, 47],
    [48, 46, 43, 44],
    [45, 48, 52, 51],
    [50, 45, 42, 44],
    [43, 46, 48, 40],
    [41, 45, 48, 40],
  ];

  // Melody: [beat, note, length in beats]
  const MELODY = [
    [[0.5, 69, 0.5], [1, 72, 0.5], [1.5, 76, 1], [3, 74, 0.5], [3.5, 72, 0.5]],
    [[0, 78, 1], [1.5, 76, 0.5], [2, 74, 0.5], [2.5, 72, 1.5]],
    [[0.5, 70, 0.5], [1, 74, 0.5], [1.5, 77, 1], [3, 76, 0.5], [3.5, 74, 0.5]],
    [[0, 76, 1], [1, 72, 0.5], [1.5, 70, 1.5], [3.5, 69, 0.5]],
    [[0, 72, 1], [1.5, 76, 0.5], [2, 79, 1], [3, 76, 0.5], [3.5, 72, 0.5]],
    [[0, 78, 1.5], [2, 77, 0.5], [2.5, 76, 0.5], [3, 74, 1]],
    [
      [0, 74, 0.5],
      [0.5, 70, 0.5],
      [1, 67, 1],
      [2, 70, 0.5],
      [2.5, 76, 0.5],
      [3, 74, 0.5],
      [3.5, 70, 0.5],
    ],
    [[0, 69, 2.5]],
  ];

  const COMP = [
    [0, 1.2],
    [2.5, 1.3],
  ]; // piano chord hits: [beat, length in beats]
  const RIDE = [0, 1, 1.5, 2, 3, 3.5]; // "ding, ding-ga-ding, ding-ga"
  const BRUSHES = [1, 3]; // the backbeat

  const VOLUME = 0.22;
  const FADE_IN = 1.5; // seconds
  const FADE_OUT = 0.6;
  const LOOKAHEAD = 0.4; // schedule a bar this long before it starts
  const NOTE_EVERY_MS = 900; // floating notes

  let ctx = null;
  let bus = null; // everything ends up here, then dry + reverb
  let noiseBuffer = null;
  let out = null; // this play's gain node (faded in and out)
  let playing = false;
  let nextBarTime = 0;
  let barCount = 0;
  let schedulerTimer = null;
  let notesTimer = null;

  // ─── Audio setup, on first play ────────────────────────────────────────
  function build() {
    ctx = new AudioContext();
    bus = ctx.createGain();
    bus.connect(ctx.destination);

    const reverb = ctx.createConvolver();
    reverb.buffer = roomImpulse(1.2);
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    bus.connect(reverb);
    reverb.connect(wet);
    wet.connect(ctx.destination);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  // Stereo noise fading out as (1 - t)^3: a small room.
  function roomImpulse(seconds) {
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

  const freq = (midi) => 440 * 2 ** ((midi - 69) / 12);

  // Seconds from the start of the bar to `beat`, with the off-beat swung.
  function beatTime(beat) {
    const whole = Math.floor(beat);
    let fraction = beat - whole;
    if (fraction === 0.5) fraction = SWING;
    return (whole + fraction) * BEAT;
  }

  function oscillator(type, frequency, start, stop) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.start(start);
    osc.stop(stop);
    return osc;
  }

  function biquad(type, frequency, q = 1) {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
  }

  // ─── Instruments ───────────────────────────────────────────────────────

  // Electric piano: FM synthesis. A modulator at the same frequency as the
  // note (ratio 1) wobbles the carrier; its strength (the "index") starts
  // bright and decays, which gives the bell-like attack.
  function piano(midi, t, length, peak) {
    const f = freq(midi);
    const end = t + length + 0.3;
    const carrier = oscillator("sine", f, t, end);
    const modulator = oscillator("sine", f, t, end);
    const index = ctx.createGain();
    index.gain.setValueAtTime(1.6 * f, t);
    index.gain.exponentialRampToValueAtTime(0.15 * f, t + length);
    modulator.connect(index);
    index.connect(carrier.frequency);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(peak * 0.4, t + length);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    carrier.connect(amp);
    amp.connect(out);
  }

  // Upright bass: triangle + sine, darkened by a lowpass, with a pluck.
  function bass(midi, t, length) {
    const f = freq(midi);
    const end = t + length + 0.1;
    const lowpass = biquad("lowpass", 700);
    oscillator("triangle", f, t, end).connect(lowpass);
    oscillator("sine", f, t, end).connect(lowpass);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.1, t + length * 0.6);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    lowpass.connect(amp);
    amp.connect(out);
  }

  // A burst of highpass/bandpass noise (ride, brushes, sax breath).
  function noise(t, type, frequency, peak, attack, decay) {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = biquad(type, frequency);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(peak, t + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(out);
    source.start(t, Math.random() * 1.5, attack + decay + 0.05);
  }

  const ride = (t) => noise(t, "highpass", 7000, 0.05, 0.002, 0.3);
  const brush = (t) => noise(t, "highpass", 2500, 0.025, 0.03, 0.12);

  // Saxophone: a sawtooth that scoops up into the note, with vibrato that
  // fades in, a lowpass that opens on the attack, a body resonance around
  // 1300Hz, and a little breath noise.
  function sax(midi, t, length) {
    const f = freq(midi);
    const end = t + length + 0.08;
    const osc = oscillator("sawtooth", f, t, end);
    osc.frequency.setValueAtTime(f * 0.97, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.06);

    const vibrato = oscillator("sine", 5.2, t, end);
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t + 0.12);
    depth.gain.linearRampToValueAtTime(f * 0.01, t + Math.max(length, 0.2));
    vibrato.connect(depth);
    depth.connect(osc.frequency);

    const lowpass = biquad("lowpass", 700);
    lowpass.frequency.setValueAtTime(700, t);
    lowpass.frequency.exponentialRampToValueAtTime(2800, t + 0.05);
    lowpass.frequency.exponentialRampToValueAtTime(1600, t + length);
    const body = biquad("peaking", 1300, 1.2);
    body.gain.value = 5;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.11, t + 0.035);
    amp.gain.exponentialRampToValueAtTime(0.08, t + length);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(lowpass);
    lowpass.connect(body);
    body.connect(amp);
    amp.connect(out);

    noise(t, "bandpass", 1800, 0.012, 0.03, length);
  }

  // ─── Scheduling ────────────────────────────────────────────────────────

  function chordAt(bar, beat) {
    let chord = CHORDS[bar][0][1];
    for (const [changeBeat, voicing] of CHORDS[bar]) {
      if (changeBeat <= beat) chord = voicing;
    }
    return chord;
  }

  function scheduleBar(count, start) {
    const bar = count % BARS;
    const pass = Math.floor(count / BARS);
    const at = (beat) => start + beatTime(beat);

    for (const [beat, beats] of COMP) {
      for (const note of chordAt(bar, beat)) {
        piano(note, at(beat), beats * BEAT, 0.05);
      }
    }
    BASS[bar].forEach((note, beat) => bass(note, at(beat), BEAT * 0.9));
    RIDE.forEach((beat) => ride(at(beat)));
    BRUSHES.forEach((beat) => brush(at(beat)));

    // Sax takes the melody on even passes, the piano on odd ones.
    for (const [beat, note, beats] of MELODY[bar]) {
      const length = at(beat + beats) - at(beat);
      if (pass % 2 === 0) {
        sax(note, at(beat), length);
      } else {
        piano(note, at(beat), length, 0.1);
      }
    }
  }

  function scheduler() {
    while (nextBarTime < ctx.currentTime + LOOKAHEAD) {
      scheduleBar(barCount, nextBarTime);
      nextBarTime += 4 * BEAT;
      barCount++;
    }
  }

  // ─── Floating notes (skipped with reduced motion) ──────────────────────
  const NOTE_SVG = `<svg class="music-note" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor">
    <ellipse cx="3.6" cy="9.4" rx="2.4" ry="1.8" transform="rotate(-20 3.6 9.4)" />
    <rect x="5.1" y="1" width="1.2" height="8.4" />
    <path d="M6.3 1c.4 2 3.5 2.4 3.3 5.4-.6-1.6-1.8-2.2-3.3-2.4z" />
  </svg>`;

  function floatNote() {
    record.insertAdjacentHTML("beforeend", NOTE_SVG);
    const note = record.lastElementChild;
    note.style.setProperty("--drift", `${Math.round(Math.random() * 14 - 4)}px`);
    note.addEventListener("animationend", () => note.remove());
  }

  // ─── Play / stop ───────────────────────────────────────────────────────

  function play() {
    if (!ctx) build();
    ctx.resume();
    playing = true;

    // Each play gets its own gain node, so notes still queued from a
    // previous play fade out with that play instead of overlapping this one.
    out = ctx.createGain();
    out.connect(bus);
    const now = ctx.currentTime;
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(VOLUME, now + FADE_IN);

    barCount = 0;
    nextBarTime = now + 0.05;
    scheduler();
    schedulerTimer = setInterval(scheduler, 100);
    if (!reducedMotion) notesTimer = setInterval(floatNote, NOTE_EVERY_MS);

    record.setAttribute("aria-pressed", "true");
    tip.textContent = "Stop the music";
  }

  function stop() {
    playing = false;
    clearInterval(schedulerTimer);
    clearInterval(notesTimer);

    const fading = out;
    const now = ctx.currentTime;
    fading.gain.cancelScheduledValues(now);
    fading.gain.setValueAtTime(fading.gain.value, now);
    fading.gain.linearRampToValueAtTime(0, now + FADE_OUT);
    setTimeout(() => {
      fading.disconnect();
      // Let the audio thread rest until the next play.
      if (!playing) ctx.suspend();
    }, FADE_OUT * 1000 + 100);

    record.setAttribute("aria-pressed", "false");
    tip.textContent = restingTip;
  }

  record.addEventListener("click", () => {
    if (playing) {
      stop();
    } else {
      play();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) stop();
  });
})();
