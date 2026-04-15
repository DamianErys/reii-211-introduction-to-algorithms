/* ── Main Script ──────────────────────────────────────────────── */

// State
let structure = 'array';   // 'array' | 'singly' | 'doubly'
let arrayData = [];        // sorted array of numbers

// Step-by-step
let allSteps   = [];       // [{data, highlights, msg}]
let currentStep = 0;

/* ── DOM refs ─────────────────────────────────────────────────── */

const dsDisplay      = document.getElementById('dsDisplay');
const valueInput     = document.getElementById('valueInput');
const visualiseCheck = document.getElementById('visualiseCheck');
const stepControls   = document.getElementById('stepControls');
const stepBackBtn    = document.getElementById('stepBackBtn');
const stepForwardBtn = document.getElementById('stepForwardBtn');
const stepMsg        = document.getElementById('stepMsg');

/* ── Constants ────────────────────────────────────────────────── */

const GRID_COLS = 12;
const GRID_ROWS = 6;
const GRID_SIZE = GRID_COLS * GRID_ROWS;  

/* ── Grid initialiser ─────────────────────────────────────────── */

function initGrid() {
    dsDisplay.innerHTML = '';
    for (let i = 0; i < GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'mem-cell';

        const addr = document.createElement('span');
        addr.className = 'mem-addr';
        addr.textContent = toHex(i + 1);
        cell.appendChild(addr);

        const val = document.createElement('span');
        val.className = 'mem-value';
        val.style.display = 'none';
        cell.appendChild(val);

        dsDisplay.appendChild(cell);
    }
}

/* ── Grid renderer ────────────────────────────────────────────── */

const STATE_CLASSES = ['state-comparing', 'state-swap', 'state-inserted', 'state-found', 'state-deleted'];

function renderGrid(data, highlights = {}) {
    const cells = dsDisplay.children;

    for (let i = 0; i < GRID_SIZE; i++) {
        const cell = cells[i];
        const valEl = cell.querySelector('.mem-value');

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

/* ── Auto-play ────────────────────────────────────────────────── */

let autoPlayTimer = null;
const AUTO_STEP_MS = 75;

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
            arrayData = [...allSteps[currentStep].data];
            allSteps    = [];
            currentStep = 0;
            autoPlayTimer = null;
        }
    }

    autoPlayTimer = setTimeout(advance, AUTO_STEP_MS);
}

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

function updateStepButtons() {
    const active = allSteps.length > 0;
    stepBackBtn.disabled    = !active || currentStep === 0;
    stepForwardBtn.disabled = !active || currentStep >= allSteps.length - 1;
}

function setStepMsg(msg) {
    stepMsg.textContent = msg;
}

/* ── Event Listeners ──────────────────────────────────────────── */

document.getElementById('insertBtn').addEventListener('click', () => {
    const raw = valueInput.value.trim();
    if (raw === '') return valueInput.focus();

    const val = parseInt(raw, 10);
    if (isNaN(val)) return valueInput.focus();

    if (arrayData.length >= GRID_SIZE) {
        setStepMsg(`Grid is full (max ${GRID_SIZE} values).`);
        valueInput.value = '';
        return valueInput.focus();
    }

    valueInput.value = '';
    valueInput.focus();

    if (structure === 'array') {
        const steps = arrayHelpers.buildInsertSteps(arrayData, val);

        if (!visualiseCheck.checked) {
            autoPlaySteps(steps);
        } else {
            cancelAutoPlay();
            allSteps = steps;
            currentStep = 0;
            applyStep(0);
            updateStepButtons();
        }
    }
});

document.getElementById('deleteBtn').addEventListener('click', () => {
    const raw = valueInput.value.trim();
    if (raw === '') return valueInput.focus();

    const val = parseInt(raw, 10);
    if (isNaN(val)) return valueInput.focus();

    valueInput.value = '';
    valueInput.focus();

    if (structure === 'array') {
        const steps = arrayHelpers.buildDeleteSteps(arrayData, val);

        if (!visualiseCheck.checked) {
            autoPlaySteps(steps);
        } else {
            cancelAutoPlay();
            allSteps = steps;
            currentStep = 0;
            applyStep(0);
            updateStepButtons();
        }
    }
});

document.getElementById('searchBtn').addEventListener('click', () => {
    const raw = valueInput.value.trim();
    if (raw === '') return valueInput.focus();

    const val = parseInt(raw, 10);
    if (isNaN(val)) return valueInput.focus();

    valueInput.value = '';
    valueInput.focus();

    if (structure === 'array') {
        const steps = arrayHelpers.buildBinarySearchSteps(arrayData, val);

        if (!visualiseCheck.checked) {
            autoPlaySteps(steps);
        } else {
            cancelAutoPlay();
            allSteps = steps;
            currentStep = 0;
            applyStep(0);
            updateStepButtons();
        }
    }
});

// Step controls
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

visualiseCheck.addEventListener('change', () => {
    cancelAutoPlay();
    stepControls.style.display = visualiseCheck.checked ? 'block' : 'none';
    allSteps = [];
    currentStep = 0;
    updateStepButtons();
    setStepMsg('');
});

document.querySelectorAll('input[name="structure"]').forEach(radio => {
    radio.addEventListener('change', () => {
        structure = radio.value;
        clearAll();
    });
});

valueInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('insertBtn').click();
    }
});

document.getElementById('clearBtn').addEventListener('click', clearAll);

// Clear function
function clearAll() {
    cancelAutoPlay();
    arrayData   = [];
    allSteps    = [];
    currentStep = 0;
    renderGrid([]);
    updateStepButtons();
    setStepMsg('');
}

/* ── Init ─────────────────────────────────────────────────────── */

initGrid();
renderGrid([]);
updateStepButtons();