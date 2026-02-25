// ── state ──────────────────────────────────────────────────────────────────
let array = [];
let solving = false;
let cancelToken = { cancelled: false };

// ── DOM refs ───────────────────────────────────────────────────────────────
const visualizer  = document.getElementById('visualizer');
const entriesSlider = document.getElementById('entries');
const entriesVal  = document.getElementById('entries-val');
const speedSlider = document.getElementById('speed');
const speedVal    = document.getElementById('speed-val');
const realtimeCb  = document.getElementById('realtime');
const stepwiseCb  = document.getElementById('stepwise');
const btnReset    = document.getElementById('btn-reset');
const btnShuffle  = document.getElementById('btn-shuffle');
const btnSolve    = document.getElementById('btn-solve');

// ── helpers ────────────────────────────────────────────────────────────────

// speed slider: 1x → ~500ms delay, 100x → ~5ms delay  (log scale)
function getDelay() {
  const s = parseInt(speedSlider.value); // 1–100
  // map 1→500ms, 100→5ms  (log interpolation)
  return Math.round(500 * Math.pow(5 / 500, (s - 1) / 99));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Build a sorted array [1 .. n] and optionally shuffle it
function buildArray(n, shuffle = true) {
  array = Array.from({ length: n }, (_, i) => i + 1);
  if (shuffle) shuffleArray(array);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ── rendering ──────────────────────────────────────────────────────────────
/*
  Bar states (via data-state attribute):
    default   – unsorted, untouched
    comparing – currently being compared (j pointer)
    minimum   – current minimum candidate
    pivot     – outer loop index (i)
    sorted    – finalized in place
*/
function render(states = {}) {
  const n = array.length;
  visualizer.innerHTML = '';

  // For very large arrays, use canvas instead of DOM bars
  if (n > 300) {
    renderCanvas(states);
    return;
  }

  array.forEach((val, idx) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${(val / n) * 100}%`;
    if (states[idx]) bar.dataset.state = states[idx];
    visualizer.appendChild(bar);
  });
}

function renderCanvas(states = {}) {
  const canvas = document.createElement('canvas');
  canvas.width  = visualizer.clientWidth  || 800;
  canvas.height = visualizer.clientHeight || 400;
  visualizer.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const n = array.length;
  const barW = canvas.width / n;

  const colorMap = {
    default:   '#4a90d9',
    comparing: '#f5a623',
    minimum:   '#e74c3c',
    pivot:     '#9b59b6',
    sorted:    '#2ecc71',
  };

  array.forEach((val, idx) => {
    const h = (val / n) * canvas.height;
    const state = states[idx] || 'default';
    ctx.fillStyle = colorMap[state] || colorMap.default;
    ctx.fillRect(idx * barW, canvas.height - h, Math.max(barW - 0.5, 1), h);
  });
}

// ── selection sort (async, cancellable) ────────────────────────────────────
async function selectionSort(token) {
  const n = array.length;
  const sorted = new Set();

  for (let i = 0; i < n; i++) {
    if (token.cancelled) return;

    let min = i;

    for (let j = i + 1; j < n; j++) {
      if (token.cancelled) return;

      // Highlight: i = pivot, min = minimum, j = comparing
      if (!realtimeCb.checked) {
        const states = {};
        sorted.forEach(k => (states[k] = 'sorted'));
        states[i]   = 'pivot';
        states[min] = 'minimum';
        states[j]   = 'comparing';
        render(states);
        await sleep(getDelay());
      }

      if (array[j] < array[min]) {
        min = j;
      }
    }

    // Swap
    [array[i], array[min]] = [array[min], array[i]];
    sorted.add(i);

    if (!realtimeCb.checked) {
      const states = {};
      sorted.forEach(k => (states[k] = 'sorted'));
      render(states);
      await sleep(getDelay());
    }
  }

  // Final render – all sorted
  const states = {};
  array.forEach((_, k) => (states[k] = 'sorted'));
  render(states);
}

// ── control logic ──────────────────────────────────────────────────────────
function reset() {
  stopSolving();
  const n = parseInt(entriesSlider.value);
  buildArray(n, false); // sorted order on reset
  render();
}

function shuffle() {
  stopSolving();
  shuffleArray(array);
  render();
}

function stopSolving() {
  cancelToken.cancelled = true;
  cancelToken = { cancelled: false };
  solving = false;
  btnSolve.textContent = 'Solve';
  setControlsDisabled(false);
}

function setControlsDisabled(disabled) {
  entriesSlider.disabled = disabled;
  btnReset.disabled      = disabled;
  btnShuffle.disabled    = disabled;
}

async function solve() {
  if (solving) {
    stopSolving();
    return;
  }
  solving = true;
  btnSolve.textContent = 'Stop';
  setControlsDisabled(true);

  const token = cancelToken;

  if (realtimeCb.checked) {
    // Run entire algorithm synchronously then render once
    const n = array.length;
    for (let i = 0; i < n; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) {
        if (array[j] < array[min]) min = j;
      }
      [array[i], array[min]] = [array[min], array[i]];
    }
    const states = {};
    array.forEach((_, k) => (states[k] = 'sorted'));
    render(states);
  } else {
    await selectionSort(token);
  }

  if (!token.cancelled) {
    solving = false;
    btnSolve.textContent = 'Solve';
    setControlsDisabled(false);
  }
}

// ── event listeners ────────────────────────────────────────────────────────
entriesSlider.addEventListener('input', () => {
  const n = parseInt(entriesSlider.value);
  entriesVal.textContent = n;
  if (!solving) {
    buildArray(n, false);
    render();
  }
});

speedSlider.addEventListener('input', () => {
  const s = parseInt(speedSlider.value);
  speedVal.textContent = `${s}x`;
});

realtimeCb.addEventListener('change', () => {
  speedSlider.disabled = realtimeCb.checked;
});

btnReset.addEventListener('click', reset);
btnShuffle.addEventListener('click', shuffle);
btnSolve.addEventListener('click', solve);

// ── init ───────────────────────────────────────────────────────────────────
buildArray(50, false);
render();