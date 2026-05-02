/* ═══════════════════════════════════════════════════════════════════════════
   PlaneScript.js  –  Shared Node-Plane engine
   Used by: BFS, DFS, Dijkstra, Kruskal, Prim

   COORDINATE SYSTEM
     World space : X ∈ [0, 100],  Y ∈ [0, 50]
     Canvas pixel : toCanvas() maps world → pixel (Y axis flipped)

   GRAPH DATA
     nodes : Array<{ id, name, x, y }>
     edges : Array<{ id, from, to, weight }>   (undirected – stored once)

   PUBLIC API  →  window.PlaneGraph
     getNodes / getEdges / adjacencyMatrix / adjacencyList
     nodeById / nodeByName / toCanvas / redraw / drawNode / ctx / canvas / NODE_R
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Canvas ──────────────────────────────────────────────────────────────── */
  const canvas = document.getElementById('plane');
  const ctx    = canvas.getContext('2d');

  /* World bounds */
  const WORLD_W = 100;
  const WORLD_H = 50;

  /* Canvas padding keeps axis labels inside the border */
  const PAD_L = 28;
  const PAD_B = 18;
  const PAD_R = 10;
  const PAD_T = 10;

  /* Grid lines */
  const GRID_STEP_X = 10;
  const GRID_STEP_Y = 5;

  /* Visuals */
  const NODE_R       = 18;
  const GRID_COLOR   = '#e2e8f0';
  const AXIS_COLOR   = '#94a3b8';
  const EDGE_COLOR   = '#64748b';
  const NODE_FILL    = '#6366f1';
  const NODE_STROKE  = '#4338ca';
  const NODE_TEXT    = '#ffffff';
  const WEIGHT_COLOR = '#0f172a';
  const WEIGHT_BG    = '#f8fafc';

  /* ── State ───────────────────────────────────────────────────────────────── */
  let nodes = [];   // { id, name, x, y }
  let edges = [];   // { id, from, to, weight }
  let _nid  = 0;
  let _eid  = 0;

  /* View mode: 'plot' | 'matrix' */
  let viewMode = 'plot';

  /* ── Coordinate transforms ───────────────────────────────────────────────── */
  function toCanvas(wx, wy) {
    const dW = canvas.width  - PAD_L - PAD_R;
    const dH = canvas.height - PAD_T - PAD_B;
    return {
      x: PAD_L + (wx / WORLD_W) * dW,
      y: PAD_T + dH - (wy / WORLD_H) * dH
    };
  }

  /* ── Canvas sizing ───────────────────────────────────────────────────────── */
  function sizeCanvas() {
    const area = document.getElementById('view-area');
    const maxW = area.clientWidth - 24;
    const maxH = window.innerHeight * 0.74;
    let w = maxW, h = w / 2;
    if (h > maxH) { h = maxH; w = h * 2; }
    canvas.width  = Math.floor(w);
    canvas.height = Math.floor(h);
    redraw();

    /* Also resize matrix view to same height */
    const mv = document.getElementById('matrix-view');
    mv.style.minHeight = canvas.height + 'px';
  }

  /* ── Grid ────────────────────────────────────────────────────────────────── */
  function drawGrid() {
    const dW = canvas.width  - PAD_L - PAD_R;
    const dH = canvas.height - PAD_T - PAD_B;

    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth   = 0.5;

    for (let wx = 0; wx <= WORLD_W; wx += GRID_STEP_X) {
      const cx = toCanvas(wx, 0).x;
      ctx.beginPath(); ctx.moveTo(cx, PAD_T); ctx.lineTo(cx, PAD_T + dH); ctx.stroke();
    }
    for (let wy = 0; wy <= WORLD_H; wy += GRID_STEP_Y) {
      const cy = toCanvas(0, wy).y;
      ctx.beginPath(); ctx.moveTo(PAD_L, cy); ctx.lineTo(PAD_L + dW, cy); ctx.stroke();
    }

    ctx.fillStyle    = AXIS_COLOR;
    ctx.font         = `10px 'Segoe UI', sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    for (let wx = 0; wx <= WORLD_W; wx += GRID_STEP_X) {
      ctx.fillText(wx, toCanvas(wx, 0).x, PAD_T + dH + 3);
    }

    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    for (let wy = 0; wy <= WORLD_H; wy += GRID_STEP_Y) {
      ctx.fillText(wy, PAD_L - 4, toCanvas(0, wy).y);
    }

    ctx.restore();
  }

  /* ── Edges ───────────────────────────────────────────────────────────────── */
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

      /* Weight badge */
      const mx  = (cA.x + cB.x) / 2;
      const my  = (cA.y + cB.y) / 2;
      const lbl = String(e.weight);
      ctx.font  = `bold 11px 'Segoe UI', sans-serif`;
      const tw  = ctx.measureText(lbl).width;
      const p   = 3;

      ctx.fillStyle = WEIGHT_BG;
      ctx.beginPath(); ctx.roundRect(mx - tw/2 - p, my - 8, tw + p*2, 16, 3); ctx.fill();

      ctx.fillStyle    = WEIGHT_COLOR;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl, mx, my);
    }
    ctx.restore();
  }

  /* ── Nodes ───────────────────────────────────────────────────────────────── */
  function drawNodes() {
    for (const n of nodes) {
      const c = toCanvas(n.x, n.y);
      drawNode(c.x, c.y, n.name, NODE_FILL, NODE_STROKE, NODE_TEXT);
    }
  }

  function drawNode(cx, cy, label, fill, stroke, text) {
    ctx.save();
    ctx.shadowColor   = 'rgba(99,102,241,0.25)';
    ctx.shadowBlur    = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = 2;
    ctx.stroke();

    const fs = label.length > 2 ? 9 : 11;
    ctx.font         = `bold ${fs}px 'Segoe UI', sans-serif`;
    ctx.fillStyle    = text;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
  }

  /* ── Redraw ──────────────────────────────────────────────────────────────── */
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawEdges();
    drawNodes();
  }

  /* ── Graph helpers ───────────────────────────────────────────────────────── */
  function nodeById(id)   { return nodes.find(n => n.id   === id); }
  function nodeByName(nm) { return nodes.find(n => n.name === nm); }

  function edgeExists(fromId, toId) {
    return edges.some(e =>
      (e.from === fromId && e.to === toId) ||
      (e.from === toId   && e.to === fromId)
    );
  }

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

  /* ════════════════════════════════════════════════════════════════════════════
     MATRIX VIEW
     ════════════════════════════════════════════════════════════════════════════

     Layout (rows top-to-bottom):
       Row 0  : corner + col-index headers  (1, 2, 3 …)
       Row 1  : "Name" label + one editable cell per node
       Row 2  : "X"    label + one editable cell per node
       Row 3  : "Y"    label + one editable cell per node
       Row 4+ : weight rows  (one per node, upper-tri editable, lower-tri mirrored)
  ════════════════════════════════════════════════════════════════════════════ */

  /* Build the full matrix table from current state */
  function buildMatrixTable() {
    const container = document.getElementById('mat-container');

    if (nodes.length === 0) {
      container.innerHTML =
        '<span style="color:#cbd5e1;font-size:13px;">No nodes yet — switch to Plot view and add nodes first.</span>';
      return;
    }

    const n   = nodes.length;
    const mat = adjacencyMatrix();

    const table = document.createElement('table');
    table.id = 'mat-table';

    /* ── Header row: corner + column indices ── */
    const thead = table.createTHead();
    const hrow  = thead.insertRow();
    addCell(hrow, 'th', '', 'corner');
    for (let j = 0; j < n; j++) addCell(hrow, 'th', j + 1, 'col-header');

    const tbody = table.createTBody();

    /* ── Name row ── */
    const nameRow = tbody.insertRow();
    addCell(nameRow, 'td', 'Name', 'row-label');
    for (let j = 0; j < n; j++) {
      const td  = nameRow.insertCell();
      const inp = makeInput(nodes[j].name, 'name', j);
      td.appendChild(inp);
    }

    /* ── X row ── */
    const xRow = tbody.insertRow();
    addCell(xRow, 'td', 'X', 'row-label');
    for (let j = 0; j < n; j++) {
      const td  = xRow.insertCell();
      const inp = makeInput(nodes[j].x, 'x', j);
      td.appendChild(inp);
    }

    /* ── Y row ── */
    const yRow = tbody.insertRow();
    addCell(yRow, 'td', 'Y', 'row-label');
    for (let j = 0; j < n; j++) {
      const td  = yRow.insertCell();
      const inp = makeInput(nodes[j].y, 'y', j);
      td.appendChild(inp);
    }

    /* ── Weight rows ── */
    for (let i = 0; i < n; i++) {
      const row = tbody.insertRow();
      addCell(row, 'td', nodes[i].name, 'row-label');

      for (let j = 0; j < n; j++) {
        const td = row.insertCell();

        if (i === j) {
          /* Diagonal */
          td.className = 'diag';
          td.textContent = '0';
        } else if (i > j) {
          /* Lower triangle — mirrored, read-only */
          td.className = 'mirror' + (mat[i][j] === 0 ? ' zero-w' : '');
          const inp = makeInput(mat[i][j], 'mirror', i, j);
          inp.readOnly = true;
          td.appendChild(inp);
        } else {
          /* Upper triangle — editable */
          td.className = mat[i][j] === 0 ? 'zero-w' : '';
          const inp = makeInput(mat[i][j], 'weight', i, j);
          td.appendChild(inp);
        }
      }
    }

    container.innerHTML = '';
    container.appendChild(table);
  }

  /* Create a <th> or <td> with text and optional class */
  function addCell(row, tag, text, cls) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    row.appendChild(el);
    return el;
  }

  /* Create an <input> with data-attributes for later event handling */
  function makeInput(value, type, i, j) {
    const inp    = document.createElement('input');
    inp.type     = 'text';
    inp.value    = value;
    inp.dataset.mtype = type;
    inp.dataset.i     = i;
    if (j !== undefined) inp.dataset.j = j;
    inp.addEventListener('change', onMatrixInputChange);
    inp.addEventListener('input',  onMatrixInputChange);
    return inp;
  }

  /* ── React to edits inside the matrix table ── */
  function onMatrixInputChange(e) {
    const inp   = e.target;
    const type  = inp.dataset.mtype;
    const i     = parseInt(inp.dataset.i, 10);
    const j     = inp.dataset.j !== undefined ? parseInt(inp.dataset.j, 10) : undefined;
    const raw   = inp.value.trim();

    if (type === 'name') {
      /* Empty name → delete that node (and its edges) */
      if (raw === '') {
        removeNode(nodes[i].id);   /* rebuilds table */
        return;
      }
      /* Duplicate check */
      if (nodes.some((n, idx) => idx !== i && n.name === raw)) {
        inp.style.background = '#fee2e2';
        return;
      }
      inp.style.background = '';
      nodes[i].name = raw;
      /* Sync mirror column header */
      syncMatrixMeta();
      redraw();
    }

    else if (type === 'x') {
      const v = parseFloat(raw);
      if (isNaN(v) || v < 0 || v > WORLD_W) { inp.style.background = '#fee2e2'; return; }
      inp.style.background = '';
      nodes[i].x = v;
      redraw();
    }

    else if (type === 'y') {
      const v = parseFloat(raw);
      if (isNaN(v) || v < 0 || v > WORLD_H) { inp.style.background = '#fee2e2'; return; }
      inp.style.background = '';
      nodes[i].y = v;
      redraw();
    }

    else if (type === 'weight') {
      const w = parseFloat(raw);
      const nA = nodes[i];
      const nB = nodes[j];

      /* Remove existing edge between these two (if any) */
      edges = edges.filter(ed =>
        !((ed.from === nA.id && ed.to === nB.id) ||
          (ed.from === nB.id && ed.to === nA.id))
      );

      /* If weight is non-zero and valid → create edge */
      if (!isNaN(w) && w > 0) {
        edges.push({ id: ++_eid, from: nA.id, to: nB.id, weight: w });
      }

      /* Mirror the lower-triangle cell */
      syncMirrorCell(i, j, isNaN(w) ? 0 : w);

      /* Update zero class */
      inp.closest('td').className = (!isNaN(w) && w > 0) ? '' : 'zero-w';

      refreshInfo();
      refreshRemoveDropdowns();
      redraw();
    }
  }

  /* After name change, update column headers and row labels in existing table */
  function syncMatrixMeta() {
    const table = document.getElementById('mat-table');
    if (!table) return;

    /* Column headers (thead row, skip corner) */
    const hcells = table.tHead.rows[0].cells;
    for (let j = 0; j < nodes.length; j++) {
      /* col header shows index, not name — nothing to update there */
    }

    /* Row labels in weight rows (skip Name/X/Y rows = first 3 tbody rows) */
    const rows = table.tBodies[0].rows;
    for (let i = 0; i < nodes.length; i++) {
      rows[i + 3].cells[0].textContent = nodes[i].name;
    }
    refreshInfo();
    refreshRemoveDropdowns();
  }

  /* Update the mirror (lower-triangle) cell at [j][i] when [i][j] changes */
  function syncMirrorCell(i, j, weight) {
    const table = document.getElementById('mat-table');
    if (!table) return;
    /* Body rows: 0=Name,1=X,2=Y, then weight rows starting at 3 */
    const rows = table.tBodies[0].rows;
    const weightRows = Array.from(rows).slice(3);   /* rows 3+ */

    /* Mirror is at row j, col i+1 (col 0 = row-label) */
    if (j < weightRows.length) {
      const cell = weightRows[j].cells[i + 1];
      if (cell && cell.classList.contains('mirror')) {
        const inp = cell.querySelector('input');
        if (inp) inp.value = weight > 0 ? weight : 0;
        cell.className = 'mirror' + (weight === 0 ? ' zero-w' : '');
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════════
     UI REFRESH
  ════════════════════════════════════════════════════════════════════════════ */

  function refreshAll() {
    refreshNodeDropdowns();
    refreshRemoveDropdowns();
    refreshInfo();
    if (viewMode === 'matrix') buildMatrixTable();
    redraw();
  }

  function refreshInfo() {
    document.getElementById('info-nodes').textContent = `Nodes: ${nodes.length}`;
    document.getElementById('info-edges').textContent = `Edges: ${edges.length}`;
  }

  /* Dropdowns for From / To in Add Edge panel */
  function refreshNodeDropdowns() {
    const fromSel  = document.getElementById('edge-from');
    const toSel    = document.getElementById('edge-to');
    const prevFrom = fromSel.value;
    const prevTo   = toSel.value;

    [fromSel, toSel].forEach(sel => {
      sel.innerHTML = '<option value="">–</option>';
      for (const n of nodes) {
        const opt = document.createElement('option');
        opt.value = n.id;
        opt.textContent = n.name;
        sel.appendChild(opt);
      }
    });

    if (prevFrom) fromSel.value = prevFrom;
    if (prevTo)   toSel.value   = prevTo;
  }

  /* Dropdowns for Remove Node / Remove Edge */
  function refreshRemoveDropdowns() {
    /* Remove Node */
    const rnSel = document.getElementById('remove-node-sel');
    const prevRN = rnSel.value;
    rnSel.innerHTML = '<option value="">– select node –</option>';
    for (const n of nodes) {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = `${n.name} (${n.x}, ${n.y})`;
      rnSel.appendChild(opt);
    }
    if (prevRN) rnSel.value = prevRN;

    /* Remove Edge */
    const reSel = document.getElementById('remove-edge-sel');
    const prevRE = reSel.value;
    reSel.innerHTML = '<option value="">– select edge –</option>';
    for (const e of edges) {
      const nA = nodeById(e.from);
      const nB = nodeById(e.to);
      if (!nA || !nB) continue;
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${nA.name} — ${nB.name}  [${e.weight}]`;
      reSel.appendChild(opt);
    }
    if (prevRE) reSel.value = prevRE;
  }

  /* ════════════════════════════════════════════════════════════════════════════
     ADD / REMOVE NODES & EDGES
  ════════════════════════════════════════════════════════════════════════════ */

  function addNode(name, x, y) {
    const hint = document.getElementById('node-hint');
    name = name.trim();
    if (!name)              { hint.textContent = 'Name is required.'; return false; }
    if (nodeByName(name))   { hint.textContent = `"${name}" already exists.`; return false; }
    if (x < 0 || x > WORLD_W) { hint.textContent = `X must be 0–${WORLD_W}.`; return false; }
    if (y < 0 || y > WORLD_H) { hint.textContent = `Y must be 0–${WORLD_H}.`; return false; }
    hint.textContent = '';
    nodes.push({ id: ++_nid, name, x, y });
    refreshAll();
    return true;
  }

  function removeNode(id) {
    nodes = nodes.filter(n => n.id !== id);
    edges = edges.filter(e => e.from !== id && e.to !== id);
    refreshAll();
  }

  function addEdge(fromId, toId, weight) {
    const hint = document.getElementById('edge-hint');
    fromId = parseInt(fromId);
    toId   = parseInt(toId);
    weight = parseFloat(weight);
    if (!fromId || !toId)      { hint.textContent = 'Select both nodes.'; return false; }
    if (fromId === toId)       { hint.textContent = 'Self-loops not allowed.'; return false; }
    if (isNaN(weight))         { hint.textContent = 'Invalid weight.'; return false; }
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

  /* ════════════════════════════════════════════════════════════════════════════
     VIEW TOGGLE
  ════════════════════════════════════════════════════════════════════════════ */

  function setView(mode) {
    viewMode = mode;
    const track    = document.getElementById('view-toggle');
    const lblPlot  = document.getElementById('lbl-plot');
    const lblMat   = document.getElementById('lbl-matrix');
    const plotEl   = document.getElementById('plane');
    const matEl    = document.getElementById('matrix-view');
    const plotOnly = document.querySelectorAll('.plot-only');

    if (mode === 'matrix') {
      track.classList.add('on');
      lblPlot.style.fontWeight = '400'; lblPlot.style.color = '';
      lblMat.style.fontWeight  = '600'; lblMat.style.color  = '#6366f1';
      plotEl.style.display = 'none';
      matEl.classList.add('active');
      plotOnly.forEach(el => el.classList.add('hidden'));
      buildMatrixTable();
    } else {
      track.classList.remove('on');
      lblPlot.style.fontWeight = '600'; lblPlot.style.color = '#6366f1';
      lblMat.style.fontWeight  = '400'; lblMat.style.color  = '';
      plotEl.style.display = 'block';
      matEl.classList.remove('active');
      plotOnly.forEach(el => el.classList.remove('hidden'));
      redraw();
    }
  }

  document.getElementById('view-toggle').addEventListener('click', () => {
    setView(viewMode === 'plot' ? 'matrix' : 'plot');
  });

  /* ════════════════════════════════════════════════════════════════════════════
     BUTTON WIRING
  ════════════════════════════════════════════════════════════════════════════ */

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

  document.getElementById('remove-node-btn').addEventListener('click', () => {
    const id = parseInt(document.getElementById('remove-node-sel').value, 10);
    if (id) { removeNode(id); document.getElementById('remove-node-sel').value = ''; }
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

  document.getElementById('remove-edge-btn').addEventListener('click', () => {
    const id = parseInt(document.getElementById('remove-edge-sel').value, 10);
    if (id) { removeEdge(id); document.getElementById('remove-edge-sel').value = ''; }
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    nodes = []; edges = []; _nid = 0; _eid = 0;
    document.getElementById('node-hint').textContent = '';
    document.getElementById('edge-hint').textContent = '';
    refreshAll();
  });

  /* Enter key support */
  ['node-name','node-x','node-y'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('add-node-btn').click();
    });
  });
  document.getElementById('edge-weight').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-edge-btn').click();
  });

  /* ── Resize ──────────────────────────────────────────────────────────────── */
  window.addEventListener('resize', sizeCanvas);

  /* ── Public API ──────────────────────────────────────────────────────────── */
  window.PlaneGraph = {
    getNodes:        () => [...nodes],
    getEdges:        () => [...edges],
    adjacencyMatrix,
    adjacencyList,
    nodeById,
    nodeByName,
    redraw,
    drawNode,
    toCanvas,
    ctx:    () => ctx,
    canvas: () => canvas,
    NODE_R,
  };

  /* ── Boot ────────────────────────────────────────────────────────────────── */
  sizeCanvas();

})();