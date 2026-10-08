const CANVAS_W = 800;
const CANVAS_H = 600;
const BLOCK_W = 64;            // 32 × 2 del spritesheet
const BLOCK_H = 32;            // 16 × 2 del spritesheet
const GRID_X = 80;             // (800 - 10 × 64) / 2
const GRID_Y = 60;
const PADDLE_W = 162;          // tamaño nativo del sprite
const PADDLE_H = 14;
const PADDLE_Y = 560;
const PADDLE_KEY_SPEED = 600;  // px/s
const BALL_SIZE = 16;          // tamaño nativo del sprite
const BALL_SPEED = 400;        // px/s, constante
const MAX_BOUNCE_ANGLE = 60;   // grados respecto a la vertical
const START_LIVES = 3;
const POINTS_PER_BLOCK = 10;
const MAX_DT = 0.05;           // s
const EXPLOSION_FRAME_COUNT = 4; // fotogramas por color en EXPLOSION_FRAMES

const SOUND_FILES = {
  bounce: 'assets/sounds/ball-bounce.mp3',
  break: 'assets/sounds/break-sound.mp3',
};

// Cada evento reproduce su propia copia para que los sonidos se solapen.
function playSound(name) {
  new Audio(SOUND_FILES[name]).play().catch(() => {});
}

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

const state = {
  phase: 'menu',    // 'menu' | 'ready' | 'playing' | 'won' | 'lost'
  score: 0,
  lives: START_LIVES,
  level: 0,         // índice en LEVELS (0 = nivel 1)
  paddle: { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, attached: true },
  blocks: [],       // { x, y, w, h, color, hits, alive }
  explosions: [],   // { x, y, w, h, color, elapsed }
};

function initBlocks() {
  state.blocks = [];
  const rows = LEVELS[state.level];
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const color = LEVEL_CHARS[rows[row][col]];
      if (!color) continue;
      state.blocks.push({
        x: GRID_X + col * BLOCK_W,
        y: GRID_Y + row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color,
        hits: color === 'gray' ? 2 : 1,
        alive: true,
      });
    }
  }
}

const keys = { left: false, right: false };

function setPaddleX(x) {
  state.paddle.x = Math.max(0, Math.min(CANVAS_W - state.paddle.w, x));
}

window.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  setPaddleX(e.clientX - rect.left - state.paddle.w / 2);
});

function onKey(e, pressed) {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    keys.left = pressed;
    e.preventDefault();
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    keys.right = pressed;
    e.preventDefault();
  }
}

window.addEventListener('keydown', (e) => {
  onKey(e, true);
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) launchOrRestart();
  }
});
window.addEventListener('keyup', (e) => onKey(e, false));
canvas.addEventListener('mousedown', launchOrRestart);
overlay.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-level]');
  if (button) startGame(Number(button.dataset.level));
  else launchOrRestart();
});

function launchOrRestart() {
  if (state.phase === 'won' || state.phase === 'lost') showMenu();
  else launchBall();
}

function showMenu() {
  state.phase = 'menu';
  const buttons = LEVELS.map((_, i) =>
    '<button data-level="' + i + '">Nivel ' + (i + 1) + '</button>').join('');
  overlay.innerHTML = '<h1>Arkanoid</h1><p>Elige un nivel</p><div class="levels">' + buttons + '</div>';
  overlay.hidden = false;
}

function startGame(levelIndex) {
  state.score = 0;
  state.lives = START_LIVES;
  state.phase = 'ready';
  state.level = levelIndex;
  initBlocks();
  state.explosions = [];
  setPaddleX((CANVAS_W - PADDLE_W) / 2);
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.attached = true;
  attachBall();
  overlay.hidden = true;
}

// Conserva puntos, vidas y explosiones en curso; solo cambia los bloques y pega la pelota.
function loadLevel(index) {
  const ball = state.ball;
  state.level = index;
  initBlocks();
  state.phase = 'ready';
  ball.attached = true;
  ball.vx = 0;
  ball.vy = 0;
  attachBall();
}

function endGame(phase, message) {
  state.phase = phase;
  overlay.innerHTML = '<h1>' + message + '</h1><p>Puntos: ' + state.score +
    '</p><p>Haz clic o pulsa Espacio para volver al menú</p>';
  overlay.hidden = false;
}

const LAUNCH_ANGLE = 15; // grados respecto a la vertical

function launchBall() {
  const ball = state.ball;
  if (state.phase !== 'ready' || !ball.attached) return;
  const angle = (Math.random() < 0.5 ? -1 : 1) * LAUNCH_ANGLE * Math.PI / 180;
  ball.vx = BALL_SPEED * Math.sin(angle);
  ball.vy = -BALL_SPEED * Math.cos(angle);
  ball.attached = false;
  state.phase = 'playing';
}

function attachBall() {
  const { paddle, ball } = state;
  ball.x = paddle.x + (paddle.w - ball.size) / 2;
  ball.y = paddle.y - ball.size;
}

