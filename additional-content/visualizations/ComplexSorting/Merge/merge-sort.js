/* ── merge-sort.js ── */

const canvas      = document.getElementById('canvas');
const ctx         = canvas.getContext('2d');
const sliderN     = document.getElementById('slider-n');
const sliderSpeed = document.getElementById('slider-speed');
const valN        = document.getElementById('val-n');
const valSpeed    = document.getElementById('val-speed');
const btnShuffle  = document.getElementById('btn-shuffle');
const btnSolve    = document.getElementById('btn-solve');
const btnReset    = document.getElementById('btn-reset');
const btnPrev     = document.getElementById('btn-prev');
const btnNext     = document.getElementById('btn-next');
const chkStep     = document.getElementById('chk-stepwise');
const statCmp     = document.getElementById('stat-cmp');
const statMerges  = document.getElementById('stat-merges');
const statDepth   = document.getElementById('stat-depth');
const statStatus  = document.getElementById('stat-status');

// ── colour palette ─────────────────────────────────────────────────────────
// Deconstruction colours
//   idle      pale purple   not yet reached
//   active    amber         currently being split
//   split     purple        has been divided
//   leaf      sky blue      single element base case
//   done      grey          internal node faded after split complete
//
// Merge colours
//   merging   orange        parent node being assembled
//   cmp_left  yellow-green  left pointer — element under comparison
//   cmp_right pink          right pointer — element under comparison
//   winner    green         element chosen / placed into merged result
//   placed    teal          element already placed, waiting
//   sorted    emerald       node fully merged and sorted

const COLORS = {
  idle:      { fill: '#ddd6fe', stroke: '#a78bfa', text: '#5b21b6' },
  active:    { fill: '#f59e0b', stroke: '#b45309', text: '#fff'    },
  split:     { fill: '#8b5cf6', stroke: '#6d28d9', text: '#fff'    },
  leaf:      { fill: '#38bdf8', stroke: '#0284c7', text: '#fff'    },
  done:      { fill: '#94a3b8', stroke: '#64748b', text: '#fff'    },
  merging:   { fill: '#fb923c', stroke: '#c2410c', text: '#fff'    },
  cmp_left:  { fill: '#facc15', stroke: '#a16207', text: '#1a1a1a' },
  cmp_right: { fill: '#f472b6', stroke: '#be185d', text: '#fff'    },
  winner:    { fill: '#4ade80', stroke: '#15803d', text: '#1a1a1a' },
  placed:    { fill: '#2dd4bf', stroke: '#0f766e', text: '#fff'    },
  sorted:    { fill: '#22c55e', stroke: '#15803d', text: '#fff'    },
};

// ── app state ──────────────────────────────────────────────────────────────
let array     = [];
let treeRoot  = null;
let steps     = [];
let stepIndex = -1;
let animTimer = null;
let uiMode    = 'idle';
let cmpCount  = 0;
let mergeCount = 0;

// ── helpers ────────────────────────────────────────────────────────────────
function freshArray(n) {
  const vals = [], used = new Set();
  while (vals.length < n) {
    const v = Math.floor(Math.random() * 98) + 1;
    if (!used.has(v)) { used.add(v); vals.push(v); }
  }
  return vals.sort((a, b) => a - b);
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stepDelay() {
  const s = parseInt(sliderSpeed.value);
  return Math.round(1800 * Math.pow(60 / 1800, (s - 1) / 19));
}

// ── tree ───────────────────────────────────────────────────────────────────
let _uid = 0;
function buildTree(vals, depth = 0) {
  const node = { id: _uid++, values: [...vals], origValues: [...vals], depth, left: null, right: null };
  if (vals.length > 1) {
    const mid  = Math.floor(vals.length / 2);
    node.left  = buildTree(vals.slice(0, mid), depth + 1);
    node.right = buildTree(vals.slice(mid),    depth + 1);
  }
  return node;
}

function collectNodes(node, map = new Map()) {
  if (!node) return map;
  map.set(node.id, node);
  collectNodes(node.left,  map);
  collectNodes(node.right, map);
  return map;
}

function treeDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}

