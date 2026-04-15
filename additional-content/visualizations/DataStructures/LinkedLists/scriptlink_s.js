/* ── scriptlink_s.js ──────────────────────────────────────────────── */
/* Singly Linked List - Append to end using fixed grid positions */

const MAX_NODES = GRID_SIZE;    // 72

// ── Build steps for Insert ────────────────────────────────────────
/* ── scriptlink_s.js ──────────────────────────────────────────────── */
// REMOVED: let singlyNodes = []; (Already declared in script.js)

function buildSinglyInsertSteps(value) {
    const steps = [];
    // We work with the global singlyNodes from script.js
    const working = [...singlyNodes]; 
    const newIndex = working.length;

    if (newIndex >= GRID_SIZE) {
        steps.push({
            data: working.map(n => n.value),
            highlights: {},
            msg: "Grid is full!"
        });
        return steps;
    }

    const newNode = { value: value, address: newIndex + 1 };
    working.push(newNode);

    // Step 1: Show the new node being created
    steps.push({
        data: working.map(n => n.value),
        highlights: { [newIndex]: 'state-inserted' },
        msg: `Create new node with ${value} at address ${toHex(newNode.address)}.`
    });

    // Step 2: Show the pointer update if it's not the first node
    if (working.length > 1) {
        steps.push({
            data: working.map(n => n.value),
            highlights: { [newIndex - 1]: 'state-comparing', [newIndex]: 'state-inserted' },
            msg: `Updating pointer of ${working[newIndex-1].value} to point to ${toHex(newNode.address)}.`
        });
    }

    // Crucial: Update the global variable before returning
    singlyNodes = working; 
    return steps;
}

// ── Custom render with pointers ───────────────────────────────────
/* --- scriptlink_s.js --- */

function renderSinglyGrid(data = null) {
    const cells = dsDisplay.children;
    // Use the provided step data, or fall back to the global state
    const displayData = data || singlyNodes.map(n => n.value);

    for (let i = 0; i < GRID_SIZE; i++) {
        const cell = cells[i];
        if (!cell) continue;

        const valEl = cell.querySelector('.mem-value');
        let ptrEl = cell.querySelector('.mem-ptr');
        if (ptrEl) ptrEl.remove();

        cell.classList.remove(...STATE_CLASSES, 'occupied');

        if (i < displayData.length) {
            cell.classList.add('occupied');
            valEl.textContent = displayData[i];
            valEl.style.display = '';

            ptrEl = document.createElement('span');
            ptrEl.className = 'mem-ptr';

            // Point to next index (i+1) or NULL
            const nextAddr = (i < displayData.length - 1) ? toHex(i + 2) : 'NULL';
            ptrEl.textContent = `→ ${nextAddr}`;
            cell.appendChild(ptrEl);
        } else {
            valEl.style.display = 'none';
        }
    }
}

// ── Apply step for singly mode ────────────────────────────────────
function applySinglyStep(idx) {
    if (idx < 0 || idx >= allSteps.length) return;

    const s = allSteps[idx];

    renderSinglyGrid();           // Always render current list state
    setStepMsg(s.msg);

    // Apply temporary highlights for animation
    if (s.highlights) {
        const cells = dsDisplay.children;
        Object.keys(s.highlights).forEach(key => {
            const i = parseInt(key);
            if (cells[i]) {
                cells[i].classList.add(s.highlights[i]);
            }
        });
    }
}

// ── Register handlers for the centralized system ──────────────────
function setupSinglyHandlers() {
    // === THIS IS THE KEY PART ===
    window.currentInsertHandlerForStructure = (value) => {
        if (structure !== 'singly') return;

        const steps = buildSinglyInsertSteps(value);

        if (!visualiseCheck.checked) {
            autoPlaySteps(steps);           // uses shared autoPlay
        } else {
            cancelAutoPlay();
            allSteps = steps;
            currentStep = 0;
            applySinglyStep(0);             // use singly render + step
            updateStepButtons();
        }
    };

    window.currentDeleteHandlerForStructure = (value) => {
        if (structure === 'singly') {
            setStepMsg('Delete not implemented for Singly Linked List yet.');
        }
    };
}

// Initialize
setupSinglyHandlers();