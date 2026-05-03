/* ═══════════════════════════════════════════════════════════════════════════
   PlaneUI.js  –  DOM refresh & view-toggle submodule
   Provides: refreshAll, refreshInfo, refreshNodeDropdowns,
             refreshRemoveDropdowns, setView
   Depends on: window.Plane.graph, window.Plane.canvas, window.Plane.matrix
   Attaches to: window.Plane.ui
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── View state ──────────────────────────────────────────────────────────── */
  let viewMode = 'plot';

  /* ── Refresh ─────────────────────────────────────────────────────────────── */
  function refreshAll() {
    refreshNodeDropdowns();
    refreshRemoveDropdowns();
    refreshInfo();
    if (viewMode === 'matrix') window.Plane.matrix.buildMatrixTable();
    window.Plane.canvas.redraw();
  }

  function refreshInfo() {
    const { getNodes, getEdges } = window.Plane.graph;
    document.getElementById('info-nodes').textContent = `Nodes: ${getNodes().length}`;
    document.getElementById('info-edges').textContent = `Edges: ${getEdges().length}`;
  }

  function refreshNodeDropdowns() {
    const { getNodes } = window.Plane.graph;
    const fromSel  = document.getElementById('edge-from');
    const toSel    = document.getElementById('edge-to');
    const prevFrom = fromSel.value;
    const prevTo   = toSel.value;

    [fromSel, toSel].forEach(sel => {
      sel.innerHTML = '<option value="">–</option>';
      for (const n of getNodes()) {
        const opt = document.createElement('option');
        opt.value       = n.id;
        opt.textContent = n.name;
        sel.appendChild(opt);
      }
    });

    if (prevFrom) fromSel.value = prevFrom;
    if (prevTo)   toSel.value   = prevTo;
  }

  function refreshRemoveDropdowns() {
    const { getNodes, getEdges, nodeById } = window.Plane.graph;

    /* Remove Node */
    const rnSel  = document.getElementById('remove-node-sel');
    const prevRN = rnSel.value;
    rnSel.innerHTML = '<option value="">– select node –</option>';
    for (const n of getNodes()) {
      const opt = document.createElement('option');
      opt.value       = n.id;
      opt.textContent = `${n.name} (${n.x}, ${n.y})`;
      rnSel.appendChild(opt);
    }
    if (prevRN) rnSel.value = prevRN;

    /* Remove Edge */
    const reSel  = document.getElementById('remove-edge-sel');
    const prevRE = reSel.value;
    reSel.innerHTML = '<option value="">– select edge –</option>';
    for (const e of getEdges()) {
      const nA = nodeById(e.from);
      const nB = nodeById(e.to);
      if (!nA || !nB) continue;
      const opt = document.createElement('option');
      opt.value       = e.id;
      opt.textContent = `${nA.name} — ${nB.name}  [${e.weight}]`;
      reSel.appendChild(opt);
    }
    if (prevRE) reSel.value = prevRE;
  }

  /* ── View toggle ─────────────────────────────────────────────────────────── */
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
      window.Plane.matrix.buildMatrixTable();
    } else {
      track.classList.remove('on');
      lblPlot.style.fontWeight = '600'; lblPlot.style.color = '#6366f1';
      lblMat.style.fontWeight  = '400'; lblMat.style.color  = '';
      plotEl.style.display = 'block';
      matEl.classList.remove('active');
      plotOnly.forEach(el => el.classList.remove('hidden'));
      window.Plane.canvas.redraw();
    }
  }

  function getViewMode() { return viewMode; }

  /* ── Attach to namespace ─────────────────────────────────────────────────── */
  window.Plane.ui = {
    refreshAll,
    refreshInfo,
    refreshNodeDropdowns,
    refreshRemoveDropdowns,
    setView,
    getViewMode,
  };

})();