// ── step system ────────────────────────────────────────────────────────────
// Each step:
//   visibleIds  Set<id>         which nodes are drawn
//   nodeStates  Map<id,key>     overall node colour
//   blockColors Map<id, key[]>  per-block colour override for that node
//                               (null = use nodeStates colour for all)
//   nodeValues  Map<id, val[]>  current values shown in each node's blocks
//   label       string

function generateSteps(root) {
  const list   = [];
  const allNodes = collectNodes(root);

  const visible     = new Set();
  const nStates     = new Map();   // id → colorKey
  const bColors     = new Map();   // id → val[] of colorKeys  (or null)
  const nValues     = new Map();   // id → current display values

  // Initialise all nodes with their original values
  allNodes.forEach((nd, id) => nValues.set(id, [...nd.origValues]));

  function snap(label, extraStats = {}) {
    list.push({
      visibleIds:  new Set(visible),
      nodeStates:  new Map(nStates),
      blockColors: new Map(bColors),
      nodeValues:  new Map(Array.from(nValues.entries()).map(([k,v]) => [k,[...v]])),
      label,
      ...extraStats,
    });
  }

  // ── PHASE 1: deconstruction DFS ──────────────────────────────────────────
  function splitDfs(node) {
    if (node.values.length <= 1) {
      nStates.set(node.id, 'active');
      bColors.set(node.id, null);
      snap(`[${node.values[0]}] — single element, base case reached`);

      nStates.set(node.id, 'leaf');
      snap(`[${node.values[0]}] ✓`);
      return;
    }

    const mid   = Math.floor(node.values.length / 2);
    const left  = node.values.slice(0, mid);
    const right = node.values.slice(mid);

    nStates.set(node.id, 'active');
    bColors.set(node.id, null);
    snap(`Splitting [${node.values.join(', ')}] → left: [${left.join(', ')}]  right: [${right.join(', ')}]`);

    nStates.set(node.id, 'split');
    visible.add(node.left.id);
    visible.add(node.right.id);
    nStates.set(node.left.id,  'idle');
    nStates.set(node.right.id, 'idle');
    bColors.set(node.left.id,  null);
    bColors.set(node.right.id, null);
    snap(`[${left.join(', ')}]  |  [${right.join(', ')}]`);

    splitDfs(node.left);
    splitDfs(node.right);

    nStates.set(node.id, 'done');
    bColors.set(node.id, null);
    snap(`[${node.values.join(', ')}] fully split — ready to merge back`);
  }

  // Step 0: root alone, idle
  visible.add(root.id);
  nStates.set(root.id, 'idle');
  bColors.set(root.id, null);
  snap('Array ready — click Solve to begin');

  splitDfs(root);
  snap('Deconstruction complete — beginning merge phase ↑');

  // ── PHASE 2: merge DFS ───────────────────────────────────────────────────
  // Returns sorted array for this node. Generates detailed steps.
  function mergeDfs(node) {
    if (!node.left && !node.right) {
      // leaf — already sorted
      nStates.set(node.id, 'sorted');
      bColors.set(node.id, null);
      return [...node.values];
    }

    // Recurse children first
    const leftSorted  = mergeDfs(node.left);
    const rightSorted = mergeDfs(node.right);

    mergeCount++;

    // Announce this merge
    nStates.set(node.id, 'merging');
    // Show children with 'placed' colouring to indicate they're the source
    bColors.set(node.left.id,  leftSorted.map(() => 'placed'));
    bColors.set(node.right.id, rightSorted.map(() => 'placed'));
    nValues.set(node.left.id,  [...leftSorted]);
    nValues.set(node.right.id, [...rightSorted]);
    // Parent is empty while being built — show no blocks yet via empty array
    nValues.set(node.id, []);
    bColors.set(node.id, []);
    snap(`Merging [${leftSorted.join(', ')}] + [${rightSorted.join(', ')}]`,
         { merges: mergeCount });

    // Step through the merge
    const merged = [];
    let i = 0, j = 0;

    while (i < leftSorted.length && j < rightSorted.length) {
      cmpCount++;
      const lVal = leftSorted[i];
      const rVal = rightSorted[j];

      // Highlight the two pointers
      const lColors = leftSorted.map((_, k) => k === i ? 'cmp_left'  : (k < i ? 'winner' : 'placed'));
      const rColors = rightSorted.map((_, k) => k === j ? 'cmp_right' : (k < j ? 'winner' : 'placed'));
      bColors.set(node.left.id,  lColors);
      bColors.set(node.right.id, rColors);
      nValues.set(node.id, [...merged]);
      bColors.set(node.id, merged.map(() => 'winner'));
      snap(`Comparing ${lVal} (left) vs ${rVal} (right) — which is smaller?`,
           { cmp: cmpCount });

      // Show the winner
      if (lVal <= rVal) {
        merged.push(lVal);
        const lColorsAfter = leftSorted.map((_, k) => k === i ? 'winner' : (k < i ? 'winner' : 'placed'));
        bColors.set(node.left.id, lColorsAfter);
        nValues.set(node.id, [...merged]);
        bColors.set(node.id, merged.map(() => 'winner'));
        snap(`${lVal} ≤ ${rVal} — take ${lVal} from left`, { cmp: cmpCount });
        i++;
      } else {
        merged.push(rVal);
        const rColorsAfter = rightSorted.map((_, k) => k === j ? 'winner' : (k < j ? 'winner' : 'placed'));
        bColors.set(node.right.id, rColorsAfter);
        nValues.set(node.id, [...merged]);
        bColors.set(node.id, merged.map(() => 'winner'));
        snap(`${rVal} < ${lVal} — take ${rVal} from right`, { cmp: cmpCount });
        j++;
      }
    }

    // Drain remaining left
    while (i < leftSorted.length) {
      merged.push(leftSorted[i]);
      const lColors = leftSorted.map((_, k) => k < i ? 'winner' : (k === i ? 'cmp_left' : 'placed'));
      bColors.set(node.left.id, lColors);
      nValues.set(node.id, [...merged]);
      bColors.set(node.id, merged.map(() => 'winner'));
      snap(`Right exhausted — append remaining left: ${leftSorted[i]}`, { cmp: cmpCount });
      i++;
    }

    // Drain remaining right
    while (j < rightSorted.length) {
      merged.push(rightSorted[j]);
      const rColors = rightSorted.map((_, k) => k < j ? 'winner' : (k === j ? 'cmp_right' : 'placed'));
      bColors.set(node.right.id, rColors);
      nValues.set(node.id, [...merged]);
      bColors.set(node.id, merged.map(() => 'winner'));
      snap(`Left exhausted — append remaining right: ${rightSorted[j]}`, { cmp: cmpCount });
      j++;
    }

    // Merged result settled — mark node sorted, fade children
    nValues.set(node.id, [...merged]);
    bColors.set(node.id, merged.map(() => 'sorted'));
    nStates.set(node.id, 'sorted');
    nStates.set(node.left.id,  'done');
    nStates.set(node.right.id, 'done');
    bColors.set(node.left.id,  merged.slice(0, leftSorted.length).map(() => 'done'));
    bColors.set(node.right.id, merged.slice(0, rightSorted.length).map(() => 'done'));
    snap(`Merged → [${merged.join(', ')}] ✓`, { cmp: cmpCount, merges: mergeCount });

    // Update the node's display values for future reference
    node.values = [...merged];

    return merged;
  }

  mergeDfs(root);

  snap('Array fully sorted! ✓', { cmp: cmpCount, merges: mergeCount });

  return list;
}

