/* ── merge-sort.js ── */

const canvas     = document.getElementById('canvas');
const ctx        = canvas.getContext('2d');
const sliderN    = document.getElementById('slider-n');
const valN       = document.getElementById('val-n');
const btnShuffle = document.getElementById('btn-shuffle');
const btnSolve   = document.getElementById('btn-solve');

// ── state ──────────────────────────────────────────────────────────────────
let array    = [];
let treeRoot = null;   // null = idle (just top row shown)

// ── helpers ────────────────────────────────────────────────────────────────

function freshArray(n) {
  const vals = [], used = new Set();
  while (vals.length < n) {
    const v = Math.floor(Math.random() * 98) + 1;
    if (!used.has(v)) { used.add(v); vals.push(v); }
  }
  return vals.sort((a, b) => a - b);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── tree builder ───────────────────────────────────────────────────────────
// Each node stores its sub-array and left/right children after splitting

function buildTree(vals) {
  const node = { values: vals, left: null, right: null };
  if (vals.length <= 1) return node;
  const mid  = Math.floor(vals.length / 2);
  node.left  = buildTree(vals.slice(0, mid));
  node.right = buildTree(vals.slice(mid));
  return node;
}

function treeDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}

// ── layout engine ──────────────────────────────────────────────────────────
// BFS level-by-level layout.
// Each level's nodes are spread evenly across the canvas.
// Block size shrinks slightly at deeper levels to keep everything visible.

function layoutTree(root, canvasW, canvasH) {
  const depth      = treeDepth(root);
  const TOP_PAD    = 24;
  const BOTTOM_PAD = 20;
  const n          = root.values.length;

  // Base block size from root's array length and canvas width
  const BASE_W = Math.max(22, Math.min(52, (canvasW * 0.86) / (n * 1.28)));

  // Vertical space per level
  const usableH = canvasH - TOP_PAD - BOTTOM_PAD;
  const levelH  = usableH / depth;

  // BFS to gather levels
  const levels = [];
  let current  = [root];
  while (current.length) {
    levels.push(current);
    const next = [];
    current.forEach(nd => {
      if (nd.left)  next.push(nd.left);
      if (nd.right) next.push(nd.right);
    });
    current = next;
  }

  const positioned = [];

  levels.forEach((levelNodes, li) => {
    // Shrink block size a little at each deeper level
    const scale = Math.max(0.52, 1 - li * 0.09);
    const bW    = BASE_W * scale;
    const bH    = bW;
    const bGap  = Math.max(3, bW * 0.20);   // gap between blocks within a node
    const y     = TOP_PAD + li * levelH;

    // Pixel width of each node's block row
    const nodeWidths = levelNodes.map(nd =>
      nd.values.length * bW + (nd.values.length - 1) * bGap
    );
    const totalNodeW = nodeWidths.reduce((s, w) => s + w, 0);

    // Gap between sibling node-groups at this level
    const padding    = canvasW * 0.07;
    const freeSpace  = canvasW - 2 * padding - totalNodeW;
    const nodeGap    = levelNodes.length > 1 ? freeSpace / (levelNodes.length - 1) : 0;

    let cursorX = padding;

    levelNodes.forEach((nd, ni) => {
      const groupW = nodeWidths[ni];

      // Store layout metadata on the node for connector drawing
      nd._cx     = cursorX + groupW / 2;
      nd._cy     = y + bH / 2;
      nd._y      = y;
      nd._bW     = bW;
      nd._bH     = bH;
      nd._groupX = cursorX;

      nd.values.forEach((val, vi) => {
        positioned.push({
          node: nd,
          val,
          x: cursorX + vi * (bW + bGap),
          y,
          blockW: bW,
          blockH: bH,
        });
      });

      cursorX += groupW + Math.max(12, nodeGap);
    });
  });

  return { positioned, levels };
}

// ── drawing ────────────────────────────────────────────────────────────────

