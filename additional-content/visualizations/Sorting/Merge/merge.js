/* ── MergeSortBasic.js ── */

// ── DOM refs ────────────────────────────────────────────────────────────────
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
const statMerges  = document.getElementById('stat-merges');
const statStatus  = document.getElementById('stat-status');

// ── Colours ─────────────────────────────────────────────────────────────────
// Unlike selection/insertion, bars only turn green on the FINAL merge pass
// (when run size covers the whole array). Until then they stay purple or
// show the active merge colours below.
const COLOR = {
  default: '#8b5cf6',   // unsorted / not in current merge window
  left:    '#facc15',   // left pointer being compared  (yellow)
  right:   '#f472b6',   // right pointer being compared (pink)
  merging: '#fb923c',   // element actively being written into aux  (orange)
  sorted:  '#22c55e',   // confirmed sorted — only set on final pass
};

// ── Runtime state ────────────────────────────────────────────────────────────
let array       = [];
let original    = [];   // snapshot taken at buildArray time — reset restores this
let n           = parseInt(sliderN.value);
let running     = false;
let comparisons = 0;
let merges      = 0;

// For draw coloring during live animation
let leftPtr   = -1;
let rightPtr  = -1;
let mergeIdx  = -1;
let sortedSet = new Set();  // indices confirmed in final position — turn green immediately

// Stepwise
let stepHistory = [];
let stepCursor  = -1;

