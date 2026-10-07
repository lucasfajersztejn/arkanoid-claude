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

function update(dt) {
  // Se rellenará en los pasos siguientes.
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
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
  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
});