function blockMetrics(n, canvasW) {
  const usable    = canvasW * 0.88;
  const GAP_RATIO = 0.25;
  const rawW      = usable / (n * (1 + GAP_RATIO));
  const blockW    = Math.max(28, Math.min(64, rawW));
  const gap       = blockW * GAP_RATIO;
  const totalW    = n * blockW + (n - 1) * gap;
  const startX    = (canvasW - totalW) / 2;
  return { blockW, blockH: blockW, gap, startX };
}

const COLORS = {
  default:   { fill: '#8b5cf6', stroke: '#6d28d9', text: '#fff' },
  splitting: { fill: '#f59e0b', stroke: '#d97706', text: '#fff' },
  leaf:      { fill: '#a78bfa', stroke: '#7c3aed', text: '#fff' },
  sorted:    { fill: '#22c55e', stroke: '#16a34a', text: '#fff' },
  comparing: { fill: '#60a5fa', stroke: '#3b82f6', text: '#fff' },
  merging:   { fill: '#f97316', stroke: '#ea580c', text: '#fff' },
};

function drawBlock(x, y, w, h, val, state) {
  const c      = COLORS[state] || COLORS.default;
  const radius = Math.max(3, w * 0.14);

  // shadow
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.14)';
  ctx.shadowBlur    = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.restore();

  // border
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // label
  const fontSize = Math.max(7, Math.min(13, w * 0.36));
  ctx.fillStyle    = c.text;
  ctx.font         = `bold ${fontSize}px 'Segoe UI', sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(val, x + w / 2, y + h / 2);
}

function drawConnectors(levels) {
  ctx.save();
  ctx.strokeStyle = 'rgba(139,92,246,0.3)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 4]);

  for (let li = 0; li < levels.length - 1; li++) {
    levels[li].forEach(parent => {
      [parent.left, parent.right].forEach(child => {
        if (!child) return;
        const x1 = parent._cx;
        const y1 = parent._y + parent._bH + 4;
        const x2 = child._cx;
        const y2 = child._y - 4;
        const cy1 = y1 + (y2 - y1) * 0.45;
        const cy2 = y2 - (y2 - y1) * 0.45;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, cy1, x2, cy2, x2, y2);
        ctx.stroke();
      });
    });
  }
  ctx.restore();
}

function draw() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const n = array.length;
  if (n === 0) return;

  if (!treeRoot) {
    // idle — just the top row
    const { blockW, blockH, gap, startX } = blockMetrics(n, W);
    array.forEach((val, i) => {
      drawBlock(startX + i * (blockW + gap), 28, blockW, blockH, val, 'default');
    });
    return;
  }

  // tree view
  const { positioned, levels } = layoutTree(treeRoot, W, H);
  drawConnectors(levels);
  positioned.forEach(({ val, x, y, blockW, blockH, node }) => {
    const isLeaf = !node.left && !node.right;
    drawBlock(x, y, blockW, blockH, val, isLeaf ? 'leaf' : 'splitting');
  });
}

// ── canvas resize ──────────────────────────────────────────────────────────
function resizeCanvas() {
  const vis     = document.getElementById('visualizer');
  canvas.width  = vis.clientWidth;
  canvas.height = vis.clientHeight;
  draw();
}

// ── init & events ──────────────────────────────────────────────────────────
function init() {
  treeRoot = null;
  const n  = parseInt(sliderN.value);
  array    = freshArray(n);
  valN.textContent = n;
  resizeCanvas();
}

sliderN.addEventListener('input', () => {
  treeRoot = null;
  const n  = parseInt(sliderN.value);
  valN.textContent = n;
  array = freshArray(n);
  draw();
});

btnShuffle.addEventListener('click', () => {
  treeRoot = null;
  array    = shuffle(array);
  draw();
});

btnSolve.addEventListener('click', () => {
  treeRoot = buildTree([...array]);
  draw();
});

window.addEventListener('resize', resizeCanvas);

sliderN.value = 8;
init();