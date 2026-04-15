/* ── State ────────────────────────────────────────────────────── */

let structure = 'array';   // 'array' | 'singly' | 'doubly'
let arrayData = [];        // sorted array of numbers

// Step-by-step
let allSteps   = [];       // [{data, highlights, msg}]
let currentStep = 0;

/* ── Constants ────────────────────────────────────────────────── */

const GRID_COLS = 12;
const GRID_ROWS = 8;
const GRID_SIZE = GRID_COLS * GRID_ROWS;  

/* ── DOM refs ─────────────────────────────────────────────────── */

const dsDisplay      = document.getElementById('dsDisplay');
const valueInput     = document.getElementById('valueInput');
const visualiseCheck = document.getElementById('visualiseCheck');
const stepControls   = document.getElementById('stepControls');
const stepBackBtn    = document.getElementById('stepBackBtn');
const stepForwardBtn = document.getElementById('stepForwardBtn');
const stepMsg        = document.getElementById('stepMsg');

/* ── Helpers ──────────────────────────────────────────────────── */

function toHex(n) {
    return '0x' + n.toString(16).toUpperCase().padStart(2, '0');
}

function clearAll() {
    cancelAutoPlay();
    arrayData   = [];
    allSteps    = [];
    currentStep = 0;
    renderGrid([]);
    updateStepButtons();
    setStepMsg('');
}

function setStepMsg(msg) {
    stepMsg.textContent = msg;
}

/* ── Grid initialiser — called once on page load ──────────────── */
// Builds all 110 cell elements and appends them. Never rebuilds after this.

function initGrid() {
    dsDisplay.innerHTML = '';
    for (let i = 0; i < GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'mem-cell';

        const addr = document.createElement('span');
        addr.className = 'mem-addr';
        addr.textContent = toHex(i + 1);
        cell.appendChild(addr);

        // Placeholder value span — hidden when empty
        const val = document.createElement('span');
        val.className = 'mem-value';
        val.style.display = 'none';
        cell.appendChild(val);

        dsDisplay.appendChild(cell);
    }
}

/* ── Grid renderer — updates existing cells in-place ─────────── */
// data       : number[]  — occupied values in slot order
// highlights : { [index]: 'state-*' class string }
// No DOM rebuild = no layout reflow = no size jump.

const STATE_CLASSES = ['state-comparing', 'state-swap', 'state-inserted', 'state-found', 'state-deleted'];

function renderGrid(data, highlights = {}) {
    const cells = dsDisplay.children;

    for (let i = 0; i < GRID_SIZE; i++) {
        const cell = cells[i];
        const valEl = cell.querySelector('.mem-value');

        // Remove all state classes
        cell.classList.remove(...STATE_CLASSES);

        if (i < data.length) {
            cell.classList.add('occupied');
            valEl.textContent = data[i];
            valEl.style.display = '';

            if (highlights[i]) {
                cell.classList.add(highlights[i]);
            }
        } else {
            cell.classList.remove('occupied');
            valEl.style.display = 'none';
        }
    }
}

/* ── Auto-play — animates steps automatically ─────────────────── */
// Used in non-stepwise mode so inserts are visualised rather than
// jumping straight to the final state.

let autoPlayTimer = null;
const AUTO_STEP_MS = 150;   // delay between steps in ms

function cancelAutoPlay() {
    if (autoPlayTimer !== null) {
        clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
    }
}

function autoPlaySteps(steps) {
    cancelAutoPlay();
    allSteps    = steps;
    currentStep = 0;
    applyStep(0);

    function advance() {
        if (currentStep < allSteps.length - 1) {
            currentStep++;
            applyStep(currentStep);
            autoPlayTimer = setTimeout(advance, AUTO_STEP_MS);
        } else {
            // Commit final state and clean up
            arrayData = [...allSteps[currentStep].data];
            allSteps    = [];
            currentStep = 0;
            autoPlayTimer = null;
        }
    }

    autoPlayTimer = setTimeout(advance, AUTO_STEP_MS);
}

/* ── Build insert steps (insertion-sort style) ────────────────── */

