const CANVAS_W = 800;
const CANVAS_H = 600;
const BLOCK_W = 64;            // 32 × 2 del spritesheet
const BLOCK_H = 32;            // 16 × 2 del spritesheet
const COLS = 10;
const ROWS = 6;
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
const ROW_COLORS = ['gray', 'red', 'yellow', 'cyan', 'magenta', 'green'];
const MAX_DT = 0.05;           // s

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  phase: 'ready',   // 'ready' | 'playing' | 'won' | 'lost'
  score: 0,
  lives: START_LIVES,
  paddle: { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H },
  ball: { x: 0, y: 0, vx: 0, vy: 0, size: BALL_SIZE, attached: true },
  blocks: [],       // { x, y, w, h, color, hits, alive }
};

function initBlocks() {
  state.blocks = [];
  for (let row = 0; row < ROWS; row++) {
    const color = ROW_COLORS[row];
    for (let col = 0; col < COLS; col++) {
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
    launchBall();
  }
});
window.addEventListener('keyup', (e) => onKey(e, false));
canvas.addEventListener('mousedown', launchBall);

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
  } else if (ball.x + ball.size > CANVAS_W) {
    ball.x = CANVAS_W - ball.size;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
  }
}

function update(dt) {
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (dir !== 0) setPaddleX(state.paddle.x + dir * PADDLE_KEY_SPEED * dt);

  if (state.ball.attached) attachBall();
  else updateBall(dt);
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);
  const ball = state.ball;
  drawSprite(ctx, 'ball', ball.x, ball.y, ball.size, ball.size);
  for (const b of state.blocks) {
    if (b.alive) drawSprite(ctx, 'block_' + b.color, b.x, b.y, b.w, b.h);
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
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
});
