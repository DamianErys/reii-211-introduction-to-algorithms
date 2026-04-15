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

// ── Build steps for Delete ────────────────────────────────────────

function buildSinglyDeleteSteps(value) {
    const steps = [];
    const working = [...singlyNodes];

    // Linear search
    let foundIdx = -1;
    for (let i = 0; i < working.length; i++) {
        steps.push({
            nodes: [...working],
            highlights: { [i]: 'state-comparing' },
            msg: `Checking node at ${toHex(working[i].address)}: value is ${working[i].value}.`
        });

        if (working[i].value === value) {
            foundIdx = i;
            steps.push({
                nodes: [...working],
                highlights: { [i]: 'state-found' },
                msg: `Found ${value} at ${toHex(working[i].address)}.`
            });
            break;
        }
    }

    if (foundIdx === -1) {
        steps.push({
            nodes: [...working],
            highlights: {},
            msg: `${value} not found in the list.`
        });
        return steps;
    }

    // Show pointer update on previous node (if not head)
    if (foundIdx > 0) {
        const prevNode = working[foundIdx - 1];
        const nextAddr = foundIdx + 1 < working.length ? toHex(working[foundIdx + 1].address) : 'NULL';
        steps.push({
            nodes: [...working],
            highlights: { [foundIdx - 1]: 'state-swap', [foundIdx]: 'state-deleted' },
            msg: `Update pointer of node ${prevNode.value} (${toHex(prevNode.address)}) to skip deleted node → ${nextAddr}.`
        });
    } else {
        steps.push({
            nodes: [...working],
            highlights: { [foundIdx]: 'state-deleted' },
            msg: `Removing head node. Head now points to ${foundIdx + 1 < working.length ? toHex(working[foundIdx + 1].address) : 'NULL'}.`
        });
    }

    // Remove the node and repack addresses
    working.splice(foundIdx, 1);
    working.forEach((n, i) => { n.address = i + 1; });

    steps.push({
        nodes: [...working],
        highlights: {},
        msg: `Node deleted. List now has ${working.length} node${working.length !== 1 ? 's' : ''}.`
    });

    singlyNodes = working;
    return steps;
}

// ── Build steps for Search ────────────────────────────────────────

function buildSinglySearchSteps(value) {
    const steps = [];
    const working = [...singlyNodes];

    for (let i = 0; i < working.length; i++) {
        steps.push({
            nodes: [...working],
            highlights: { [i]: 'state-comparing' },
            msg: `Checking node at ${toHex(working[i].address)}: value is ${working[i].value}.`
        });

        if (working[i].value === value) {
            steps.push({
                nodes: [...working],
                highlights: { [i]: 'state-found' },
                msg: `Found ${value} at address ${toHex(working[i].address)}!`
            });
            return steps;
        }

        if (i < working.length - 1) {
            steps.push({
                nodes: [...working],
                highlights: { [i]: 'state-swap' },
                msg: `${working[i].value} ≠ ${value}. Following pointer to ${toHex(working[i + 1].address)}.`
            });
        }
    }

    steps.push({
        nodes: [...working],
        highlights: {},
        msg: `${value} not found in the list.`
    });
    return steps;
}

// ── Apply step for singly mode ────────────────────────────────────
function applySinglyStep(idx) {
    if (idx < 0 || idx >= allSteps.length) return;

    const s = allSteps[idx];

    // Steps from delete/search carry a .nodes snapshot; insert steps use singlyNodes directly
    if (s.nodes) {
        renderSinglyGrid(s.nodes.map(n => n.value));
    } else {
        renderSinglyGrid();
    }

    setStepMsg(s.msg);

    if (s.highlights) {
        const cells = dsDisplay.children;
        Object.keys(s.highlights).forEach(key => {
            const i = parseInt(key);
            if (cells[i]) cells[i].classList.add(s.highlights[i]);
        });
    }
}

// ── Register handlers for the centralized system ──────────────────
// Called by script.js refreshOperationHandlers() when switching to singly mode.
function setupSinglyHandlers() {
    const run = (steps) => {
        if (!visualiseCheck.checked) {
            autoPlaySteps(steps);
        } else {
            cancelAutoPlay();
            allSteps = steps;
            currentStep = 0;
            applySinglyStep(0);
            updateStepButtons();
        }
    };

    window.currentInsertHandlerForStructure = (value) => {
        run(buildSinglyInsertSteps(value));
    };

    window.currentDeleteHandlerForStructure = (value) => {
        if (singlyNodes.length === 0) { setStepMsg('List is empty.'); return; }
        run(buildSinglyDeleteSteps(value));
    };

    window.currentSearchHandlerForStructure = (value) => {
        if (singlyNodes.length === 0) { setStepMsg('List is empty.'); return; }
        run(buildSinglySearchSteps(value));
    };
}

// NOTE: Do NOT call setupSinglyHandlers() here at load time.
// script.js calls refreshOperationHandlers() which calls setupSinglyHandlers()
// only when the user switches to singly mode.