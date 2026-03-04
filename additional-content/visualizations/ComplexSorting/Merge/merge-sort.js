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

// ── colours ────────────────────────────────────────────────────────────────
const COLORS = {
  active:  { fill: '#f59e0b', stroke: '#b45309', text: '#fff' },  // amber  — about to split
  split:   { fill: '#8b5cf6', stroke: '#6d28d9', text: '#fff' },  // purple — has been split
  leaf:    { fill: '#38bdf8', stroke: '#0284c7', text: '#fff' },  // blue   — single element
  idle:    { fill: '#ddd6fe', stroke: '#a78bfa', text: '#5b21b6' },// pale  — waiting
  done:    { fill: '#94a3b8', stroke: '#64748b', text: '#fff' },  // grey   — faded internal
};

// ── state ──────────────────────────────────────────────────────────────────
let array     = [];
let treeRoot  = null;
let steps     = [];      // each step = { visibleIds: Set, nodeStates: Map, label }
let stepIndex = -1;
let animTimer = null;
let uiMode    = 'idle';

// ── array helpers ──────────────────────────────────────────────────────────
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
  const s = parseInt(sliderSpeed.value); // 1–20
  return Math.round(1800 * Math.pow(60 / 1800, (s - 1) / 19));
}

// ── tree ───────────────────────────────────────────────────────────────────
let _uid = 0;
function buildTree(vals, depth = 0) {
  const node = { id: _uid++, values: vals, depth, left: null, right: null };
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

// ── step generator ─────────────────────────────────────────────────────────
// Each step carries:
//   visibleIds  — Set of node ids that should be drawn
//   nodeStates  — Map<id, colorKey> for every visible node
//   label       — status bar string

function generateSteps(root) {
  const list = [];

  // Deep-clone helpers
  function snapStates(statesMap) { return new Map(statesMap); }

  // Working copies
  const visible = new Set();   // ids rendered so far
  const states  = new Map();   // id → colorKey

  function snap(label) {
    list.push({
      visibleIds: new Set(visible),
      nodeStates: snapStates(states),
      label,
    });
  }

  // Step 0: just the root, coloured as idle before we start
  visible.add(root.id);
  states.set(root.id, 'idle');
  snap('Array ready — press Solve to begin splitting');

  function dfs(node) {
    if (node.values.length <= 1) {
      // Highlight as active (arriving at leaf)
      states.set(node.id, 'active');
      snap(`[${node.values[0]}] — single element, no split needed`);

      // Settle as leaf
      states.set(node.id, 'leaf');
      snap(`[${node.values[0]}] is a base case ✓`);
      return;
    }

    const mid   = Math.floor(node.values.length / 2);
    const left  = node.values.slice(0, mid);
    const right = node.values.slice(mid);

    // 1. Highlight this node — we're about to split it
    states.set(node.id, 'active');
    snap(`Splitting [${node.values.join(', ')}] into two halves`);

    // 2. Mark as split and reveal both children as idle
    states.set(node.id, 'split');
    visible.add(node.left.id);
    visible.add(node.right.id);
    states.set(node.left.id,  'idle');
    states.set(node.right.id, 'idle');
    snap(`[${left.join(', ')}]  |  [${right.join(', ')}]`);

    // 3. Recurse left
    dfs(node.left);

    // 4. Recurse right
    dfs(node.right);

    // 5. Once both children are done, fade this internal node to 'done'
    states.set(node.id, 'done');
    snap(`Both halves of [${node.values.join(', ')}] fully split`);
  }

  dfs(root);

  // Final step: everything settled
  snap('Array fully deconstructed — ready to merge ↑');

  return list;
}

// ── layout ─────────────────────────────────────────────────────────────────
// The layout always positions ALL nodes (even invisible ones) so positions
// are stable. We just skip drawing nodes not in visibleIds.

function layoutTree(root, W, H) {
  const depth   = treeDepth(root);
  const TOP_PAD = 24, BOT_PAD = 16;
  const n       = root.values.length;
  const BASE_W  = Math.max(22, Math.min(52, (W * 0.86) / (n * 1.28)));
  const levelH  = (H - TOP_PAD - BOT_PAD) / depth;

  // BFS levels
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

    const nodeWidths = levelNodes.map(nd =>
      nd.values.length * bW + (nd.values.length - 1) * bGap
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

      nd.values.forEach((val, vi) => {
        positioned.push({
          nodeId: nd.id, val,
          x: cx + vi * (bW + bGap),
          y, blockW: bW, blockH: bH,
        });
      });

      cx += gW + Math.max(12, nodeGap);
    });
  });

  return { positioned, levels };
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
        // Only draw if both parent and child are visible
        if (!visibleIds.has(parent.id) || !visibleIds.has(child.id)) return;

        const ps    = nodeStates.get(parent.id);
        const alpha = (ps === 'done') ? 0.12 : 0.30;
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

  // Idle — just top row, no tree built yet
  if (!treeRoot) {
    const { blockW, blockH, gap, startX } = blockMetrics(n, W);
    array.forEach((val, i) =>
      drawBlock(startX + i * (blockW + gap), 28, blockW, blockH, val, 'split')
    );
    return;
  }

  const { positioned, levels } = layoutTree(treeRoot, W, H);

  const step       = steps[stepIndex] || steps[0];
  const visibleIds = step ? step.visibleIds : new Set([treeRoot.id]);
  const nodeStates = step ? step.nodeStates : new Map([[treeRoot.id, 'idle']]);

  drawConnectors(levels, visibleIds, nodeStates);

  positioned.forEach(({ nodeId, val, x, y, blockW, blockH }) => {
    if (!visibleIds.has(nodeId)) return;
    drawBlock(x, y, blockW, blockH, val, nodeStates.get(nodeId) || 'idle');
  });
}

// ── animation ──────────────────────────────────────────────────────────────
function applyStep(idx) {
  stepIndex = Math.max(0, Math.min(idx, steps.length - 1));
  const step = steps[stepIndex];

  statStatus.textContent = step.label;
  statDepth.textContent  = treeDepth(treeRoot) - 1;
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
  if (mode === 'done') statStatus.textContent = 'Deconstructed ✓ — ready to merge';
}

// ── reset ──────────────────────────────────────────────────────────────────
function resetState() {
  stopAnim();
  treeRoot  = null;
  steps     = [];
  stepIndex = -1;
  _uid      = 0;
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

  // Build tree on first solve press
  if (!treeRoot) {
    _uid     = 0;
    treeRoot = buildTree([...array]);
    steps    = generateSteps(treeRoot);
    stepIndex = 0;   // start at step 0 (root visible, idle)
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