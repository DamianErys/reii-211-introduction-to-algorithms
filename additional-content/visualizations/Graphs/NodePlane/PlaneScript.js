/* ═══════════════════════════════════════════════════════════════════════════
   PlaneScript.js  –  Shared Node-Plane engine
   Used by: BFS, DFS, Dijkstra, Kruskal, Prim
   ═══════════════════════════════════════════════════════════════════════════

   COORDINATE SYSTEM
   ─────────────────
   World space : X ∈ [0, 500],  Y ∈ [0, 250]
   Canvas pixel : derived by toCanvas()  (world → pixel, Y flipped)

   GRAPH DATA
   ──────────
   nodes : Array<{ id, name, x, y }>
   edges : Array<{ id, from, to, weight }>   (undirected – stored once)

   adjacencyMatrix() → 2-D array  (nodes × nodes)
   adjacencyList()   → Map<nodeId, [{nodeId, weight}]>
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Canvas setup ──────────────────────────────────────────────────────── */
  const canvas = document.getElementById('plane');
  const ctx    = canvas.getContext('2d');

  /* World bounds */
  const WORLD_W = 500;
  const WORLD_H = 250;

  /* Visual constants */
  const NODE_R        = 18;   // node circle radius (px)
  const GRID_COLOR    = '#e2e8f0';
  const AXIS_COLOR    = '#94a3b8';
  const EDGE_COLOR    = '#64748b';
  const NODE_FILL     = '#6366f1';
  const NODE_STROKE   = '#4338ca';
  const NODE_TEXT     = '#ffffff';
  const WEIGHT_COLOR  = '#0f172a';
  const WEIGHT_BG     = '#f8fafc';

  /* ── State ─────────────────────────────────────────────────────────────── */
  let nodes = [];   // { id, name, x, y }
  let edges = [];   // { id, from, to, weight }
  let _nid  = 0;
  let _eid  = 0;

  /* ── Sizing ─────────────────────────────────────────────────────────────── */
  /* The canvas fills the #plane-wrapper minus the info text.
     We keep an aspect ratio of WORLD_W : WORLD_H = 2 : 1             */
  function sizeCanvas() {
    const wrapper = document.getElementById('plane-wrapper');
    const maxW    = wrapper.clientWidth - 24;   // 12px padding each side
    const maxH    = window.innerHeight * 0.62;

    /* Pick the largest size that fits both dimensions at 2:1 ratio */
    let w = maxW;
    let h = w / 2;
    if (h > maxH) { h = maxH; w = h * 2; }

    canvas.width  = Math.floor(w);
    canvas.height = Math.floor(h);
    redraw();
  }

  /* ── Coordinate transforms ──────────────────────────────────────────────── */
  function toCanvas(wx, wy) {
    return {
      x: (wx / WORLD_W) * canvas.width,
      y: canvas.height - (wy / WORLD_H) * canvas.height
    };
  }

  /* ── Grid drawing ───────────────────────────────────────────────────────── */
  const GRID_STEP_X = 50;   // world units between vertical lines
  const GRID_STEP_Y = 25;   // world units between horizontal lines

  function drawGrid() {
    ctx.save();

    /* Minor grid */
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth   = 0.5;

    for (let wx = 0; wx <= WORLD_W; wx += GRID_STEP_X) {
      const cx = toCanvas(wx, 0).x;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.stroke();
    }

    for (let wy = 0; wy <= WORLD_H; wy += GRID_STEP_Y) {
      const cy = toCanvas(0, wy).y;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();
    }

    /* Axis labels */
    ctx.fillStyle  = AXIS_COLOR;
    ctx.font       = `10px 'Segoe UI', sans-serif`;
    ctx.textAlign  = 'center';

    for (let wx = 0; wx <= WORLD_W; wx += GRID_STEP_X) {
      const cx = toCanvas(wx, 0).x;
      ctx.fillText(wx, cx, canvas.height - 3);
    }

    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    for (let wy = 0; wy <= WORLD_H; wy += GRID_STEP_Y) {
      const cy = toCanvas(0, wy).y;
      ctx.fillText(wy, 24, cy);
    }

    ctx.restore();
  }

  /* ── Edge drawing ───────────────────────────────────────────────────────── */
  function drawEdges() {
    ctx.save();
    ctx.strokeStyle = EDGE_COLOR;
    ctx.lineWidth   = 2;

    for (const e of edges) {
      const nA = nodeById(e.from);
      const nB = nodeById(e.to);
      if (!nA || !nB) continue;

      const cA = toCanvas(nA.x, nA.y);
      const cB = toCanvas(nB.x, nB.y);

      ctx.beginPath();
      ctx.moveTo(cA.x, cA.y);
      ctx.lineTo(cB.x, cB.y);
      ctx.stroke();

      /* Weight label at midpoint */
      const mx = (cA.x + cB.x) / 2;
      const my = (cA.y + cB.y) / 2;

      const label = String(e.weight);
      ctx.font     = `bold 11px 'Segoe UI', sans-serif`;
      const tw     = ctx.measureText(label).width;
      const pad    = 3;

      ctx.fillStyle = WEIGHT_BG;
      ctx.beginPath();
      ctx.roundRect(mx - tw / 2 - pad, my - 8, tw + pad * 2, 16, 3);
      ctx.fill();

      ctx.fillStyle    = WEIGHT_COLOR;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my);
    }

    ctx.restore();
  }

  /* ── Node drawing ───────────────────────────────────────────────────────── */
  function drawNodes() {
    for (const n of nodes) {
      const c = toCanvas(n.x, n.y);
      drawNode(c.x, c.y, n.name, NODE_FILL, NODE_STROKE, NODE_TEXT);
    }
  }

  function drawNode(cx, cy, label, fill, stroke, text) {
    ctx.save();

    /* Shadow */
    ctx.shadowColor   = 'rgba(99,102,241,0.25)';
    ctx.shadowBlur    = 8;
    ctx.shadowOffsetY = 2;

    /* Circle */
    ctx.beginPath();
    ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
    ctx.fillStyle   = fill;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = 2;
    ctx.stroke();

    /* Label */
    const fs = label.length > 2 ? 9 : 11;
    ctx.font         = `bold ${fs}px 'Segoe UI', sans-serif`;
    ctx.fillStyle    = text;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  }

  /* ── Main redraw ────────────────────────────────────────────────────────── */
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawEdges();
    drawNodes();
  }

  /* ── Graph helpers ──────────────────────────────────────────────────────── */
  function nodeById(id)   { return nodes.find(n => n.id   === id);   }
  function nodeByName(nm) { return nodes.find(n => n.name === nm);   }

  function edgeExists(fromId, toId) {
    return edges.some(e =>
      (e.from === fromId && e.to === toId) ||
      (e.from === toId   && e.to === fromId)
    );
  }

  /* Public graph data accessors ─────────────────────────────────────────── */
  function adjacencyMatrix() {
    const n   = nodes.length;
    const mat = Array.from({ length: n }, () => new Array(n).fill(0));
    for (const e of edges) {
      const i = nodes.findIndex(nd => nd.id === e.from);
      const j = nodes.findIndex(nd => nd.id === e.to);
      if (i < 0 || j < 0) continue;
      mat[i][j] = e.weight;
      mat[j][i] = e.weight;
    }
    return mat;
  }

  function adjacencyList() {
    const map = new Map();
    for (const n of nodes) map.set(n.id, []);
    for (const e of edges) {
      map.get(e.from).push({ nodeId: e.to,   weight: e.weight });
      map.get(e.to  ).push({ nodeId: e.from, weight: e.weight });
    }
    return map;
  }

  /* ── UI helpers ─────────────────────────────────────────────────────────── */
  function refreshNodeDropdowns() {
    const fromSel = document.getElementById('edge-from');
    const toSel   = document.getElementById('edge-to');
    const prevFrom = fromSel.value;
    const prevTo   = toSel.value;

    [fromSel, toSel].forEach(sel => {
      sel.innerHTML = '<option value="">–</option>';
      for (const n of nodes) {
        const opt  = document.createElement('option');
        opt.value  = n.id;
        opt.textContent = n.name;
        sel.appendChild(opt);
      }
    });

    if (prevFrom) fromSel.value = prevFrom;
    if (prevTo)   toSel.value   = prevTo;
  }

  function refreshNodeList() {
    const ul = document.getElementById('node-list');
    ul.innerHTML = '';
    for (const n of nodes) {
      const li  = document.createElement('li');
      li.innerHTML = `
        <span>${n.name} <span style="color:#94a3b8">(${n.x}, ${n.y})</span></span>
        <button class="del-btn" data-id="${n.id}" title="Remove node">×</button>
      `;
      li.querySelector('.del-btn').addEventListener('click', () => removeNode(n.id));
      ul.appendChild(li);
    }
  }

  function refreshEdgeList() {
    const ul = document.getElementById('edge-list');
    ul.innerHTML = '';
    for (const e of edges) {
      const nA = nodeById(e.from);
      const nB = nodeById(e.to);
      if (!nA || !nB) continue;
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${nA.name} — ${nB.name} <span style="color:#94a3b8">[${e.weight}]</span></span>
        <button class="del-btn" data-id="${e.id}" title="Remove edge">×</button>
      `;
      li.querySelector('.del-btn').addEventListener('click', () => removeEdge(e.id));
      ul.appendChild(li);
    }
  }

  function refreshMatrix() {
    const container = document.getElementById('matrix-container');
    if (nodes.length === 0) {
      container.innerHTML = '<span style="color:#cbd5e1;font-size:11px;">No nodes yet</span>';
      return;
    }

    const mat = adjacencyMatrix();
    let html  = '<table id="matrix-table"><thead><tr><th></th>';
    for (const n of nodes) html += `<th>${n.name}</th>`;
    html += '</tr></thead><tbody>';
    for (let i = 0; i < nodes.length; i++) {
      html += `<tr><th>${nodes[i].name}</th>`;
      for (let j = 0; j < nodes.length; j++) {
        const v = mat[i][j];
        html += `<td class="${v === 0 ? 'zero' : ''}">${v}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function refreshInfo() {
    document.getElementById('info-nodes').textContent = `Nodes: ${nodes.length}`;
    document.getElementById('info-edges').textContent = `Edges: ${edges.length}`;
  }

  function refreshAll() {
    refreshNodeDropdowns();
    refreshNodeList();
    refreshEdgeList();
    refreshMatrix();
    refreshInfo();
    redraw();
  }

  /* ── Add / remove nodes ─────────────────────────────────────────────────── */
  function addNode(name, x, y) {
    const hint = document.getElementById('node-hint');

    name = name.trim();
    if (!name) { hint.textContent = 'Name is required.'; return false; }
    if (nodeByName(name)) { hint.textContent = `"${name}" already exists.`; return false; }
    if (x < 0 || x > WORLD_W) { hint.textContent = `X must be 0–${WORLD_W}.`; return false; }
    if (y < 0 || y > WORLD_H) { hint.textContent = `Y must be 0–${WORLD_H}.`; return false; }

    hint.textContent = '';
    nodes.push({ id: ++_nid, name, x, y });
    refreshAll();
    return true;
  }

  function removeNode(id) {
    nodes  = nodes.filter(n => n.id !== id);
    edges  = edges.filter(e => e.from !== id && e.to !== id);
    refreshAll();
  }

  /* ── Add / remove edges ─────────────────────────────────────────────────── */
  function addEdge(fromId, toId, weight) {
    const hint = document.getElementById('edge-hint');
    fromId = parseInt(fromId);
    toId   = parseInt(toId);
    weight = parseFloat(weight);

    if (!fromId || !toId) { hint.textContent = 'Select both nodes.'; return false; }
    if (fromId === toId)  { hint.textContent = 'Self-loops not allowed.'; return false; }
    if (isNaN(weight))    { hint.textContent = 'Invalid weight.'; return false; }
    if (edgeExists(fromId, toId)) { hint.textContent = 'Edge already exists.'; return false; }

    hint.textContent = '';
    edges.push({ id: ++_eid, from: fromId, to: toId, weight });
    refreshAll();
    return true;
  }

  function removeEdge(id) {
    edges = edges.filter(e => e.id !== id);
    refreshAll();
  }

  /* ── Button wiring ──────────────────────────────────────────────────────── */
  document.getElementById('add-node-btn').addEventListener('click', () => {
    const name = document.getElementById('node-name').value;
    const x    = parseInt(document.getElementById('node-x').value, 10);
    const y    = parseInt(document.getElementById('node-y').value, 10);
    if (addNode(name, x, y)) {
      document.getElementById('node-name').value = '';
      document.getElementById('node-x').value   = '';
      document.getElementById('node-y').value   = '';
    }
  });

  document.getElementById('add-edge-btn').addEventListener('click', () => {
    const from   = document.getElementById('edge-from').value;
    const to     = document.getElementById('edge-to').value;
    const weight = document.getElementById('edge-weight').value;
    if (addEdge(from, to, weight)) {
      document.getElementById('edge-from').value   = '';
      document.getElementById('edge-to').value     = '';
      document.getElementById('edge-weight').value = '1';
    }
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    nodes  = [];
    edges  = [];
    _nid   = 0;
    _eid   = 0;
    document.getElementById('node-hint').textContent = '';
    document.getElementById('edge-hint').textContent = '';
    refreshAll();
  });

  /* Enter key support for add-node form */
  ['node-name','node-x','node-y'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('add-node-btn').click();
    });
  });

  ['edge-weight'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('add-edge-btn').click();
    });
  });

  /* ── Resize handling ────────────────────────────────────────────────────── */
  window.addEventListener('resize', sizeCanvas);

  /* ── Public API (for algorithm scripts) ─────────────────────────────────── */
  window.PlaneGraph = {
    getNodes:         () => [...nodes],
    getEdges:         () => [...edges],
    adjacencyMatrix,
    adjacencyList,
    nodeById,
    nodeByName,
    redraw,
    drawNode,        // drawNode(cx, cy, label, fill, stroke, text)
    toCanvas,
    ctx: () => ctx,
    canvas: () => canvas,
    NODE_R,
  };

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  sizeCanvas();

})();