// ── layout ─────────────────────────────────────────────────────────────────
function layoutTree(root, W, H) {
  const depth   = treeDepth(root);
  const TOP_PAD = 24, BOT_PAD = 16;
  const n       = root.origValues.length;
  const BASE_W  = Math.max(22, Math.min(52, (W * 0.86) / (n * 1.28)));
  const levelH  = (H - TOP_PAD - BOT_PAD) / depth;

  const levels = [];
  let cur = [root];
  while (cur.length) {
    levels.push(cur);
    const nxt = [];
    cur.forEach(nd => {
      if (nd.left)  nxt.push(nd.left);
      if (nd.right) nxt.push(nd.right);
    });
    cur = nxt;
  }

  const positioned = [];

  levels.forEach((levelNodes, li) => {
    const scale = Math.max(0.52, 1 - li * 0.09);
    const bW    = BASE_W * scale;
    const bH    = bW;
    const bGap  = Math.max(3, bW * 0.20);
    const y     = TOP_PAD + li * levelH;

    // Layout based on ORIGINAL values length so positions never shift
    const nodeWidths = levelNodes.map(nd =>
      nd.origValues.length * bW + (nd.origValues.length - 1) * bGap
    );
    const totalNodeW = nodeWidths.reduce((s, w) => s + w, 0);
    const padding    = W * 0.06;
    const free       = W - 2 * padding - totalNodeW;
    const nodeGap    = levelNodes.length > 1 ? free / (levelNodes.length - 1) : 0;

    let cx = padding;
    levelNodes.forEach((nd, ni) => {
      const gW   = nodeWidths[ni];
      nd._cx     = cx + gW / 2;
      nd._y      = y;
      nd._bW     = bW;
      nd._bH     = bH;
      nd._groupX = cx;
      nd._bGap   = bGap;

      cx += gW + Math.max(12, nodeGap);
    });
  });

  return { levels };
}

