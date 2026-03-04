// ── Canvas & DOM refs ──────────────────────────────────────────────────────
const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');

const sliderN     = document.getElementById('slider-n');
const sliderSpeed = document.getElementById('slider-speed');
const valN        = document.getElementById('val-n');
const valSpeed    = document.getElementById('val-speed');
const chkStepwise = document.getElementById('chk-stepwise');

const btnReset    = document.getElementById('btn-reset');
const btnShuffle  = document.getElementById('btn-shuffle');
const btnSolve    = document.getElementById('btn-solve');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');

const statCmp     = document.getElementById('stat-cmp');
const statSwaps   = document.getElementById('stat-swaps');
const statStatus  = document.getElementById('stat-status');

// ── Colours ────────────────────────────────────────────────────────────────
const COLOR = {
  default:   '#8b5cf6',
  sorted:    '#22c55e',
  minimum:   '#ef4444',
  comparing: '#60a5fa',
  outer:     '#f59e0b',
};

// ── Runtime state ──────────────────────────────────────────────────────────
let array       = [];
let n           = parseInt(sliderN.value);

let sortedUpTo  = -1;
let iPointer    = -1;
let jPointer    = -1;
let minPointer  = -1;
let running     = false;
let comparisons = 0;
let swaps       = 0;

// stepwise
let stepHistory = [];
let stepCursor  = -1;

// ── Helpers ────────────────────────────────────────────────────────────────
function buildArray(mode = 'reset') {
  array = Array.from({ length: n }, (_, i) => i + 1);
  if (mode === 'shuffle') {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  resetState();
  draw();
}

function resetState() {
  sortedUpTo   = -1;
  iPointer     = -1;
  jPointer     = -1;
  minPointer   = -1;
  comparisons  = 0;
  swaps        = 0;
  running      = false;
  stepHistory  = [];
  stepCursor   = -1;
  updateStats('Ready');
  setButtons(false);
  syncStepwiseUI();
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

function syncStepwiseUI() {
  const sw = chkStepwise.checked;
  btnSolve.style.display = sw ? 'none' : '';
  btnPrev.style.display  = sw ? ''     : 'none';
  btnNext.style.display  = sw ? ''     : 'none';
  if (sw) updateStepButtons();
}

function updateStepButtons() {
  const built = stepHistory.length > 0;
  btnPrev.disabled    = !built || stepCursor <= 0;
  btnNext.disabled    = built && stepCursor >= stepHistory.length - 1;
  btnReset.disabled   = false;
  btnShuffle.disabled = false;
  sliderN.disabled    = false;
}

// ── Step history ───────────────────────────────────────────────────────────
function buildStepHistory() {
  const s   = [...array];   // local working copy
  const len = s.length;
  stepHistory = [];

  let st = -1, ip = -1, jp = -1, mp = -1, cmp = 0, sw = 0;

  const snap = (status) => stepHistory.push({
    array: [...s], sortedUpTo: st,
    iPointer: ip, jPointer: jp, minPointer: mp,
    comparisons: cmp, swaps: sw, status,
  });

  snap('Ready — press Next Step to begin');

  for (let i = 0; i < len; i++) {
    ip = i; mp = i; jp = -1;
    snap(`Outer i=${i}: scanning for minimum starting at value ${s[i]}`);

    for (let j = i + 1; j < len; j++) {
      jp = j;
      cmp++;
      snap(`Comparing s[${j}]=${s[j]} vs current min s[${mp}]=${s[mp]}`);

      if (s[j] < s[mp]) {
        mp = j;
        snap(`New minimum! s[${mp}]=${s[mp]} at index ${mp}`);
      }
    }

    if (mp !== i) {
      snap(`Swapping s[${i}]=${s[i]} ↔ s[${mp}]=${s[mp]}`);
      [s[i], s[mp]] = [s[mp], s[i]];
      sw++;
    }

    st = i; ip = -1; jp = -1; mp = -1;
    snap(`Index ${i} sorted ✓ (value ${s[i]})`);
  }

  st = len - 1;
  snap('Done ✓ — array fully sorted!');
}

function applySnapshot(snap) {
  array       = [...snap.array];
  sortedUpTo  = snap.sortedUpTo;
  iPointer    = snap.iPointer;
  jPointer    = snap.jPointer;
  minPointer  = snap.minPointer;
  comparisons = snap.comparisons;
  swaps       = snap.swaps;
  updateStats(snap.status);
  draw();
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

  const gap  = Math.max(1, Math.floor(W / array.length / 8));
  const barW = (W - gap * (array.length + 1)) / array.length;
  const usH  = H - 4;

  for (let i = 0; i < array.length; i++) {
    const barH = Math.max(2, (array[i] / n) * usH);
    const x    = gap + i * (barW + gap);
    const y    = H - barH;

    ctx.fillStyle = barColor(i);
    ctx.beginPath();
    if (barW >= 4) {
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

// ── Speed → delay ──────────────────────────────────────────────────────────
function getDelay() {
  const s = parseInt(sliderSpeed.value);
  return Math.round(600 * Math.pow(2 / 600, (s - 1) / 99));
}

// ── Animated sort ──────────────────────────────────────────────────────────
async function* selectionSortGen() {
  const s   = array;
  const len = s.length;

  for (let i = 0; i < len; i++) {
    iPointer = i; minPointer = i;

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

  iPointer = -1; sortedUpTo = len - 1;
}

async function runSort() {
  running = true;
  setButtons(true);
  updateStats('Sorting…');

  const gen = selectionSortGen();

  const delay = () => new Promise(res => setTimeout(res, getDelay()));
  let result = gen.next();
  while (!result.done) {
    if (!running) break;
    draw();
    await delay();
    result = gen.next();
  }
  if (running) finishSort();
}

function finishSort() {
  sortedUpTo = array.length - 1;
  iPointer = -1; jPointer = -1; minPointer = -1;
  running  = false;
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

chkStepwise.addEventListener('change', () => {
  buildArray('reset');   // clear everything, rebuild fresh
  syncStepwiseUI();
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
  if (!array.length || chkStepwise.checked) return;
  runSort();
});

btnNext.addEventListener('click', () => {
  if (stepHistory.length === 0) {
    buildStepHistory();
    stepCursor = 0;
  } else {
    stepCursor = Math.min(stepCursor + 1, stepHistory.length - 1);
  }
  applySnapshot(stepHistory[stepCursor]);
  updateStepButtons();
});

btnPrev.addEventListener('click', () => {
  if (stepHistory.length === 0 || stepCursor <= 0) return;
  stepCursor = Math.max(stepCursor - 1, 0);
  applySnapshot(stepHistory[stepCursor]);
  updateStepButtons();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});

// ── Init ───────────────────────────────────────────────────────────────────
resizeCanvas();
buildArray('reset');
syncStepwiseUI();