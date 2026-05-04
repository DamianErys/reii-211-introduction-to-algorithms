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

  /* ── Node panel: Add / Remove sub-toggle ────────────────────────────────── */
  (function () {
    let removeMode = false;
    const track      = document.getElementById('node-mode-toggle');
    const addDiv     = document.getElementById('sub-add-node');
    const removeDiv  = document.getElementById('sub-remove-node');
    const lblAdd     = document.getElementById('lbl-add-node');
    const lblRemove  = document.getElementById('lbl-remove-node');

    track.addEventListener('click', () => {
      removeMode = !removeMode;
      track.classList.toggle('on', removeMode);
      addDiv   .classList.toggle('sub-hidden', removeMode);
      removeDiv.classList.toggle('sub-hidden', !removeMode);
      lblAdd   .classList.toggle('active', !removeMode);
      lblRemove.classList.toggle('active',  removeMode);
    });
  })();

  /* ── Edge panel: Add / Remove sub-toggle ────────────────────────────────── */
  (function () {
    let removeMode = false;
    const track      = document.getElementById('edge-mode-toggle');
    const addDiv     = document.getElementById('sub-add-edge');
    const removeDiv  = document.getElementById('sub-remove-edge');
    const lblAdd     = document.getElementById('lbl-add-edge');
    const lblRemove  = document.getElementById('lbl-remove-edge');

    track.addEventListener('click', () => {
      removeMode = !removeMode;
      track.classList.toggle('on', removeMode);
      addDiv   .classList.toggle('sub-hidden', removeMode);
      removeDiv.classList.toggle('sub-hidden', !removeMode);
      lblAdd   .classList.toggle('active', !removeMode);
      lblRemove.classList.toggle('active',  removeMode);
    });
  })();

  /* ── Canvas click → fill X / Y inputs ───────────────────────────────────── */
  window.Plane.canvas.canvas.addEventListener('click', (e) => {
    /* Only active in plot mode and when the Add Node sub-panel is visible */
    const addDiv = document.getElementById('sub-add-node');
    if (!addDiv || addDiv.classList.contains('sub-hidden')) return;

    const { canvas, WORLD_W, WORLD_H } = window.Plane.canvas;
    const PAD_L = 28, PAD_R = 10, PAD_T = 10, PAD_B = 18;

    const rect = canvas.getBoundingClientRect();
    const px   = e.clientX - rect.left;
    const py   = e.clientY - rect.top;

    /* Pixel → world (Y axis flipped) */
    const dW = canvas.width  - PAD_L - PAD_R;
    const dH = canvas.height - PAD_T - PAD_B;
    const wx = Math.round(((px - PAD_L) / dW) * WORLD_W);
    const wy = Math.round((1 - (py - PAD_T) / dH) * WORLD_H);

    /* Clamp to world bounds */
    const x = Math.max(0, Math.min(WORLD_W, wx));
    const y = Math.max(0, Math.min(WORLD_H, wy));

    document.getElementById('node-x').value = x;
    document.getElementById('node-y').value = y;

    /* Focus the name field so the user can type and hit Enter */
    const nameInput = document.getElementById('node-name');
    if (!nameInput.value) nameInput.focus();
  });

  /* ── Resize ──────────────────────────────────────────────────────────────── */
  window.addEventListener('resize', sizeCanvas);

})();