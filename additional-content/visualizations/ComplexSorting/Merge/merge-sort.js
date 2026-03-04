/* ── merge-sort.js ── */

const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');

const sliderN  = document.getElementById('slider-n');
const valN     = document.getElementById('val-n');
const btnShuffle = document.getElementById('btn-shuffle');

// ── state ──────────────────────────────────────────────────────────────────
let array = [];

// ── helpers ────────────────────────────────────────────────────────────────

/** Generate a fresh array of `n` unique values 1..99, pre-sorted */
function freshArray(n) {
  const vals = [];
  const used = new Set();
  while (vals.length < n) {
    const v = Math.floor(Math.random() * 98) + 1; // 1–98
    if (!used.has(v)) { used.add(v); vals.push(v); }
  }
  return vals.sort((a, b) => a - b);
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── canvas resize ──────────────────────────────────────────────────────────
function resizeCanvas() {
  const vis = document.getElementById('visualizer');
  canvas.width  = vis.clientWidth;
  canvas.height = vis.clientHeight;
  draw();
}

// ── drawing ────────────────────────────────────────────────────────────────
const NODE_R   = 26;   // circle radius
const NODE_GAP = 18;   // gap between circles

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const n = array.length;
  if (n === 0) return;

  const totalW = n * (NODE_R * 2) + (n - 1) * NODE_GAP;
  const startX = (W - totalW) / 2 + NODE_R;
  const centerY = NODE_R + 32; // top area with some breathing room

  array.forEach((val, i) => {
    const cx = startX + i * (NODE_R * 2 + NODE_GAP);
    const cy = centerY;
    drawNode(cx, cy, val, 'default');
  });
}

function drawNode(cx, cy, val, state) {
  const colors = {
    default:   { fill: '#8b5cf6', stroke: '#6d28d9', text: '#fff' },
    sorted:    { fill: '#22c55e', stroke: '#16a34a', text: '#fff' },
    splitting: { fill: '#f59e0b', stroke: '#d97706', text: '#fff' },
    comparing: { fill: '#60a5fa', stroke: '#3b82f6', text: '#fff' },
    merging:   { fill: '#f97316', stroke: '#ea580c', text: '#fff' },
  };
  const c = colors[state] || colors.default;

  // shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur  = 8;
  ctx.shadowOffsetY = 3;

  // circle
  ctx.beginPath();
  ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();

  ctx.restore();

  // border
  ctx.beginPath();
  ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // value text
  ctx.fillStyle = c.text;
  ctx.font = `bold ${NODE_R < 20 ? 11 : 13}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(val, cx, cy);
}

// ── init & events ──────────────────────────────────────────────────────────

function init() {
  const n = parseInt(sliderN.value);
  array = freshArray(n);
  valN.textContent = n;
  resizeCanvas();
}

sliderN.addEventListener('input', () => {
  const n = parseInt(sliderN.value);
  valN.textContent = n;
  array = freshArray(n);
  draw();
});

btnShuffle.addEventListener('click', () => {
  array = shuffle(array);
  draw();
});

window.addEventListener('resize', resizeCanvas);

// kick off with 8 entries
sliderN.value = 8;
init();