function buildInsertSteps(arr, value) {
    const steps = [];
    const working = [...arr];

    // Step 0: append at the end
    working.push(value);
    const newIdx = working.length - 1;

    steps.push({
        data: [...working],
        highlights: { [newIdx]: 'state-comparing' },
        msg: `Append ${value} at address ${toHex(newIdx + 1)}. Now bubble it left into sorted position.`
    });

    let i = newIdx;

    while (i > 0 && working[i - 1] > working[i]) {
        steps.push({
            data: [...working],
            highlights: { [i]: 'state-comparing', [i - 1]: 'state-comparing' },
            msg: `Compare ${working[i - 1]} (${toHex(i)}) > ${working[i]} (${toHex(i + 1)}) → swap.`
        });

        [working[i - 1], working[i]] = [working[i], working[i - 1]];

        steps.push({
            data: [...working],
            highlights: { [i]: 'state-swap', [i - 1]: 'state-swap' },
            msg: `Swapped. ${value} is now at address ${toHex(i)}.`
        });

        i--;
    }

    steps.push({
        data: [...working],
        highlights: { [i]: 'state-inserted' },
        msg: `${value} settled at address ${toHex(i + 1)}. Done.`
    });

    return steps;
}

/* ── Insert handler ───────────────────────────────────────────── */

document.getElementById('insertBtn').addEventListener('click', () => {
    const raw = valueInput.value.trim();
    if (raw === '') { valueInput.focus(); return; }
    const val = parseInt(raw, 10);
    if (isNaN(val)) { valueInput.focus(); return; }

    // Guard: grid only holds 64 values
    if (arrayData.length >= GRID_SIZE) {
        setStepMsg(`Grid is full (max ${GRID_SIZE} values).`);
        valueInput.value = '';
        valueInput.focus();
        return;
    }

    valueInput.value = '';
    valueInput.focus();

    if (structure === 'array') {
        const steps = buildInsertSteps(arrayData, val);

        if (!visualiseCheck.checked) {
            // Auto-play animation — shows all steps then commits
            autoPlaySteps(steps);
        } else {
            cancelAutoPlay();
            allSteps    = steps;
            currentStep = 0;
            applyStep(0);
            updateStepButtons();
        }
    }
    // singly / doubly: coming soon
});

/* ── Step navigation ──────────────────────────────────────────── */

function applyStep(idx) {
    if (idx < 0 || idx >= allSteps.length) return;
    const s = allSteps[idx];

    renderGrid(s.data, s.highlights);

    if (idx === allSteps.length - 1) {
        arrayData = [...s.data];
    }

    setStepMsg(s.msg);
}

stepForwardBtn.addEventListener('click', () => {
    if (currentStep < allSteps.length - 1) {
        currentStep++;
        applyStep(currentStep);
        updateStepButtons();
    }
});

stepBackBtn.addEventListener('click', () => {
    if (currentStep > 0) {
        currentStep--;
        applyStep(currentStep);
        updateStepButtons();
    }
});

function updateStepButtons() {
    const active = allSteps.length > 0;
    stepBackBtn.disabled    = !active || currentStep === 0;
    stepForwardBtn.disabled = !active || currentStep >= allSteps.length - 1;
}

/* ── Step-by-step checkbox ────────────────────────────────────── */

visualiseCheck.addEventListener('change', () => {
    cancelAutoPlay();
    stepControls.style.display = visualiseCheck.checked ? 'block' : 'none';
    allSteps    = [];
    currentStep = 0;
    updateStepButtons();
    setStepMsg('');
});

/* ── Structure radio buttons ──────────────────────────────────── */

document.querySelectorAll('input[name="structure"]').forEach(radio => {
    radio.addEventListener('change', () => {
        structure = radio.value;
        clearAll();
    });
});

/* ── Clear button ─────────────────────────────────────────────── */

document.getElementById('clearBtn').addEventListener('click', clearAll);

/* ── Init ─────────────────────────────────────────────────────── */

initGrid();
renderGrid([]);
updateStepButtons();