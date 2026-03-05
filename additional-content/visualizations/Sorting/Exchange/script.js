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
  swapping:  '#ef4444',   // pair mid-swap — red
  comparing: '#60a5fa',   // b pointer — blue
  outer:     '#f59e0b',   // a pointer — amber
};

// ── Runtime state ──────────────────────────────────────────────────────────
let array       = [];
let n           = parseInt(sliderN.value);

// sortedUpTo: indices 0..sortedUpTo are confirmed in final position.
// Exchange sort confirms index `a` at the END of each outer pass (after b
// has scanned all the way to iResults), so sorted zone grows left→right.
let sortedUpTo  = -1;
let aPointer    = -1;   // outer loop — fixed anchor
let bPointer    = -1;   // inner loop — scanning
let swapping    = false;
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
  sortedUpTo  = -1;
  aPointer    = -1;
  bPointer    = -1;
  swapping    = false;
  comparisons = 0;
  swaps       = 0;
  running     = false;
  stepHistory = [];
  stepCursor  = -1;
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

  let su = -1, ap = -1, bp = -1, sw_ = false, cmp = 0, swc = 0;

  const snap = (status) => stepHistory.push({
    array: [...s],
    sortedUpTo: su,
    aPointer: ap, bPointer: bp,
    swapping: sw_,
    comparisons: cmp, swaps: swc, status,
  });

  snap('Ready — press Next Step to begin');

  // Original Delphi:
  //   for a := 0 to iResults - 1 do
  //     for b := a + 1 to iResults do        ← note: inclusive upper bound
  //       if arrSearch[a] > arrSearch[b] then swap
  //
  // iResults is the last valid index = len - 1, so b goes up to len - 1.
  for (let a = 0; a < len - 1; a++) {
    ap = a; bp = -1; sw_ = false;
    snap(`Outer a=${a}: will compare arr[${a}] against every b from ${a+1} to ${len-1}`);

    for (let b = a + 1; b < len; b++) {
      bp = b; sw_ = false;
      cmp++;
      snap(`Comparing arr[${a}]=${s[a]} vs arr[${b}]=${s[b]}`);

      if (s[a] > s[b]) {
        sw_ = true;
        snap(`arr[${a}]=${s[a]} > arr[${b}]=${s[b]} — swapping immediately!`);
        [s[a], s[b]] = [s[b], s[a]];
        swc++;
        sw_ = false;
        snap(`Swapped ✓ — arr[${a}]=${s[a]}, arr[${b}]=${s[b]}`);
      }
    }

    // After inner loop finishes, arr[a] holds the smallest of arr[a..end],
    // so index a is now in its final sorted position.
    bp = -1; sw_ = false;
    su = a;
    snap(`Pass a=${a} done — index ${a} (value ${s[a]}) is sorted ✓`);
  }

  su = len - 1;
  snap('Done ✓ — array fully sorted!');
}

function applySnapshot(snap) {
  array       = [...snap.array];
  sortedUpTo  = snap.sortedUpTo;
  aPointer    = snap.aPointer;
  bPointer    = snap.bPointer;
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
  if (idx <= sortedUpTo)   return COLOR.sorted;
  // During a swap both pointers flash red
  if (swapping && (idx === aPointer || idx === bPointer)) return COLOR.swapping;
  if (idx === aPointer)    return COLOR.outer;
  if (idx === bPointer)    return COLOR.comparing;
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
//
//  Original Delphi:
//    for a := 0 to iResults - 1 do
//      for b := a + 1 to iResults do
//        If arrSearch[a] > arrSearch[b] then
//          Begin
//            sHold := arrSearch[a];
//            arrSearch[a] := arrSearch[b];
//            arrSearch[b] := sHold;
//          End;
//
async function* exchangeSortGen() {
  const s   = array;
  const len = s.length;

  for (let a = 0; a < len - 1; a++) {
    aPointer = a;

    for (let b = a + 1; b < len; b++) {
      // Show the comparison
      bPointer = b;
      swapping = false;
      comparisons++;
      updateStats(`a=${a}, b=${b} — comparing`);
      draw();
      yield;

      if (s[a] > s[b]) {
        // Flash red to show a swap is happening
        swapping = true;
        draw();
        yield;

        // Do the swap
        [s[a], s[b]] = [s[b], s[a]];
        swaps++;
        swapping = false;
        draw();
        yield;
      }
    }

    // Inner loop done — arr[a] is now confirmed in its final place
    bPointer  = -1;
    swapping  = false;
    sortedUpTo = a;
    draw();
    yield;
  }

  aPointer   = -1;
  bPointer   = -1;
  swapping   = false;
  sortedUpTo = len - 1;
}

async function runSort() {
  running = true;
  setButtons(true);
  updateStats('Sorting…');

  const gen   = exchangeSortGen();
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
  aPointer   = -1;
  bPointer   = -1;
  swapping   = false;
  running    = false;
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