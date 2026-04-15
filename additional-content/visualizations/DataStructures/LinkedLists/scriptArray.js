/* ── Array Data Structure Helpers ─────────────────────────────── */

const GRID_SIZE = 12 * 6; // 72 cells max

// Build steps for Insertion (with bubbling)
function buildInsertSteps(arr, value) {
    const steps = [];
    const working = [...arr];

    // Step 0: Append at the end
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

// Build steps for Deletion
function buildDeleteSteps(arr, value) {
    const steps = [];
    const working = [...arr];

    let foundIndex = -1;

    // Linear search phase
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

    // Shift elements left
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

// Build steps for Binary Search
function buildBinarySearchSteps(arr, value) {
    const steps = [];
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        steps.push({
            data: [...arr],
            highlights: { [mid]: 'state-comparing' },
            msg: `Check middle at ${toHex(mid + 1)} (value ${arr[mid]}).`
        });

        if (arr[mid] === value) {
            steps.push({
                data: [...arr],
                highlights: { [mid]: 'state-found' },
                msg: `Found ${value} at address ${toHex(mid + 1)}.`
            });
            return steps;
        }

        if (arr[mid] < value) {
            steps.push({
                data: [...arr],
                highlights: { [mid]: 'state-comparing' },
                msg: `${arr[mid]} < ${value} → search right half.`
            });
            left = mid + 1;
        } else {
            steps.push({
                data: [...arr],
                highlights: { [mid]: 'state-comparing' },
                msg: `${arr[mid]} > ${value} → search left half.`
            });
            right = mid - 1;
        }
    }

    steps.push({
        data: [...arr],
        highlights: {},
        msg: `${value} not found in array.`
    });

    return steps;
}

// Export everything (for use in script.js)
window.arrayHelpers = {
    buildInsertSteps,
    buildDeleteSteps,
    buildBinarySearchSteps,
    GRID_SIZE
};