// ── draw ───────────────────────────────────────────────────────────────────
function blockMetrics(n, W) {
  const rawW   = (W * 0.88) / (n * 1.25);
  const blockW = Math.max(28, Math.min(64, rawW));
  const gap    = blockW * 0.22;
  return { blockW, blockH: blockW, gap,
           startX: (W - (n * blockW + (n - 1) * gap)) / 2 };
}

function drawBlock(x, y, w, h, val, colorKey) {
  const c = COLORS[colorKey] || COLORS.idle;
  const r = Math.max(3, w * 0.14);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.13)';
  ctx.shadowBlur  = 6; ctx.shadowOffsetY = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = c.fill; ctx.fill();
  ctx.restore();

  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = c.stroke; ctx.lineWidth = 1.5; ctx.stroke();

  const fs = Math.max(7, Math.min(13, w * 0.36));
  ctx.fillStyle = c.text;
  ctx.font = `bold ${fs}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(val, x + w / 2, y + h / 2);
}

function drawConnectors(levels, visibleIds, nodeStates) {
  ctx.save();
  ctx.setLineDash([4, 4]);
  for (let li = 0; li < levels.length - 1; li++) {
    levels[li].forEach(parent => {
      [parent.left, parent.right].forEach(child => {
        if (!child) return;
        if (!visibleIds.has(parent.id) || !visibleIds.has(child.id)) return;

        const ps    = nodeStates.get(parent.id);
        const alpha = (ps === 'done') ? 0.10 : 0.28;
        ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
        ctx.lineWidth   = 1.5;

        const x1 = parent._cx, y1 = parent._y + parent._bH + 4;
        const x2 = child._cx,  y2 = child._y  - 4;
        const m  = (y2 - y1) * 0.42;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, y1 + m, x2, y2 - m, x2, y2);
        ctx.stroke();
      });
    });
  }
  ctx.restore();
}

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const n = array.length;
  if (n === 0) return;

  // Idle — no tree yet
  if (!treeRoot) {
    const { blockW, blockH, gap, startX } = blockMetrics(n, W);
    array.forEach((val, i) =>
      drawBlock(startX + i * (blockW + gap), 28, blockW, blockH, val, 'split')
    );
    return;
  }

  const { levels } = layoutTree(treeRoot, W, H);
  const step       = steps[stepIndex] || steps[0];
  if (!step) return;

  const { visibleIds, nodeStates, blockColors, nodeValues } = step;

  drawConnectors(levels, visibleIds, nodeStates);

  // Draw each visible node's blocks
  levels.forEach(levelNodes => {
    levelNodes.forEach(nd => {
      if (!visibleIds.has(nd.id)) return;

      const vals    = nodeValues.get(nd.id) || nd.origValues;
      const bcArr   = blockColors.get(nd.id);  // null or array of colorKeys
      const defKey  = nodeStates.get(nd.id) || 'idle';

      vals.forEach((val, vi) => {
        const colorKey = (bcArr && bcArr[vi] != null) ? bcArr[vi] : defKey;
        const x = nd._groupX + vi * (nd._bW + nd._bGap);
        drawBlock(x, nd._y, nd._bW, nd._bH, val, colorKey);
      });
    });
  });
}

// ── animation ──────────────────────────────────────────────────────────────
function applyStep(idx) {
  stepIndex = Math.max(0, Math.min(idx, steps.length - 1));
  const step = steps[stepIndex];

  statStatus.textContent = step.label;
  statDepth.textContent  = treeDepth(treeRoot) - 1;
  if (step.cmp     !== undefined) statCmp.textContent    = step.cmp;
  if (step.merges  !== undefined) statMerges.textContent = step.merges;

  btnPrev.disabled = stepIndex <= 0;
  btnNext.disabled = stepIndex >= steps.length - 1;
  draw();
}

function autoPlay() {
  if (stepIndex >= steps.length - 1) { setMode('done'); return; }
  applyStep(stepIndex + 1);
  animTimer = setTimeout(autoPlay, stepDelay());
}

function stopAnim() {
  if (animTimer) { clearTimeout(animTimer); animTimer = null; }
}

// ── UI mode ────────────────────────────────────────────────────────────────
function setMode(mode) {
  uiMode = mode;
  btnSolve.textContent = (mode === 'playing') ? '⏸ Pause' : '▶ Solve';
  btnShuffle.disabled  = (mode === 'playing');
  sliderN.disabled     = (mode === 'playing');

  const showStep = ['stepwise','paused','done'].includes(mode);
  btnPrev.style.display = showStep ? 'block' : 'none';
  btnNext.style.display = showStep ? 'block' : 'none';
  if (showStep) {
    btnPrev.disabled = stepIndex <= 0;
    btnNext.disabled = stepIndex >= steps.length - 1;
  }
  if (mode === 'done') statStatus.textContent = 'Fully sorted ✓';
}

// ── reset ──────────────────────────────────────────────────────────────────
function resetState() {
  stopAnim();
  treeRoot   = null;
  steps      = [];
  stepIndex  = -1;
  _uid       = 0;
  cmpCount   = 0;
  mergeCount = 0;
  statCmp.textContent    = '0';
  statMerges.textContent = '0';
  statDepth.textContent  = '0';
  statStatus.textContent = 'Ready';
  setMode('idle');
}

function resizeCanvas() {
  const vis = document.getElementById('visualizer');
  canvas.width  = vis.clientWidth;
  canvas.height = vis.clientHeight;
  draw();
}

// ── events ─────────────────────────────────────────────────────────────────
sliderN.addEventListener('input', () => {
  resetState();
  const n = parseInt(sliderN.value);
  valN.textContent = n;
  array = freshArray(n);
  draw();
});

sliderSpeed.addEventListener('input', () => {
  valSpeed.textContent = sliderSpeed.value + '×';
});

btnShuffle.addEventListener('click', () => {
  resetState();
  array = shuffleArr(array);
  draw();
});

btnReset.addEventListener('click', () => {
  resetState();
  array = freshArray(parseInt(sliderN.value));
  valN.textContent = sliderN.value;
  draw();
});

btnSolve.addEventListener('click', () => {
  if (uiMode === 'playing') {
    stopAnim();
    setMode(chkStep.checked ? 'stepwise' : 'paused');
    statStatus.textContent = 'Paused';
    return;
  }

  if (!treeRoot) {
    _uid       = 0;
    cmpCount   = 0;
    mergeCount = 0;
    treeRoot   = buildTree([...array]);
    steps      = generateSteps(treeRoot);
    stepIndex  = 0;
    statDepth.textContent = treeDepth(treeRoot) - 1;
  }

  if (chkStep.checked) {
    if (stepIndex < steps.length - 1) applyStep(stepIndex + 1);
    setMode('stepwise');
  } else {
    setMode('playing');
    autoPlay();
  }
});

btnPrev.addEventListener('click', () => {
  if (stepIndex > 0) applyStep(stepIndex - 1);
  setMode(chkStep.checked ? 'stepwise' : 'paused');
});

btnNext.addEventListener('click', () => {
  if (stepIndex < steps.length - 1) {
    applyStep(stepIndex + 1);
    setMode(chkStep.checked ? 'stepwise' : 'paused');
  } else {
    setMode('done');
  }
});

chkStep.addEventListener('change', () => {
  if (chkStep.checked && uiMode === 'playing') {
    stopAnim();
    setMode('stepwise');
  }
});

window.addEventListener('resize', resizeCanvas);

// ── boot ───────────────────────────────────────────────────────────────────
sliderN.value        = 8;
sliderSpeed.value    = 10;
valSpeed.textContent = '10×';
valN.textContent     = '8';
array = freshArray(8);
resizeCanvas();