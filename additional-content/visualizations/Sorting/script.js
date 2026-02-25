// ── State ──────────────────────────────────────────────────────────────────
const canvas   = document.getElementById('canvas');
const ctx      = canvas.getContext('2d');

const sliderN     = document.getElementById('slider-n');
const sliderSpeed = document.getElementById('slider-speed');
const valN        = document.getElementById('val-n');
const valSpeed    = document.getElementById('val-speed');
const chkRealtime = document.getElementById('chk-realtime');

const btnReset   = document.getElementById('btn-reset');
const btnShuffle = document.getElementById('btn-shuffle');
const btnSolve   = document.getElementById('btn-solve');

const statCmp    = document.getElementById('stat-cmp');
const statSwaps  = document.getElementById('stat-swaps');
const statStatus = document.getElementById('stat-status');

let array       = [];
let n           = parseInt(sliderN.value);
let sortedUpTo  = -1;      // indices 0..sortedUpTo are in final position
let iPointer    = -1;      // outer loop pointer
let jPointer    = -1;      // inner loop pointer (scanning)
let minPointer  = -1;      // current minimum index
let running     = false;
let animFrame   = null;
let comparisons = 0;
let swaps       = 0;

// ── Colour palette ─────────────────────────────────────────────────────────
const COLOR = {
  default:   '#8b5cf6',
  sorted:    '#22c55e',
  minimum:   '#ef4444',
  comparing: '#60a5fa',
  outer:     '#f59e0b',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function buildArray(mode = 'reset') {
  if (mode === 'reset') {
    // sequential 1..n
    array = Array.from({ length: n }, (_, i) => i + 1);
  } else {
    // shuffle existing or fresh
    array = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  resetState();
  draw();
}

function resetState() {
  sortedUpTo  = -1;
  iPointer    = -1;
  jPointer    = -1;
  minPointer  = -1;
  comparisons = 0;
  swaps       = 0;
  running     = false;
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  updateStats('Ready');
  setButtons(false);
}

function updateStats(status) {
  statCmp.textContent    = comparisons;
  statSwaps.textContent  = swaps;
  statStatus.textContent = status;
}

function setButtons(sorting) {
  btnSolve.disabled   = sorting;
  btnReset.disabled   = sorting;
  btnShuffle.disabled = sorting;
  sliderN.disabled    = sorting;
}

// ── Drawing ────────────────────────────────────────────────────────────────
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
}

function barColor(idx) {
  if (idx <= sortedUpTo)  return COLOR.sorted;
  if (idx === iPointer)   return COLOR.outer;
  if (idx === minPointer) return COLOR.minimum;
  if (idx === jPointer)   return COLOR.comparing;
  return COLOR.default;
}

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (!array.length) return;

  const maxVal  = n;                          // max possible value
  const gap     = Math.max(1, Math.floor(W / array.length / 8));
  const barW    = (W - gap * (array.length + 1)) / array.length;
  const usableH = H - 4;

  for (let i = 0; i < array.length; i++) {
    const barH = Math.max(2, (array[i] / maxVal) * usableH);
    const x    = gap + i * (barW + gap);
    const y    = H - barH;

    ctx.fillStyle = barColor(i);
    ctx.beginPath();
    if (barW >= 4) {
      // rounded top corners
      const r = Math.min(2, barW / 2);
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, H);
      ctx.lineTo(x, H);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    } else {
      ctx.rect(x, y, Math.max(barW, 1), barH);
    }
    ctx.fill();
  }
}

// ── Speed mapping ─────────────────────────────────────────────────────────
// slider 1 → ~600 ms delay, slider 100 → ~2 ms delay (log scale)
function getDelay() {
  if (chkRealtime.checked) return 0;
  const s = parseInt(sliderSpeed.value);   // 1–100
  // map: 1→600ms, 100→2ms  (exponential)
  return Math.round(600 * Math.pow(2 / 600, (s - 1) / 99));
}

// ── Selection Sort (async generator) ──────────────────────────────────────
async function* selectionSortGen() {
  const s = array;
  const len = s.length;

  for (let i = 0; i < len; i++) {
    iPointer   = i;
    minPointer = i;

    for (let j = i + 1; j < len; j++) {
      jPointer = j;
      comparisons++;
      updateStats('Sorting…');
      draw();
      yield;

      if (s[j] < s[minPointer]) {
        minPointer = j;
        draw();
        yield;
      }
    }

    // swap
    if (minPointer !== i) {
      [s[i], s[minPointer]] = [s[minPointer], s[i]];
      swaps++;
    }
    sortedUpTo = i;
    jPointer   = -1;
    minPointer = -1;
    draw();
    yield;
  }

  iPointer   = -1;
  sortedUpTo = len - 1;
}

// ── Run loop ───────────────────────────────────────────────────────────────
async function runSort() {
  running = true;
  setButtons(true);
  updateStats('Sorting…');

  const gen = selectionSortGen();

  if (chkRealtime.checked) {
    // burn through all steps instantly, just do one final draw
    for (const _ of (function* () { yield* gen; })()) { /* no-op */ }
    draw();
    finishSort();
    return;
  }

  const delay = () => new Promise(res => setTimeout(res, getDelay()));

  for await (const _ of gen) {
    if (!running) break;
    draw();
    await delay();
  }

  if (running) finishSort();
}

function finishSort() {
  sortedUpTo  = array.length - 1;
  iPointer    = -1;
  jPointer    = -1;
  minPointer  = -1;
  running     = false;
  draw();
  updateStats('Done ✓');
  setButtons(false);
}

// ── Event listeners ────────────────────────────────────────────────────────
sliderN.addEventListener('input', () => {
  n = parseInt(sliderN.value);
  valN.textContent = n;
  buildArray('reset');
});

sliderSpeed.addEventListener('input', () => {
  valSpeed.textContent = sliderSpeed.value + '×';
});

chkRealtime.addEventListener('change', () => {
  sliderSpeed.disabled = chkRealtime.checked;
});

btnReset.addEventListener('click', () => {
  n = parseInt(sliderN.value);
  buildArray('reset');
});

btnShuffle.addEventListener('click', () => {
  n = parseInt(sliderN.value);
  buildArray('shuffle');
});

btnSolve.addEventListener('click', () => {
  if (!array.length) return;
  // if already sorted or fresh, go
  runSort();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

// ── Init ───────────────────────────────────────────────────────────────────
resizeCanvas();
buildArray('reset');