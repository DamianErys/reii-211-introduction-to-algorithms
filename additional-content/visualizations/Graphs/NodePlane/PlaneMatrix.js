/* ═══════════════════════════════════════════════════════════════════════════
   PlaneMatrix.js  –  Adjacency-matrix view submodule
   Provides: buildMatrixTable
   Depends on: window.Plane.graph, window.Plane.canvas, window.Plane.ui
   Attaches to: window.Plane.matrix

   Layout (rows top-to-bottom):
     Row 0  : corner + col-index headers  (1, 2, 3 …)
     Row 1  : "Name" label + one editable cell per node
     Row 2  : "X"    label + one editable cell per node
     Row 3  : "Y"    label + one editable cell per node
     Row 4+ : weight rows  (one per node, upper-tri editable, lower-tri mirrored)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Build ───────────────────────────────────────────────────────────────── */
  function buildMatrixTable() {
    const { getNodes, adjacencyMatrix } = window.Plane.graph;
    const nodes     = getNodes();
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

    /* Header row: corner + column indices */
    const thead = table.createTHead();
    const hrow  = thead.insertRow();
    addCell(hrow, 'th', '', 'corner');
    for (let j = 0; j < n; j++) addCell(hrow, 'th', j + 1, 'col-header');

    const tbody = table.createTBody();

    /* Name row */
    const nameRow = tbody.insertRow();
    addCell(nameRow, 'td', 'Name', 'row-label');
    for (let j = 0; j < n; j++) {
      nameRow.insertCell().appendChild(makeInput(nodes[j].name, 'name', j));
    }

    /* X row */
    const xRow = tbody.insertRow();
    addCell(xRow, 'td', 'X', 'row-label');
    for (let j = 0; j < n; j++) {
      xRow.insertCell().appendChild(makeInput(nodes[j].x, 'x', j));
    }

    /* Y row */
    const yRow = tbody.insertRow();
    addCell(yRow, 'td', 'Y', 'row-label');
    for (let j = 0; j < n; j++) {
      yRow.insertCell().appendChild(makeInput(nodes[j].y, 'y', j));
    }

    /* Weight rows */
    for (let i = 0; i < n; i++) {
      const row = tbody.insertRow();
      addCell(row, 'td', nodes[i].name, 'row-label');

      for (let j = 0; j < n; j++) {
        const td = row.insertCell();

        if (i === j) {
          td.className   = 'diag';
          td.textContent = '0';
        } else if (i > j) {
          td.className = 'mirror' + (mat[i][j] === 0 ? ' zero-w' : '');
          const inp = makeInput(mat[i][j], 'mirror', i, j);
          inp.readOnly = true;
          td.appendChild(inp);
        } else {
          td.className = mat[i][j] === 0 ? 'zero-w' : '';
          td.appendChild(makeInput(mat[i][j], 'weight', i, j));
        }
      }
    }

    container.innerHTML = '';
    container.appendChild(table);
  }

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  function addCell(row, tag, text, cls) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (cls) el.className = cls;
    row.appendChild(el);
    return el;
  }

  function makeInput(value, type, i, j) {
    const inp         = document.createElement('input');
    inp.type          = 'text';
    inp.value         = value;
    inp.dataset.mtype = type;
    inp.dataset.i     = i;
    if (j !== undefined) inp.dataset.j = j;
    inp.addEventListener('change', onMatrixInputChange);
    inp.addEventListener('input',  onMatrixInputChange);
    return inp;
  }

  /* ── Input handler ───────────────────────────────────────────────────────── */
  function onMatrixInputChange(e) {
    const inp  = e.target;
    const type = inp.dataset.mtype;
    const i    = parseInt(inp.dataset.i, 10);
    const j    = inp.dataset.j !== undefined ? parseInt(inp.dataset.j, 10) : undefined;
    const raw  = inp.value.trim();

    const { getNodes, nodeByName, removeNode, _pushEdge, _filterEdges, _nextEid }
      = window.Plane.graph;
    const { redraw }      = window.Plane.canvas;
    const { refreshInfo, refreshRemoveDropdowns } = window.Plane.ui;

    const nodes = getNodes();

    if (type === 'name') {
      if (raw === '') { removeNode(nodes[i].id); return; }
      if (nodes.some((n, idx) => idx !== i && n.name === raw)) {
        inp.style.background = '#fee2e2'; return;
      }
      inp.style.background = '';
      /* Mutate the live node object (getNodes returns shallow copies of the array
         but the objects themselves are the same references) */
      nodes[i].name = raw;
      syncMatrixMeta();
      redraw();
    }

    else if (type === 'x') {
      const v = parseFloat(raw);
      const { WORLD_W } = window.Plane.canvas;
      if (isNaN(v) || v < 0 || v > WORLD_W) { inp.style.background = '#fee2e2'; return; }
      inp.style.background = '';
      nodes[i].x = v;
      redraw();
    }

    else if (type === 'y') {
      const v = parseFloat(raw);
      const { WORLD_H } = window.Plane.canvas;
      if (isNaN(v) || v < 0 || v > WORLD_H) { inp.style.background = '#fee2e2'; return; }
      inp.style.background = '';
      nodes[i].y = v;
      redraw();
    }

    else if (type === 'weight') {
      const w  = parseFloat(raw);
      const nA = nodes[i];
      const nB = nodes[j];

      _filterEdges(ed =>
        !((ed.from === nA.id && ed.to === nB.id) ||
          (ed.from === nB.id && ed.to === nA.id))
      );

      if (!isNaN(w) && w > 0) {
        _pushEdge({ id: _nextEid(), from: nA.id, to: nB.id, weight: w });
      }

      syncMirrorCell(i, j, isNaN(w) ? 0 : w);
      inp.closest('td').className = (!isNaN(w) && w > 0) ? '' : 'zero-w';

      refreshInfo();
      refreshRemoveDropdowns();
      redraw();
    }
  }

  /* ── Sync helpers ────────────────────────────────────────────────────────── */
  function syncMatrixMeta() {
    const table = document.getElementById('mat-table');
    if (!table) return;
    const nodes = window.Plane.graph.getNodes();
    const rows  = table.tBodies[0].rows;
    for (let i = 0; i < nodes.length; i++) {
      rows[i + 3].cells[0].textContent = nodes[i].name;
    }
    window.Plane.ui.refreshInfo();
    window.Plane.ui.refreshRemoveDropdowns();
  }

  function syncMirrorCell(i, j, weight) {
    const table = document.getElementById('mat-table');
    if (!table) return;
    const rows      = table.tBodies[0].rows;
    const weightRows = Array.from(rows).slice(3);
    if (j < weightRows.length) {
      const cell = weightRows[j].cells[i + 1];
      if (cell && cell.classList.contains('mirror')) {
        const inp = cell.querySelector('input');
        if (inp) inp.value = weight > 0 ? weight : 0;
        cell.className = 'mirror' + (weight === 0 ? ' zero-w' : '');
      }
    }
  }

  /* ── Attach to namespace ─────────────────────────────────────────────────── */
  window.Plane.matrix = {
    buildMatrixTable,
  };

})();