// ── Array helpers ────────────────────────────────────────────────────────────
function buildArray(mode = 'reset') {
  if (mode === 'new' || mode === 'shuffle') {
    array = Array.from({ length: n }, (_, i) => i + 1);
    if (mode === 'shuffle') {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    original = [...array];   // save for reset
  } else {
    // 'reset' — restore original, don't re-randomise
    array = [...original];
  }
  resetState();
  draw();
}

function resetState() {
  leftPtr = rightPtr = mergeIdx = -1;
  sortedSet = new Set();
  comparisons = merges = 0;
  running = false;
  stepHistory = []; stepCursor = -1;
  updateStats('Ready');
  setButtons(false);
  syncStepwiseUI();
}

function updateStats(status) {
  statCmp.textContent    = comparisons;
  statMerges.textContent = merges;
  statStatus.textContent = status;
}

function setButtons(sorting) {
  btnSolve.disabled   = sorting;
  btnShuffle.disabled = sorting;
  sliderN.disabled    = sorting;
  btnReset.disabled   = false;   // reset is always available
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

// ── Drawing ──────────────────────────────────────────────────────────────────
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
}

function barColor(idx) {
  if (idx === leftPtr)       return COLOR.left;
  if (idx === rightPtr)      return COLOR.right;
  if (idx === mergeIdx)      return COLOR.merging;
  if (sortedSet.has(idx))    return COLOR.sorted;
  return COLOR.default;
}

function draw() {
  const W = canvas.width, H = canvas.height;
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

// ── Speed → delay ────────────────────────────────────────────────────────────
function getDelay() {
  const s = parseInt(sliderSpeed.value);
  return Math.round(600 * Math.pow(2 / 600, (s - 1) / 99));
}

// ── Bottom-up merge sort (async generator) ────────────────────────────────────
async function* mergeSortGen() {
  const s   = array;
  const len = s.length;
  const aux = [...s];

  for (let size = 1; size < len; size *= 2) {
    const isFinalPass = (size * 2 >= len);

    for (let left = 0; left < len; left += 2 * size) {
      const mid   = Math.min(left + size - 1, len - 1);
      const right = Math.min(left + 2 * size - 1, len - 1);
      if (mid >= right) continue;

      merges++;
      updateStats('Merging…');

      for (let k = left; k <= right; k++) aux[k] = s[k];

      let i = left, j = mid + 1, k = left;

      while (i <= mid && j <= right) {
        comparisons++;
        leftPtr  = i;
        rightPtr = j;
        mergeIdx = -1;
        draw(); yield;

        if (aux[i] <= aux[j]) {
          mergeIdx = k;
          s[k] = aux[i++];
          if (isFinalPass) sortedSet.add(k);
          k++;
        } else {
          mergeIdx = k;
          s[k] = aux[j++];
          if (isFinalPass) sortedSet.add(k);
          k++;
        }
        draw(); yield;
      }

      while (i <= mid) {
        leftPtr = i; rightPtr = -1; mergeIdx = k;
        s[k] = aux[i++];
        if (isFinalPass) sortedSet.add(k);
        k++;
        draw(); yield;
      }
      while (j <= right) {
        rightPtr = j; leftPtr = -1; mergeIdx = k;
        s[k] = aux[j++];
        if (isFinalPass) sortedSet.add(k);
        k++;
        draw(); yield;
      }

      leftPtr = rightPtr = mergeIdx = -1;
      draw(); yield;
    }
  }
}

async function runSort() {
  running = true;
  setButtons(true);
  updateStats('Sorting…');

  const gen   = mergeSortGen();
  const delay = () => new Promise(res => setTimeout(res, getDelay()));

  let result = gen.next();
  while (!result.done) {
    if (!running) break;
    await delay();
    result = gen.next();
  }
  if (running) finishSort();
}

function finishSort() {
  leftPtr = rightPtr = mergeIdx = -1;
  for (let i = 0; i < array.length; i++) sortedSet.add(i);
  running = false;
  draw();
  updateStats('Done ✓');
  setButtons(false);
}

// ── Step history (stepwise mode) ──────────────────────────────────────────────
function buildStepHistory() {
  const s   = [...array];
  const len = s.length;
  stepHistory = [];
  let cmp = 0, mrg = 0;
  const ss = new Set();   // sorted set accumulates through history

  function snap(status, lp, rp, mi) {
    stepHistory.push({
      array:      [...s],
      leftPtr:    lp, rightPtr: rp, mergeIdx: mi,
      sortedSet:  new Set(ss),
      comparisons: cmp, merges: mrg, status,
    });
  }

  snap('Ready — press Next Step to begin', -1, -1, -1);

  for (let size = 1; size < len; size *= 2) {
    const isFinalPass = (size * 2 >= len);

    for (let left = 0; left < len; left += 2 * size) {
      const mid   = Math.min(left + size - 1, len - 1);
      const right = Math.min(left + 2 * size - 1, len - 1);
      if (mid >= right) continue;

      mrg++;
      snap(`Merging window [${left}…${mid}] + [${mid+1}…${right}]`, -1, -1, -1);

      const aux = [...s];
      let i = left, j = mid + 1, k = left;

      while (i <= mid && j <= right) {
        cmp++;
        snap(`Comparing s[${i}]=${aux[i]} vs s[${j}]=${aux[j]}`, i, j, -1);

        if (aux[i] <= aux[j]) {
          s[k] = aux[i];
          if (isFinalPass) ss.add(k);
          snap(`${aux[i]} ≤ ${aux[j]} — place ${aux[i]} at position ${k}`, i, j, k);
          i++; k++;
        } else {
          s[k] = aux[j];
          if (isFinalPass) ss.add(k);
          snap(`${aux[j]} < ${aux[i]} — place ${aux[j]} at position ${k}`, i, j, k);
          j++; k++;
        }
      }
      while (i <= mid) {
        s[k] = aux[i];
        if (isFinalPass) ss.add(k);
        snap(`Right exhausted — copy ${aux[i]} to position ${k}`, i, -1, k);
        i++; k++;
      }
      while (j <= right) {
        s[k] = aux[j];
        if (isFinalPass) ss.add(k);
        snap(`Left exhausted — copy ${aux[j]} to position ${k}`, -1, j, k);
        j++; k++;
      }

      snap(`Window [${left}…${right}] merged ✓`, -1, -1, -1);
    }
  }

  // Final snap: all sorted
  for (let i = 0; i < len; i++) ss.add(i);
  snap('Done ✓ — array fully sorted!', -1, -1, -1);
}

function applySnapshot(snap) {
  array       = [...snap.array];
  leftPtr     = snap.leftPtr;
  rightPtr    = snap.rightPtr;
  mergeIdx    = snap.mergeIdx;
  sortedSet   = new Set(snap.sortedSet);
  comparisons = snap.comparisons;
  merges      = snap.merges;
  updateStats(snap.status);
  draw();
}

// ── Event listeners ──────────────────────────────────────────────────────────
sliderN.addEventListener('input', () => {
  n = parseInt(sliderN.value);
  valN.textContent = n;
  buildArray('new');
});

sliderSpeed.addEventListener('input', () => {
  valSpeed.textContent = sliderSpeed.value + '×';
});

chkStepwise.addEventListener('change', () => {
  buildArray('reset');
  syncStepwiseUI();
});

btnReset.addEventListener('click', () => {
  running = false;   // stop any running animation
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

// ── Init ─────────────────────────────────────────────────────────────────────
resizeCanvas();
buildArray('new');
syncStepwiseUI();