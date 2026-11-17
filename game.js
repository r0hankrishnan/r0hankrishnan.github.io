// ─── Rally Run: a hidden tennis-ball runner (styles in game.css) ──────────
// Jump nets and low racquets; stay down for high ones.
//
// HOW IT'S OPENED: clicking any button matching GAME_TRIGGER (the "Play
// Rally Run" button in the homepage footer). Point it at a different button
// to move the entrance, or call `RallyRun.open()` from anywhere (e.g. a 404
// page).
const GAME_TRIGGER = "#play-rally";

const RallyRun = (() => {
  // Canvas is drawn in these logical units and scaled to fit.
  const W = 600;
  const H = 200;
  const GROUND = 160;

  const BALL_X = 70;
  const BALL_R = 11;
  const GRAVITY = 2200; // px/s²
  const JUMP_VELOCITY = -640; // px/s
  const START_SPEED = 300; // px/s
  const MAX_SPEED = 760;
  const ACCELERATION = 8; // px/s gained per second
  const HIGH_RACQUETS_AFTER = 250; // score before high racquets appear
  const BEST_KEY = "rally-run-best";

  let dialog, canvas, ctx, colors, frame, returnFocusTo;
  let state, ball, obstacles, speed, score, best, nextSpawn, groundOffset;

  // ─── Setup ───────────────────────────────────────────────────────────────
  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "panel rally";
    dialog.setAttribute("aria-labelledby", "rally-title");
    dialog.innerHTML = `
      <div class="panel-head">
        <p class="label" id="rally-title">Rally Run</p>
        <button type="button" class="key key-sm rally-close">Close</button>
      </div>
      <canvas tabindex="0" autofocus aria-label="Rally Run game. Press space or tap to jump."></canvas>
      <p class="rally-help">Space or tap to jump. Esc to quit.</p>`;
    document.body.append(dialog);

    canvas = dialog.querySelector("canvas");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    dialog.querySelector(".rally-close").addEventListener("click", close);
    dialog.addEventListener("click", (e) => e.target === dialog && close());
    dialog.addEventListener("close", () => {
      cancelAnimationFrame(frame);
      // Native <dialog> restores focus in most browsers; Safari doesn't focus
      // buttons on click, so return focus to the trigger explicitly.
      if (returnFocusTo) returnFocusTo.focus();
    });
    dialog.addEventListener("keydown", (e) => {
      // Let Space press the Close key normally when it has focus.
      if (e.target.closest("button")) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        press();
      }
    });
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      press();
    });
  }

  // Read the site's palette so the game matches whatever base.css defines.
  function readColors() {
    const css = getComputedStyle(document.documentElement);
    const get = (name) => css.getPropertyValue(name).trim();
    colors = {
      surface: get("--surface"),
      ink: get("--ink"),
      inkSoft: get("--ink-soft"),
      rule: get("--rule"),
      ball: get("--ball"),
      mono: get("--f-mono"),
    };
  }

  function open(trigger) {
    returnFocusTo = trigger;
    if (!dialog) build();
    readColors();
    best = loadBest();
    reset();
    dialog.showModal();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      update(dt);
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
  }

  function close() {
    dialog.close();
  }

  function reset() {
    state = "ready";
    ball = { y: GROUND, vy: 0, spin: 0, squash: 0 };
    obstacles = [];
    speed = START_SPEED;
    score = 0;
    nextSpawn = 0.8;
    groundOffset = 0;
  }

  // Space / tap: serve, jump, or restart depending on state.
  function press() {
    if (state === "ready") state = "playing";
    if (state === "over") {
      if (performance.now() - ball.hitAt > 400) reset();
      return;
    }
    if (ball.y >= GROUND) ball.vy = JUMP_VELOCITY;
  }

  // ─── Simulation ──────────────────────────────────────────────────────────
  function update(dt) {
    ball.squash = Math.max(0, ball.squash - dt * 8);
    if (state !== "playing") return;

    speed = Math.min(MAX_SPEED, speed + ACCELERATION * dt);
    score += speed * dt * 0.1;
    groundOffset = (groundOffset + speed * dt) % 40;

    // Ball physics
    ball.vy += GRAVITY * dt;
    ball.y += ball.vy * dt;
    if (ball.y >= GROUND) {
      if (ball.vy > 300) ball.squash = 1;
      ball.y = GROUND;
      ball.vy = 0;
    }
    ball.spin += (speed * dt) / BALL_R;

    // Obstacles
    nextSpawn -= dt;
    if (nextSpawn <= 0) {
      obstacles.push(makeObstacle());
      nextSpawn = 0.9 + Math.random() * 0.8;
    }
    for (const o of obstacles) {
      o.x -= speed * dt;
      o.angle += dt * 6;
    }
    obstacles = obstacles.filter((o) => o.x > -60);

    if (obstacles.some(hits)) {
      state = "over";
      ball.hitAt = performance.now();
      if (Math.floor(score) > best) {
        best = Math.floor(score);
        saveBest(best);
      }
    }
  }

  function makeObstacle() {
    const roll = Math.random();
    if (roll < 0.5) return { type: "net", x: W + 20, w: 26, h: 30, angle: 0 };
    const high = score > HIGH_RACQUETS_AFTER && roll > 0.75;
    // Low racquets must be jumped; high ones fly over a ball that stays down.
    return { type: "racquet", x: W + 20, y: GROUND - (high ? 58 : 28), angle: 0 };
  }

  function hits(o) {
    const cx = BALL_X;
    const cy = ball.y - BALL_R;
    if (o.type === "net") {
      // Circle vs. rectangle, with a couple of pixels of forgiveness.
      const nx = Math.max(o.x + 2, Math.min(cx, o.x + o.w - 2));
      const ny = Math.max(GROUND - o.h + 2, Math.min(cy, GROUND));
      return (cx - nx) ** 2 + (cy - ny) ** 2 < BALL_R ** 2;
    }
    // Racquet: treat the head as a circle.
    return (cx - o.x) ** 2 + (cy - o.y) ** 2 < (BALL_R + 11) ** 2;
  }

  // ─── Drawing ─────────────────────────────────────────────────────────────
  function draw() {
    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, W, H);

    // Court: baseline plus scrolling dashes underneath for a sense of speed.
    ctx.fillStyle = colors.ink;
    ctx.fillRect(0, GROUND, W, 1);
    ctx.fillStyle = colors.rule;
    for (let x = -groundOffset; x < W; x += 40) ctx.fillRect(x, GROUND + 12, 16, 1);

    obstacles.forEach((o) => (o.type === "net" ? drawNet(o) : drawRacquet(o)));
    drawBall();
    drawText();
  }

  function drawBall() {
    const squash = ball.squash * 0.25;
    ctx.save();
    ctx.translate(BALL_X, ball.y - BALL_R * (1 - squash));
    ctx.scale(1 + squash, 1 - squash);
    ctx.rotate(ball.spin);
    ctx.fillStyle = colors.ball;
    ctx.strokeStyle = colors.inkSoft; // keeps the light ball visible
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Seams: two curves bowing in from opposite sides.
    ctx.strokeStyle = colors.surface;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-BALL_R * 1.25, 0, BALL_R * 0.95, -0.75, 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(BALL_R * 1.25, 0, BALL_R * 0.95, Math.PI - 0.75, Math.PI + 0.75);
    ctx.stroke();
    ctx.restore();
  }

  function drawNet(o) {
    const top = GROUND - o.h;
    ctx.strokeStyle = colors.inkSoft;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = o.x; x <= o.x + o.w; x += 5) {
      ctx.moveTo(x + 0.5, top);
      ctx.lineTo(x + 0.5, GROUND);
    }
    for (let y = top; y <= GROUND; y += 5) {
      ctx.moveTo(o.x, y + 0.5);
      ctx.lineTo(o.x + o.w, y + 0.5);
    }
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.fillRect(o.x - 1, top - 3, o.w + 2, 3); // tape
    ctx.fillRect(o.x - 3, top - 3, 2, o.h + 3); // post
  }

  function drawRacquet(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.angle);
    ctx.strokeStyle = colors.rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -6; i <= 6; i += 4) {
      ctx.moveTo(i, -13);
      ctx.lineTo(i, 13);
      ctx.moveTo(-9, i);
      ctx.lineTo(9, i);
    }
    ctx.stroke();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, 30);
    ctx.stroke();
    ctx.restore();
  }

  // The canvas is drawn at 600 logical px and shrunk to fit, so on a narrow
  // screen 12px text would end up tiny. Scale the text back up to stay
  // readable.
  function drawText() {
    const scale = Math.max(1, (600 / canvas.clientWidth) * 0.85);
    const size = 12 * scale;
    const pad = (n) => String(Math.floor(n)).padStart(5, "0");
    ctx.font = `${size}px ${colors.mono}`;
    ctx.fillStyle = colors.ink;
    ctx.textAlign = "right";
    ctx.fillText(`HI ${pad(best)}  ${pad(score)}`, W - 16, 8 + size);

    ctx.textAlign = "center";
    if (state === "ready") ctx.fillText("Press space or tap to serve", W / 2, 80);
    if (state === "over") {
      ctx.fillText("Fault.", W / 2, 72);
      ctx.fillText("Space or tap to play again", W / 2, 72 + size * 1.6);
    }
  }

  // ─── High score (best effort; storage can be unavailable) ────────────────
  function loadBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }
  function saveBest(value) {
    try {
      localStorage.setItem(BEST_KEY, value);
    } catch (e) {}
  }

  return { open };
})();

// ─── Wire up the trigger ───────────────────────────────────────────────────
// The trigger is a real <button>, so Enter and Space already click it.
document.querySelectorAll(GAME_TRIGGER).forEach((button) => {
  button.addEventListener("click", () => RallyRun.open(button));
});
