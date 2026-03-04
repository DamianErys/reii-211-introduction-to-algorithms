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

/** Work out block dimensions from canvas width and array length.
 *  Keeps blocks square-ish, leaves 10 % margin each side,
 *  and caps size so the tree levels below will have room. */
function blockMetrics(n, canvasW) {
  const usable  = canvasW * 0.88;          // 6 % padding each side
  const GAP_RATIO = 0.25;                  // gap = 25 % of block width
  // blockW + gap = usable / n  →  blockW = usable / (n * (1 + GAP_RATIO))
  const rawW  = usable / (n * (1 + GAP_RATIO));
  const blockW = Math.max(28, Math.min(64, rawW));  // clamp 28–64 px
  const blockH = blockW;                            // square
  const gap    = blockW * GAP_RATIO;
  const totalW = n * blockW + (n - 1) * gap;
  const startX = (canvasW - totalW) / 2;
  return { blockW, blockH, gap, startX };
}

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const n = array.length;
  if (n === 0) return;

  const { blockW, blockH, gap, startX } = blockMetrics(n, W);
  const TOP_PAD = 28;

  array.forEach((val, i) => {
    const x = startX + i * (blockW + gap);
    const y = TOP_PAD;
    drawBlock(x, y, blockW, blockH, val, 'default');
  });
}

function drawBlock(x, y, w, h, val, state) {
  const colors = {
    default:   { fill: '#8b5cf6', stroke: '#6d28d9', text: '#fff' },
    sorted:    { fill: '#22c55e', stroke: '#16a34a', text: '#fff' },
    splitting: { fill: '#f59e0b', stroke: '#d97706', text: '#fff' },
    comparing: { fill: '#60a5fa', stroke: '#3b82f6', text: '#fff' },
    merging:   { fill: '#f97316', stroke: '#ea580c', text: '#fff' },
  };
  const c = colors[state] || colors.default;
  const radius = 6;

  // shadow
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur    = 7;
  ctx.shadowOffsetY = 3;

  // rounded rect fill
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.restore();

  // border
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // value text — scale font to block size
  const fontSize = Math.max(9, Math.min(14, w * 0.35));
  ctx.fillStyle = c.text;
  ctx.font = `bold ${fontSize}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(val, x + w / 2, y + h / 2);
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