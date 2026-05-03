/* ═══════════════════════════════════════════════════════════════════════════
   PlaneEvents.js  –  Event-listener wiring submodule
   Wires: add/remove node & edge buttons, clear, Enter keys,
          view toggle, window resize
   Depends on: window.Plane.graph, window.Plane.canvas, window.Plane.ui
   No public API – side-effects only.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const { addNode, removeNode, addEdge, removeEdge, clear } = window.Plane.graph;
  const { sizeCanvas }                                       = window.Plane.canvas;
  const { setView, getViewMode, refreshAll }                 = window.Plane.ui;

  /* ── Add Node ────────────────────────────────────────────────────────────── */
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

  /* ── Remove Node ─────────────────────────────────────────────────────────── */
  document.getElementById('remove-node-btn').addEventListener('click', () => {
    const id = parseInt(document.getElementById('remove-node-sel').value, 10);
    if (id) { removeNode(id); document.getElementById('remove-node-sel').value = ''; }
  });

  /* ── Add Edge ────────────────────────────────────────────────────────────── */
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

  /* ── Remove Edge ─────────────────────────────────────────────────────────── */
  document.getElementById('remove-edge-btn').addEventListener('click', () => {
    const id = parseInt(document.getElementById('remove-edge-sel').value, 10);
    if (id) { removeEdge(id); document.getElementById('remove-edge-sel').value = ''; }
  });

  /* ── Clear All ───────────────────────────────────────────────────────────── */
  document.getElementById('clear-btn').addEventListener('click', () => {
    clear();
    document.getElementById('node-hint').textContent = '';
    document.getElementById('edge-hint').textContent = '';
    refreshAll();
  });

  /* ── Enter key support ───────────────────────────────────────────────────── */
  ['node-name', 'node-x', 'node-y'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('add-node-btn').click();
    });
  });

  document.getElementById('edge-weight').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-edge-btn').click();
  });

  /* ── View toggle ─────────────────────────────────────────────────────────── */
  document.getElementById('view-toggle').addEventListener('click', () => {
    setView(getViewMode() === 'plot' ? 'matrix' : 'plot');
  });

  /* ── Resize ──────────────────────────────────────────────────────────────── */
  window.addEventListener('resize', sizeCanvas);

})();