function updateBall(dt) {
  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    playSound('bounce');
  } else if (ball.x + ball.size > CANVAS_W) {
    ball.x = CANVAS_W - ball.size;
    ball.vx = -Math.abs(ball.vx);
    playSound('bounce');
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    playSound('bounce');
  }

  bouncePaddle();
  bounceBlocks();

  if (!state.blocks.some((b) => b.alive)) {
    if (state.level < LEVELS.length - 1) loadLevel(state.level + 1);
    else endGame('won', '¡Victoria!');
  } else if (ball.y > CANVAS_H) loseLife();
}

function loseLife() {
  const ball = state.ball;
  state.lives--;
  if (state.lives <= 0) {
    endGame('lost', 'Game over');
    return;
  }
  state.phase = 'ready';
  ball.attached = true;
  ball.vx = 0;
  ball.vy = 0;
  attachBall();
}

// Procesa como máximo un bloque por fotograma y rebota en el eje de menor solapamiento.
function bounceBlocks() {
  const ball = state.ball;
  for (const b of state.blocks) {
    if (!b.alive) continue;
    const overlapX = Math.min(ball.x + ball.size, b.x + b.w) - Math.max(ball.x, b.x);
    const overlapY = Math.min(ball.y + ball.size, b.y + b.h) - Math.max(ball.y, b.y);
    if (overlapX <= 0 || overlapY <= 0) continue;

    if (overlapX < overlapY) {
      const fromLeft = ball.x + ball.size / 2 < b.x + b.w / 2;
      ball.x += fromLeft ? -overlapX : overlapX;
      ball.vx = fromLeft ? -Math.abs(ball.vx) : Math.abs(ball.vx);
    } else {
      const fromTop = ball.y + ball.size / 2 < b.y + b.h / 2;
      ball.y += fromTop ? -overlapY : overlapY;
      ball.vy = fromTop ? -Math.abs(ball.vy) : Math.abs(ball.vy);
    }

    b.hits--;
    if (b.hits <= 0) {
      b.alive = false;
      state.score += POINTS_PER_BLOCK;
      playSound('break');
      state.explosions.push({ x: b.x, y: b.y, w: b.w, h: b.h, color: b.color, elapsed: 0 });
    }
    return;
  }
}

function bouncePaddle() {
  const { ball, paddle } = state;
  if (ball.vy <= 0) return;
  const overlaps =
    ball.x + ball.size > paddle.x && ball.x < paddle.x + paddle.w &&
    ball.y + ball.size > paddle.y && ball.y < paddle.y + paddle.h;
  if (!overlaps) return;

  const ballCenter = ball.x + ball.size / 2;
  const offset = (ballCenter - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
  const clamped = Math.max(-1, Math.min(1, offset));
  const angle = clamped * MAX_BOUNCE_ANGLE * Math.PI / 180;
  ball.vx = BALL_SPEED * Math.sin(angle);
  ball.vy = -BALL_SPEED * Math.cos(angle);
  ball.y = paddle.y - ball.size;
  playSound('bounce');
}

function updateExplosions(dt) {
  const duration = EXPLOSION_DURATION / 1000;
  for (const e of state.explosions) e.elapsed += dt;
  state.explosions = state.explosions.filter((e) => e.elapsed < duration);
}

function update(dt) {
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (dir !== 0) setPaddleX(state.paddle.x + dir * PADDLE_KEY_SPEED * dt);

  updateExplosions(dt);

  if (state.phase === 'menu' || state.phase === 'won' || state.phase === 'lost') return;
  if (state.ball.attached) attachBall();
  else updateBall(dt);
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
  const ball = state.ball;
  drawSprite(ctx, 'ball', ball.x, ball.y, ball.size, ball.size);

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText('Puntos: ' + state.score, 16, 16);
  ctx.textAlign = 'center';
  ctx.fillText('Nivel ' + (state.level + 1) + '/' + LEVELS.length, CANVAS_W / 2, 16);
  ctx.textAlign = 'left';
  for (let i = 0; i < state.lives; i++) {
    drawSprite(ctx, 'ball', CANVAS_W - 16 - (i + 1) * BALL_SIZE - i * 8, 20, BALL_SIZE, BALL_SIZE);
  }
  for (const b of state.blocks) {
    if (b.alive) drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
  }
  const duration = EXPLOSION_DURATION / 1000;
  for (const e of state.explosions) {
    const i = Math.min(EXPLOSION_FRAME_COUNT - 1, Math.floor(e.elapsed / duration * EXPLOSION_FRAME_COUNT));
    drawFrame(ctx, EXPLOSION_FRAMES[e.color][i], e.x, e.y, e.w, e.h);
  }
}

let lastTime = 0;

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, MAX_DT);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  initBlocks();
  setPaddleX((CANVAS_W - PADDLE_W) / 2);
  attachBall();
  showMenu();
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
});
