/* ── State ────────────────────────────────────────────────────── */

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

/* ── Helpers ──────────────────────────────────────────────────── */

function clearAll() {
    arrayData   = [];
    allSteps    = [];
    currentStep = 0;
    renderPlaceholder();
    updateStepButtons();
    setStepMsg('');
}

function renderPlaceholder() {
    dsDisplay.innerHTML = '<span class="ds-placeholder">Choose a structure and insert a value to begin</span>';
}

function setStepMsg(msg) {
    stepMsg.textContent = msg;
}

/* ── Array renderer ───────────────────────────────────────────── */
// data      : number[]
// highlights: { [index]: 'state-comparing' | 'state-swap' | 'state-inserted' }

function renderArray(data, highlights = {}) {
    dsDisplay.innerHTML = '';

    if (data.length === 0) {
        renderPlaceholder();
        return;
    }

    const row = document.createElement('div');
    row.className = 'array-row';

    data.forEach((val, i) => {
        const cell = document.createElement('div');
        cell.className = 'array-cell';
        if (highlights[i]) cell.classList.add(highlights[i]);
        cell.textContent = val;
        row.appendChild(cell);
    });

    dsDisplay.appendChild(row);
}

/* ── Build insert steps (insertion-sort style) ────────────────── */
// Returns an array of step objects, each describing:
//   data[]        — the array at this moment
//   highlights{}  — which indices to colour
//   msg           — description shown in step-msg

function buildInsertSteps(arr, value) {
    const steps = [];
    const working = [...arr];

    // Step 0: show value being appended at the end
    working.push(value);
    const newIdx = working.length - 1;

    steps.push({
        data: [...working],
        highlights: { [newIdx]: 'state-comparing' },
        msg: `Append ${value} at position ${newIdx}. Now bubble it left into sorted position.`
    });

    let i = newIdx;

    // Bubble left while left neighbour is greater
    while (i > 0 && working[i - 1] > working[i]) {
        // highlight the pair being compared
        steps.push({
            data: [...working],
            highlights: { [i]: 'state-comparing', [i - 1]: 'state-comparing' },
            msg: `Compare ${working[i - 1]} > ${working[i]} → swap.`
        });

        // swap
        [working[i - 1], working[i]] = [working[i], working[i - 1]];

        steps.push({
            data: [...working],
            highlights: { [i]: 'state-swap', [i - 1]: 'state-swap' },
            msg: `Swapped. ${value} is now at position ${i - 1}.`
        });

        i--;
    }

    // Final step: value is in place
    steps.push({
        data: [...working],
        highlights: { [i]: 'state-inserted' },
        msg: `${value} is in its sorted position (index ${i}). Done.`
    });

    return steps;
}

/* ── Insert handler ───────────────────────────────────────────── */

document.getElementById('insertBtn').addEventListener('click', () => {
    const raw = valueInput.value.trim();
    if (raw === '') { valueInput.focus(); return; }
    const val = parseInt(raw, 10);
    if (isNaN(val)) { valueInput.focus(); return; }

    valueInput.value = '';
    valueInput.focus();

    if (structure === 'array') {
        const steps = buildInsertSteps(arrayData, val);

        if (!visualiseCheck.checked) {
            // Apply immediately — last step has the final sorted array
            arrayData = steps[steps.length - 1].data;
            renderArray(arrayData);
            allSteps    = [];
            currentStep = 0;
            updateStepButtons();
        } else {
            allSteps    = steps;
            currentStep = 0;
            // Show first step
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

    if (structure === 'array') {
        renderArray(s.data, s.highlights);
    }

    // After the last step commit the result to arrayData
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
    stepControls.style.display = visualiseCheck.checked ? 'block' : 'none';
    // clear any in-progress step sequence
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

renderPlaceholder();
updateStepButtons();