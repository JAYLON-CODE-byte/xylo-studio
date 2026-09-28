/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — SAMPLE PROJECTS
   
   Four complete, working starter projects. Each one is a real,
   runnable app — not a placeholder. When a user clicks "Try a
   Sample", XYLO creates a new project from these templates.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const SAMPLES = [

    /* ═══════════════════════════════════════════════════════
       1. NEON SNAKE
       ═══════════════════════════════════════════════════════ */
    {
      id: 'snake',
      title: 'Neon Snake',
      desc: 'A playable Snake game with arrow keys, score, and high score.',
      icon: 'gamepad-2',
      type: 'web',
      files: {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Snake</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="wrap">
    <header>
      <h1>NEON SNAKE</h1>
      <div class="scores">
        <span>SCORE <b id="score">0</b></span>
        <span>BEST <b id="best">0</b></span>
      </div>
    </header>
    <canvas id="game" width="400" height="400"></canvas>
    <p class="hint">Use <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>, <kbd>WASD</kbd>, or swipe. <kbd>Space</kbd> to start.</p>
  </div>
  <script src="game.js"></script>
</body>
</html>`,

        'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0a0a0f;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.wrap { text-align: center; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

h1 {
  font-size: 18px;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #00D4FF, #00FFFF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.scores {
  display: flex;
  gap: 18px;
  font-size: 11px;
  letter-spacing: 1px;
  color: #5c6470;
}

.scores b {
  color: #00D4FF;
  font-weight: 700;
  margin-left: 4px;
}

canvas {
  background: #050508;
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.15);
  display: block;
}

.hint {
  margin-top: 16px;
  font-size: 11.5px;
  color: #5c6470;
}

kbd {
  display: inline-block;
  padding: 1px 5px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: #9aa3b2;
}`,

        'game.js': `// Neon Snake — a playable Snake game
// Controls: Arrow keys, WASD, or swipe. Space to start/restart.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;

// Speed: lower = faster. Starts slow, gets faster as you eat.
const START_SPEED = 210; // ms per move
const MIN_SPEED = 70;
const SPEED_STEP = 7; // gets this much faster per food

let state; // 'menu' | 'playing' | 'over'
let snake, dir, nextDir, food, score, best, speed, lastMove;

function reset() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  speed = START_SPEED;
  placeFood();
  scoreEl.textContent = '0';
}

function placeFood() {
  while (true) {
    const x = Math.floor(Math.random() * COLS);
    const y = Math.floor(Math.random() * ROWS);
    if (!snake.some(s => s.x === x && s.y === y)) {
      food = { x, y };
      return;
    }
  }
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return endGame();
  }
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
    placeFood();
  } else {
    snake.pop();
  }
}

function endGame() {
  state = 'over';
  best = Math.max(best || 0, score);
  bestEl.textContent = best;
  try { localStorage.setItem('neon-snake-best', best); } catch (e) {}
  console.log('Game over. Score:', score, 'Best:', best);
}

function draw() {
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
  }

  // Food
  ctx.shadowColor = '#ff3366';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ff3366';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();

  // Snake
  ctx.shadowColor = '#00D4FF';
  ctx.shadowBlur = 14;
  snake.forEach((s, i) => {
    const alpha = 1 - (i / snake.length) * 0.55;
    ctx.fillStyle = i === 0 ? '#00FFFF' : `rgba(0, 212, 255, ${alpha})`;
    ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
  });

  ctx.shadowBlur = 0;

  if (state === 'menu') drawMenu();
  if (state === 'over') drawOver();
}

function drawMenu() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#00FFFF';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText('NEON', canvas.width / 2, canvas.height / 2 - 46);
  ctx.fillText('SNAKE', canvas.width / 2, canvas.height / 2 - 8);

  ctx.fillStyle = '#9aa3b2';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Press SPACE or tap to start', canvas.width / 2, canvas.height / 2 + 38);

  ctx.fillStyle = '#5c6470';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Arrow keys · WASD · swipe', canvas.width / 2, canvas.height / 2 + 64);
}

function drawOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';

  ctx.fillStyle = '#00FFFF';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 34);

  ctx.fillStyle = '#ff3366';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 4);

  ctx.fillStyle = '#9aa3b2';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 42);
}

function loop(ts) {
  if (state === 'playing' && ts - lastMove > speed) {
    step();
    lastMove = ts;
  }
  draw();
  requestAnimationFrame(loop);
}

function start() {
  reset();
  state = 'playing';
  lastMove = performance.now();
  console.log('Neon Snake started');
}

// Keyboard
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (state === 'menu' || state === 'over') start();
    return;
  }

  if (state !== 'playing') return;

  if (['arrowup', 'w'].includes(key) && dir.y === 0) nextDir = { x: 0, y: -1 };
  if (['arrowdown', 's'].includes(key) && dir.y === 0) nextDir = { x: 0, y: 1 };
  if (['arrowleft', 'a'].includes(key) && dir.x === 0) nextDir = { x: -1, y: 0 };
  if (['arrowright', 'd'].includes(key) && dir.x === 0) nextDir = { x: 1, y: 0 };

  if (e.key.startsWith('Arrow')) e.preventDefault();
});

// Touch / swipe
let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (state === 'menu' || state === 'over') {
    start();
    return;
  }
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const absX = Math.abs(dx), absY = Math.abs(dy);
  if (Math.max(absX, absY) < 20) return;
  if (absX > absY) {
    if (dx > 0 && dir.x === 0) nextDir = { x: 1, y: 0 };
    if (dx < 0 && dir.x === 0) nextDir = { x: -1, y: 0 };
  } else {
    if (dy > 0 && dir.y === 0) nextDir = { x: 0, y: 1 };
    if (dy < 0 && dir.y === 0) nextDir = { x: 0, y: -1 };
  }
  touchStart = null;
}, { passive: true });

// Mouse click also starts
canvas.addEventListener('click', () => {
  if (state === 'menu' || state === 'over') start();
});

// Init
try { best = parseInt(localStorage.getItem('neon-snake-best') || '0', 10) || 0; } catch (e) { best = 0; }
bestEl.textContent = best;
reset();
state = 'menu';
console.log('Neon Snake loaded');
requestAnimationFrame(loop); 
      },
    },
    
    /* ═══════════════════════════════════════════════════════
       2. NEON TODO
       ═══════════════════════════════════════════════════════ */
    {
      id: 'todo',
      title: 'Neon Todo',
      desc: 'A todo app that remembers your tasks. Add, complete, filter.',
      icon: 'check-square',
      type: 'web',
      files: {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon Todo</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app">
    <header>
      <h1>NEON TODO</h1>
      <p class="sub" id="summary">0 tasks</p>
    </header>

    <form class="input-row" id="form">
      <input type="text" id="input" placeholder="What needs doing?" autocomplete="off" maxlength="100">
      <button type="submit">+</button>
    </form>

    <div class="filters" id="filters">
      <button data-filter="all" class="active">All</button>
      <button data-filter="active">Active</button>
      <button data-filter="done">Done</button>
    </div>

    <ul class="list" id="list"></ul>
  </div>
  <script src="script.js"></script>
</body>
</html>`,

        'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0a0a0f;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  padding: 32px 16px;
  display: flex;
  justify-content: center;
}

.app {
  width: 100%;
  max-width: 420px;
}

h1 {
  font-size: 22px;
  letter-spacing: 5px;
  background: linear-gradient(90deg, #00D4FF, #00FFFF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 4px;
}

.sub {
  font-size: 11px;
  letter-spacing: 1.5px;
  color: #5c6470;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.input-row input {
  flex: 1;
  background: #101018;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 14px;
  color: #fff;
  outline: none;
  transition: border-color 0.15s;
}
.input-row input:focus { border-color: #00D4FF; box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.12); }
.input-row input::placeholder { color: #3a4048; }

.input-row button {
  width: 46px;
  background: #00D4FF;
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}
.input-row button:hover { background: #00FFFF; }

.filters {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
}

.filters button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: #5c6470;
  cursor: pointer;
  transition: all 0.15s;
}
.filters button:hover { color: #9aa3b2; border-color: rgba(255, 255, 255, 0.15); }
.filters button.active {
  color: #00D4FF;
  border-color: rgba(0, 212, 255, 0.4);
  background: rgba(0, 212, 255, 0.08);
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #101018;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: border-color 0.15s;
}
.item:hover { border-color: rgba(0, 212, 255, 0.25); }

.item input[type="checkbox"] {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 1.5px solid #3a4048;
  border-radius: 5px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: all 0.15s;
}
.item input[type="checkbox"]:checked {
  background: #00D4FF;
  border-color: #00D4FF;
}
.item input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1.5px;
  width: 5px;
  height: 10px;
  border: solid #000;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.item .text {
  flex: 1;
  font-size: 14px;
  color: #e8ecf1;
  word-break: break-word;
  transition: color 0.15s, text-decoration 0.15s;
}
.item.done .text {
  color: #3a4048;
  text-decoration: line-through;
}

.item .del {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: #3a4048;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  flex-shrink: 0;
  line-height: 1;
}
.item .del:hover { color: #ff3366; background: rgba(255, 51, 102, 0.1); }

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #3a4048;
  font-size: 13px;
}`,

        'script.js': `// Neon Todo — with localStorage persistence

const STORAGE_KEY = 'neon-todo-tasks';

const form = document.getElementById('form');
const input = document.getElementById('input');
const list = document.getElementById('list');
const summary = document.getElementById('summary');
const filters = document.getElementById('filters');

let tasks = load();
let filter = 'all';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) {}
}

function render() {
  const visible = tasks.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  list.innerHTML = '';

  if (!visible.length) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = tasks.length ? 'Nothing here.' : 'Add your first task above.';
    list.appendChild(empty);
  } else {
    visible.forEach(task => {
      const item = document.createElement('li');
      item.className = 'item' + (task.done ? ' done' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => toggle(task.id));

      const text = document.createElement('span');
      text.className = 'text';
      text.textContent = task.text;

      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '×';
      del.title = 'Delete';
      del.addEventListener('click', () => remove(task.id));

      item.appendChild(checkbox);
      item.appendChild(text);
      item.appendChild(del);
      list.appendChild(item);
    });
  }

  const active = tasks.filter(t => !t.done).length;
  summary.textContent = tasks.length === 0
    ? '0 tasks'
    : \`\${active} active · \${tasks.length - active} done\`;

  save();
}

function add(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  tasks.unshift({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    text: trimmed,
    done: false,
  });
  render();
}

function toggle(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  render();
}

function remove(id) {
  tasks = tasks.filter(t => t.id !== id);
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  add(input.value);
  input.value = '';
  input.focus();
});

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  filters.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
  render();
});

render();
console.log('Neon Todo ready. ' + tasks.length + ' tasks loaded.');`,
      },
    },

    /* ═══════════════════════════════════════════════════════
       3. CALCULATOR
       ═══════════════════════════════════════════════════════ */
    {
      id: 'calculator',
      title: 'Calculator',
      desc: 'A working calculator with keyboard support.',
      icon: 'calculator',
      type: 'web',
      files: {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculator</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="calc">
    <div class="display">
      <div class="history" id="history"></div>
      <div class="current" id="current">0</div>
    </div>
    <div class="keys" id="keys">
      <button data-key="clear" class="fn">C</button>
      <button data-key="back" class="fn">←</button>
      <button data-key="/" class="op">÷</button>
      <button data-key="*" class="op">×</button>

      <button data-key="7">7</button>
      <button data-key="8">8</button>
      <button data-key="9">9</button>
      <button data-key="-" class="op">−</button>

      <button data-key="4">4</button>
      <button data-key="5">5</button>
      <button data-key="6">6</button>
      <button data-key="+" class="op">+</button>

      <button data-key="1">1</button>
      <button data-key="2">2</button>
      <button data-key="3">3</button>
      <button data-key="=" class="eq">=</button>

      <button data-key="0" class="zero">0</button>
      <button data-key=".">.</button>
    </div>
    <p class="hint">Numbers, <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd>, <kbd>Enter</kbd>, <kbd>Esc</kbd></p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,

        'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0a0a0f;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.calc {
  width: 100%;
  max-width: 320px;
  background: #101018;
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 0 60px rgba(0, 212, 255, 0.1);
}

.display {
  background: #050508;
  border-radius: 10px;
  padding: 18px 16px;
  text-align: right;
  margin-bottom: 16px;
  min-height: 84px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.history {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #3a4048;
  min-height: 16px;
  margin-bottom: 4px;
}

.current {
  font-family: ui-monospace, monospace;
  font-size: 32px;
  font-weight: 500;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
}

.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.keys button {
  background: #16161f;
  border: none;
  border-radius: 8px;
  height: 52px;
  font-size: 18px;
  font-weight: 500;
  color: #e8ecf1;
  cursor: pointer;
  transition: all 0.1s;
  user-select: none;
}
.keys button:hover { background: #1e1e28; }
.keys button:active { transform: scale(0.96); background: #252530; }

.keys button.op { color: #00D4FF; }
.keys button.fn { color: #9aa3b2; }
.keys button.eq {
  background: #00D4FF;
  color: #000;
  font-weight: 700;
  grid-row: span 2;
  height: auto;
}
.keys button.eq:hover { background: #00FFFF; }
.keys button.zero { grid-column: span 2; }

.hint {
  margin-top: 16px;
  text-align: center;
  font-size: 10.5px;
  color: #3a4048;
}

kbd {
  display: inline-block;
  padding: 1px 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-family: ui-monospace, monospace;
  font-size: 9.5px;
  color: #5c6470;
}`,

        'script.js': `// Calculator — state machine with keyboard support

const currentEl = document.getElementById('current');
const historyEl = document.getElementById('history');

let current = '0';
let previous = null;
let operator = null;
let justEvaluated = false;

function updateDisplay() {
  currentEl.textContent = current;
  historyEl.textContent = previous !== null && operator
    ? \`\${previous} \${opSymbol(operator)}\`
    : '';
}

function opSymbol(op) {
  return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || op;
}

function inputDigit(d) {
  if (justEvaluated) { current = '0'; justEvaluated = false; }
  if (current === '0') current = d;
  else current += d;
  updateDisplay();
}

function inputDot() {
  if (justEvaluated) { current = '0'; justEvaluated = false; }
  if (!current.includes('.')) current += '.';
  updateDisplay();
}

function setOperator(op) {
  if (operator && previous !== null && !justEvaluated) {
    compute();
  }
  previous = parseFloat(current);
  operator = op;
  current = '0';
  justEvaluated = false;
  updateDisplay();
}

function compute() {
  if (operator === null || previous === null) return;
  const a = previous;
  const b = parseFloat(current);
  let result;
  switch (operator) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    case '*': result = a * b; break;
    case '/': result = b === 0 ? NaN : a / b; break;
    default: return;
  }
  current = isNaN(result) ? 'Error' : String(parseFloat(result.toFixed(10)));
  previous = null;
  operator = null;
  justEvaluated = true;
  updateDisplay();
}

function clearAll() {
  current = '0';
  previous = null;
  operator = null;
  justEvaluated = false;
  updateDisplay();
}

function backspace() {
  if (justEvaluated) return clearAll();
  if (current.length > 1) current = current.slice(0, -1);
  else current = '0';
  updateDisplay();
}

function handleKey(key) {
  if (/^[0-9]$/.test(key)) return inputDigit(key);
  if (key === '.') return inputDot();
  if (['+', '-', '*', '/'].includes(key)) return setOperator(key);
  if (key === '=' || key === 'Enter') return compute();
  if (key === 'clear' || key === 'Escape') return clearAll();
  if (key === 'back' || key === 'Backspace') return backspace();
}

document.getElementById('keys').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-key]');
  if (btn) handleKey(btn.dataset.key);
});

document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (/^[0-9.]$/.test(key)) { handleKey(key); return; }
  if (['+', '-', '*', '/'].includes(key)) { handleKey(key); return; }
  if (key === 'Enter' || key === '=') { e.preventDefault(); handleKey('='); return; }
  if (key === 'Escape') { handleKey('clear'); return; }
  if (key === 'Backspace') { e.preventDefault(); handleKey('back'); return; }
});

updateDisplay();`,
      },
    },

    /* ═══════════════════════════════════════════════════════
       4. PORTFOLIO
       ═══════════════════════════════════════════════════════ */
    {
      id: 'portfolio',
      title: 'Portfolio Page',
      desc: 'A modern personal site. Customize it with your own info.',
      icon: 'user',
      type: 'web',
      files: {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Name — Portfolio</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <nav>
    <span class="logo">YOUR NAME</span>
    <div class="links">
      <a href="#work">Work</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </div>
  </nav>

  <main>
    <section class="hero">
      <p class="eyebrow">Designer · Developer</p>
      <h1>Building things<br>for the web.</h1>
      <p class="lead">I design and build modern interfaces and small tools. Currently learning, always shipping.</p>
      <div class="cta">
        <a href="#work" class="btn">See my work</a>
        <a href="#contact" class="btn ghost">Get in touch</a>
      </div>
    </section>

    <section id="work">
      <h2>Selected Work</h2>
      <div class="grid">
        <article>
          <div class="thumb" style="background:linear-gradient(135deg,#00D4FF,#00FFFF)"></div>
          <h3>Project One</h3>
          <p>A short description of what you built and why.</p>
        </article>
        <article>
          <div class="thumb" style="background:linear-gradient(135deg,#ff3366,#ff9933)"></div>
          <h3>Project Two</h3>
          <p>A short description of what you built and why.</p>
        </article>
        <article>
          <div class="thumb" style="background:linear-gradient(135deg,#7B2FF7,#C03CFF)"></div>
          <h3>Project Three</h3>
          <p>A short description of what you built and why.</p>
        </article>
      </div>
    </section>

    <section id="about">
      <h2>About</h2>
      <p>I'm a developer focused on building clean, fast, and useful things. I care about the small details — good typography, clear hierarchy, and interfaces that feel right.</p>
    </section>

    <section id="contact">
      <h2>Get in touch</h2>
      <p>Want to work together or just say hi?</p>
      <a href="mailto:you@example.com" class="btn">you@example.com</a>
    </section>
  </main>

  <footer>
    <p>© <span id="year"></span> Your Name. Built with XYLO Studio.</p>
  </footer>

  <script src="script.js"></script>
</body>
</html>`,

        'style.css': `* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #050508;
  --bg-1: #0a0a0f;
  --ink: #ffffff;
  --ink-1: #e8ecf1;
  --ink-2: #9aa3b2;
  --ink-3: #5c6470;
  --line: rgba(255, 255, 255, 0.08);
  --blue: #00D4FF;
}

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--ink-1);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 32px;
  background: rgba(5, 5, 8, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
  z-index: 10;
}

.logo {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 2.5px;
  color: var(--ink);
}

.links { display: flex; gap: 24px; }
.links a {
  color: var(--ink-2);
  text-decoration: none;
  font-size: 13px;
  transition: color 0.15s;
}
.links a:hover { color: var(--blue); }

main { max-width: 900px; margin: 0 auto; padding: 0 32px; }

section { padding: 100px 0; }
section h2 {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 24px;
}

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 120px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 20px;
}

.hero h1 {
  font-size: clamp(40px, 7vw, 76px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #fff 0%, #8899aa 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.lead {
  font-size: 17px;
  color: var(--ink-2);
  max-width: 480px;
  margin-bottom: 36px;
}

.cta { display: flex; gap: 12px; flex-wrap: wrap; }

.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  background: var(--blue);
  color: #000;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.15s;
}
.btn:hover { background: #00FFFF; transform: translateY(-1px); }

.btn.ghost {
  background: transparent;
  color: var(--ink-1);
  border: 1px solid var(--line);
}
.btn.ghost:hover { border-color: var(--blue); color: var(--blue); background: rgba(0, 212, 255, 0.06); }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

article {
  background: var(--bg-1);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}
article:hover {
  border-color: rgba(0, 212, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.thumb {
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  margin-bottom: 16px;
}

article h3 {
  font-size: 16px;
  margin-bottom: 6px;
  color: var(--ink);
}
article p { font-size: 13.5px; color: var(--ink-2); }

#about p { max-width: 560px; font-size: 16px; color: var(--ink-2); }

#contact p { margin-bottom: 20px; font-size: 16px; color: var(--ink-2); }

footer {
  padding: 40px 32px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-3);
  border-top: 1px solid var(--line);
}`,

        'script.js': `// Portfolio — smooth scroll + dynamic year

document.getElementById('year').textContent = new Date().getFullYear();

// Smooth scroll for anchor links (fallback for browsers without scroll-behavior)
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

console.log('Portfolio loaded.');`,
      },
    },
  ];

  window.XyloSamples = { SAMPLES };
})();
