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
  default:   '#8b5cf6',  // unsorted
  sorted:    '#22c55e',  // confirmed sorted
  outer:     '#f59e0b',  // i — element being inserted
  comparing: '#60a5fa',  // j — shifting left
  neighbor:  '#ef4444',  // j-1 — the bar being compared against
};

// ── Runtime state ──────────────────────────────────────────────────────────
let array       = [];
let n           = parseInt(sliderN.value);

// live pointers used during animation
let sortedUpTo  = -1;  // everything 0..sortedUpTo is in sorted region
let iPointer    = -1;  // outer loop: element picked up
let jPointer    = -1;  // inner loop: current swap position
let running     = false;
let comparisons = 0;
let swaps       = 0;

// stepwise
let stepHistory = [];
let stepCursor  = -1;

// ── Array helpers ──────────────────────────────────────────────────────────
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

// ── Drawing ────────────────────────────────────────────────────────────────
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
}

function barColor(idx) {
  if (idx === jPointer)         return COLOR.comparing;
  if (idx === jPointer - 1)     return COLOR.neighbor;
  if (idx === iPointer && jPointer === -1) return COLOR.outer;
  if (idx <= sortedUpTo)        return COLOR.sorted;
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

// ── Animated insertion sort (async generator) ──────────────────────────────
// Direct translation of:
//   for (i = 1; i < n; i++) {
//     j = i;
//     while ((j > 0) && (s[j] < s[j-1])) {
//       swap(&s[j], &s[j-1]);
//       j = j - 1;
//     }
//   }
async function* insertionSortGen() {
  const s   = array;
  const len = s.length;

  for (let i = 1; i < len; i++) {
    iPointer   = i;
    jPointer   = i;
    sortedUpTo = i - 1;
    updateStats('Sorting…');
    draw();
    yield;

    let j = i;
    while (j > 0) {
      jPointer = j;
      comparisons++;
      updateStats('Sorting…');
      draw();
      yield;

      if (s[j] < s[j - 1]) {
        [s[j], s[j - 1]] = [s[j - 1], s[j]];
        swaps++;
        j = j - 1;
        draw();
        yield;
      } else {
        break;  // element is in place, no more swaps needed
      }
    }

    // mark sorted region and clear inner pointer
    sortedUpTo = i;
    jPointer   = -1;
    iPointer   = -1;
    draw();
    yield;
  }

  sortedUpTo = len - 1;
}

async function runSort() {
  running = true;
  setButtons(true);
  updateStats('Sorting…');

  const gen   = insertionSortGen();
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
  iPointer   = -1;
  jPointer   = -1;
  running    = false;
  draw();
  updateStats('Done ✓');
  setButtons(false);
}

// ── Step history (stepwise mode) ───────────────────────────────────────────
function buildStepHistory() {
  const s   = [...array];
  const len = s.length;
  stepHistory = [];

  let st = -1, ip = -1, jp = -1, cmp = 0, sw = 0;

  const snap = (status) => stepHistory.push({
    array: [...s],
    sortedUpTo: st,
    iPointer:   ip,
    jPointer:   jp,
    comparisons: cmp,
    swaps:       sw,
    status,
  });

  snap('Ready — press Next Step to begin');

  for (let i = 1; i < len; i++) {
    ip = i; jp = i; st = i - 1;
    snap(`Outer i=${i}: picking up value ${s[i]} to insert`);

    let j = i;
    while (j > 0) {
      jp = j;
      cmp++;
      snap(`Comparing s[${j}]=${s[j]} with s[${j-1}]=${s[j-1]}`);

      if (s[j] < s[j - 1]) {
        snap(`s[${j}]=${s[j]} < s[${j-1}]=${s[j-1]} — swapping`);
        [s[j], s[j - 1]] = [s[j - 1], s[j]];
        sw++;
        j = j - 1;
      } else {
        snap(`s[${j}]=${s[j]} ≥ s[${j-1}]=${s[j-1]} — element in place, stopping`);
        break;
      }
    }

    st = i; ip = -1; jp = -1;
    snap(`Index 0..${i} sorted ✓`);
  }

  st = len - 1;
  snap('Done ✓ — array fully sorted!');
}

function applySnapshot(snap) {
  array       = [...snap.array];
  sortedUpTo  = snap.sortedUpTo;
  iPointer    = snap.iPointer;
  jPointer    = snap.jPointer;
  comparisons = snap.comparisons;
  swaps       = snap.swaps;
  updateStats(snap.status);
  draw();
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
  buildArray('reset');
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