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
  default:   '#8b5cf6',   // unsorted — purple
  sorted:    '#22c55e',   // confirmed sorted — green
  swapping:  '#ef4444',   // pair being swapped — red
  comparing: '#60a5fa',   // j pointer (left) — blue
  j1:        '#f59e0b',   // j+1 pointer (right) — amber
};

// ── Runtime state ──────────────────────────────────────────────────────────
let array       = [];
let n           = parseInt(sliderN.value);

// sortedFrom: indices >= sortedFrom are confirmed sorted (bubble sort confirms
// the LARGEST element at the END of each pass, so sorted zone grows from right)
let sortedFrom  = Infinity;
let jPointer    = -1;   // left of the compared pair
let j1Pointer   = -1;   // right of the compared pair  (j+1)
let swapping    = false; // true only for the one frame showing a swap
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
  sortedFrom   = Infinity;
  jPointer     = -1;
  j1Pointer    = -1;
  swapping     = false;
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
  const s   = [...array];
  const len = s.length;
  stepHistory = [];

  let sf = Infinity, jp = -1, j1p = -1, sw_ = false, cmp = 0, swc = 0;

  const snap = (status) => stepHistory.push({
    array: [...s],
    sortedFrom: sf,
    jPointer: jp, j1Pointer: j1p,
    swapping: sw_,
    comparisons: cmp, swaps: swc, status,
  });

  snap('Ready — press Next Step to begin');

  for (let i = 0; i < len; i++) {
    let swappedThisPass = false;
    jp = -1; j1p = -1; sw_ = false;
    snap(`Pass i=${i}: bubbling through indices 0 → ${len - i - 1}`);

    for (let j = 0; j < len - i - 1; j++) {
      jp = j; j1p = j + 1; sw_ = false;
      cmp++;
      snap(`Comparing s[${j}]=${s[j]} vs s[${j+1}]=${s[j+1]}`);

      if (s[j] > s[j + 1]) {
        sw_ = true;
        snap(`s[${j}]=${s[j]} > s[${j+1}]=${s[j+1]} — swapping!`);
        [s[j], s[j + 1]] = [s[j + 1], s[j]];
        swc++;
        swappedThisPass = true;
        sw_ = false;
        snap(`Swapped ✓ — s[${j}]=${s[j]}, s[${j+1}]=${s[j+1]}`);
      }
    }

    // End of pass: the element at (len - i - 1) is now in its final place
    jp = -1; j1p = -1; sw_ = false;
    sf = len - i - 1;
    snap(`Pass ${i} done — index ${len - i - 1} (value ${s[len - i - 1]}) is sorted ✓`);

    if (!swappedThisPass) {
      sf = 0;
      snap('No swaps this pass — array is fully sorted! Early exit ✓');
      break;
    }
  }

  sf = 0;
  snap('Done ✓ — array fully sorted!');
}

function applySnapshot(snap) {
  array       = [...snap.array];
  sortedFrom  = snap.sortedFrom;
  jPointer    = snap.jPointer;
  j1Pointer   = snap.j1Pointer;
  swapping    = snap.swapping;
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
  if (idx >= sortedFrom)              return COLOR.sorted;
  if (swapping && (idx === jPointer || idx === j1Pointer)) return COLOR.swapping;
  if (idx === jPointer)               return COLOR.comparing;
  if (idx === j1Pointer)              return COLOR.j1;
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

// ── Animated sort (bubble sort v3 — with early-exit) ──────────────────────
//
//  def bubble_sort_v3(arr):
//      n = len(arr)
//      for i in range(n):
//          swapped = False
//          for j in range(0, n - i - 1):
//              if arr[j] > arr[j + 1]:
//                  arr[j], arr[j + 1] = arr[j + 1], arr[j]
//                  swapped = True
//          if not swapped:
//              break
//      return arr
//
async function* bubbleSortGen() {
  const s   = array;
  const len = s.length;

  for (let i = 0; i < len; i++) {
    let swappedThisPass = false;

    for (let j = 0; j < len - i - 1; j++) {
      // Show the comparison (no swap yet)
      jPointer  = j;
      j1Pointer = j + 1;
      swapping  = false;
      comparisons++;
      updateStats(`Pass ${i} — comparing [${j}] vs [${j+1}]`);
      draw();
      yield;

      if (s[j] > s[j + 1]) {
        // Highlight as swapping
        swapping = true;
        draw();
        yield;

        // Perform the swap
        [s[j], s[j + 1]] = [s[j + 1], s[j]];
        swaps++;
        swappedThisPass = true;
        swapping = false;
        draw();
        yield;
      }
    }

    // End of pass: confirm the last unsorted element is now in final place
    jPointer  = -1;
    j1Pointer = -1;
    swapping  = false;
    sortedFrom = len - i - 1;   // everything from here to the right is sorted
    draw();
    yield;

    // Early exit — if no swap happened the whole array is already sorted
    if (!swappedThisPass) {
      sortedFrom = 0;
      break;
    }
  }

  jPointer  = -1;
  j1Pointer = -1;
  swapping  = false;
  sortedFrom = 0;
}

async function runSort() {
  running = true;
  setButtons(true);
  updateStats('Sorting…');

  const gen   = bubbleSortGen();
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
  sortedFrom = 0;
  jPointer  = -1;
  j1Pointer = -1;
  swapping  = false;
  running   = false;
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