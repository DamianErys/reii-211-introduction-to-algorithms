/* ── scriptarray.js ───────────────────────────────────────────────── */

// Array-specific step builders (moved from main file)

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

function buildDeleteSteps(arr, value) {
    const steps = [];
    const working = [...arr];

    let foundIndex = -1;

    // Linear search
    for (let i = 0; i < working.length; i++) {
        steps.push({
            data: [...working],
            highlights: { [i]: 'state-comparing' },
            msg: `Checking address ${toHex(i + 1)} for ${value}.`
        });

        if (working[i] === value) {
            foundIndex = i;
            steps.push({
                data: [...working],
                highlights: { [i]: 'state-found' },
                msg: `Found ${value} at address ${toHex(i + 1)}.`
            });
            break;
        }
    }

    if (foundIndex === -1) {
        steps.push({
            data: [...working],
            highlights: {},
            msg: `${value} not found. No deletion performed.`
        });
        return steps;
    }

    // Shift left
    for (let i = foundIndex; i < working.length - 1; i++) {
        steps.push({
            data: [...working],
            highlights: { [i]: 'state-comparing', [i + 1]: 'state-comparing' },
            msg: `Move ${working[i + 1]} from ${toHex(i + 2)} → ${toHex(i + 1)}.`
        });

        working[i] = working[i + 1];

        steps.push({
            data: [...working],
            highlights: { [i]: 'state-swap' },
            msg: `Copied into position ${toHex(i + 1)}.`
        });
    }

    // Remove last element
    const lastIdx = working.length - 1;
    steps.push({
        data: [...working],
        highlights: { [lastIdx]: 'state-deleted' },
        msg: `Clearing last duplicate at ${toHex(lastIdx + 1)}.`
    });

    working.pop();

    steps.push({
        data: [...working],
        highlights: {},
        msg: `Deletion complete.`
    });

    return steps;
}

// ── Attach Array-specific handlers ────────────────────────────────

function setupArrayHandlers() {
    const insertBtn = document.getElementById('insertBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    insertBtn.addEventListener('click', () => {
        const raw = valueInput.value.trim();
        if (raw === '') return valueInput.focus();

        const val = parseInt(raw, 10);
        if (isNaN(val)) return valueInput.focus();

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

    deleteBtn.addEventListener('click', () => {
        const raw = valueInput.value.trim();
        if (raw === '') return valueInput.focus();

        const val = parseInt(raw, 10);
        if (isNaN(val)) return valueInput.focus();

        valueInput.value = '';
        valueInput.focus();

        if (structure === 'array') {
            const steps = buildDeleteSteps(arrayData, val);

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
}

// Initialize array handlers
setupArrayHandlers();


function buildSearchSteps(arr, value) {
    const steps = [];
    let found = false;

    for (let i = 0; i < arr.length; i++) {
        steps.push({
            data: [...arr],
            highlights: { [i]: 'state-comparing' },
            msg: `Searching: checking address ${toHex(i + 1)}...`
        });

        if (arr[i] === value) {
            steps.push({
                data: [...arr],
                highlights: { [i]: 'state-found' },
                msg: `Match found at address ${toHex(i + 1)}!`
            });
            found = true;
            break;
        }
    }

    if (!found) {
        steps.push({
            data: [...arr],
            highlights: {},
            msg: `${value} not found in the array.`
        });
    }
    return steps;
}

// Register the handlers globally so script.js can see them
window.currentInsertHandlerForStructure = (val) => {
    if (structure !== 'array') return;
    const steps = buildInsertSteps(arrayData, val);
    executeSteps(steps);
};

window.currentDeleteHandlerForStructure = (val) => {
    if (structure !== 'array') return;
    const steps = buildDeleteSteps(arrayData, val);
    executeSteps(steps);
};

window.currentSearchHandlerForStructure = (val) => {
    if (structure !== 'array') return;
    const steps = buildSearchSteps(arrayData, val);
    executeSteps(steps);
};

function executeSteps(steps) {
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