/**
 * Mazes.js  –  main entry point
 *
 * Maze generation: Recursive Backtracker (DFS carve)
 *   – Creates a perfect maze (exactly one path between any two cells)
 *   – Iterative stack-based implementation (no call-stack overflow on large grids)
 *
 * Planned solvers (not wired yet):
 *   DFS.js   –  depth-first search
 *   BFS.js   –  breadth-first search
 */

// ─────────────────────────────────────────────
//  Canvas setup
// ─────────────────────────────────────────────
const canvas = document.getElementById("mazeCanvas");
const ctx    = canvas.getContext("2d");

// The canvas fills the remaining horizontal space.
// We size it once and reuse; cells are drawn to fit.
const MAX_CANVAS_W = Math.max(400, window.innerWidth - 340);  // leave room for controls
const MAX_CANVAS_H = Math.min(window.innerHeight - 180, 700);

// ─────────────────────────────────────────────
//  Cell constants
// ─────────────────────────────────────────────
const CELL = {
    WALL:     0,
    PATH:     1,
    START:    2,
    END:      3,
    VISITED:  4,
    SOLUTION: 5,
};

const COLOUR = {
    [CELL.WALL]:     "#1f2937",
    [CELL.PATH]:     "#ffffff",
    [CELL.START]:    "#22c55e",
    [CELL.END]:      "#ef4444",
    [CELL.VISITED]:  "#93c5fd",
    [CELL.SOLUTION]: "#f59e0b",
};

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
let numRows = 51;
let numCols = 151;
let grid    = [];        // grid[row][col] = CELL.*
let allSteps    = [];
let currentStep = 0;

// ─────────────────────────────────────────────
//  Canvas sizing
// ─────────────────────────────────────────────
function resizeCanvas() {
    // Cell pixel size: fit both dimensions, use the smaller
    const cellW = Math.floor(MAX_CANVAS_W / numCols);
    const cellH = Math.floor(MAX_CANVAS_H / numRows);
    const cs    = Math.max(1, Math.min(cellW, cellH));

    canvas.width  = cs * numCols;
    canvas.height = cs * numRows;
}

function cellSize() {
    return canvas.width / numCols;   // always square cells after resizeCanvas
}

// ─────────────────────────────────────────────
//  Grid init
// ─────────────────────────────────────────────
function initGrid(rows, cols) {
    numRows = rows;
    numCols = cols;
    grid = [];
    for (let r = 0; r < rows; r++) {
        grid.push(new Array(cols).fill(CELL.WALL));
    }
}

// ─────────────────────────────────────────────
//  Maze generation – Recursive Backtracker
//
//  The maze is built on a "cell grid" where:
//    • Odd row/col positions are passage cells
//    • Even row/col positions are walls between them
//
//  We carve passages by removing the wall between two
//  adjacent passage cells.
// ─────────────────────────────────────────────
function generateMaze(rows, cols) {
    initGrid(rows, cols);

    // Directions: [dRow, dCol] in passage-cell space (step of 2 in grid space)
    const DIRS = [
        [-2, 0],   // up
        [ 2, 0],   // down
        [ 0,-2],   // left
        [ 0, 2],   // right
    ];

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Start carving from (1, 1) — first interior passage cell
    const startR = 1, startC = 1;
    grid[startR][startC] = CELL.PATH;

    // Iterative DFS stack: each entry is {r, c}
    const stack = [{ r: startR, c: startC }];

    while (stack.length > 0) {
        const { r, c } = stack[stack.length - 1];

        // Find unvisited neighbours (2 steps away)
        const neighbours = shuffle(DIRS.map(([dr, dc]) => ({
            nr: r + dr,
            nc: c + dc,
            wr: r + dr / 2,   // wall between current and neighbour
            wc: c + dc / 2,
        }))).filter(({ nr, nc }) =>
            nr > 0 && nr < rows - 1 &&
            nc > 0 && nc < cols - 1 &&
            grid[nr][nc] === CELL.WALL
        );

        if (neighbours.length > 0) {
            // Pick the first (already shuffled) unvisited neighbour
            const { nr, nc, wr, wc } = neighbours[0];
            // Carve through the wall
            grid[wr][wc] = CELL.PATH;
            grid[nr][nc] = CELL.PATH;
            stack.push({ r: nr, c: nc });
        } else {
            stack.pop();  // backtrack
        }
    }

    // Place Start top-left, End bottom-right (on passage cells)
    grid[1][1]               = CELL.START;
    grid[rows - 2][cols - 2] = CELL.END;
}

// ─────────────────────────────────────────────
//  Rendering
// ─────────────────────────────────────────────
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cs = cellSize();

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            ctx.fillStyle = COLOUR[grid[r][c]] ?? "#ffffff";
            ctx.fillRect(Math.floor(c * cs), Math.floor(r * cs),
                         Math.ceil(cs), Math.ceil(cs));
        }
    }

    // Grid lines only if cells are big enough
    if (cs >= 8) {
        ctx.strokeStyle = "rgba(0,0,0,0.07)";
        ctx.lineWidth   = 0.5;
        for (let r = 0; r <= numRows; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * cs);
            ctx.lineTo(canvas.width, r * cs);
            ctx.stroke();
        }
        for (let c = 0; c <= numCols; c++) {
            ctx.beginPath();
            ctx.moveTo(c * cs, 0);
            ctx.lineTo(c * cs, canvas.height);
            ctx.stroke();
        }
    }
}

function redraw() {
    drawGrid();
    updateStepUI();
}

// ─────────────────────────────────────────────
//  Step-by-step UI
// ─────────────────────────────────────────────
function updateStepUI() {
    const isStepMode = document.getElementById("visualiseCheck").checked;
    const pill       = document.getElementById("stepPill");
    const backBtn    = document.getElementById("stepBackBtn");
    const fwdBtn     = document.getElementById("stepForwardBtn");

    if (!isStepMode || allSteps.length === 0) {
        pill.style.display = "none";
        backBtn.disabled   = true;
        fwdBtn.disabled    = true;
        return;
    }

    pill.style.display  = "block";
    pill.textContent    = `Step ${currentStep} / ${allSteps.length}`;
    backBtn.disabled    = currentStep <= 0;
    fwdBtn.disabled     = currentStep >= allSteps.length;
}

function applyStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= allSteps.length) return;
    grid = allSteps[stepIndex].map(row => [...row]);
    redraw();
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function forceOdd(val, min, max) {
    let v = Math.max(min, Math.min(max, val));
    if (v % 2 === 0) v++;
    return v;
}

// ─────────────────────────────────────────────
//  Button wiring
// ─────────────────────────────────────────────
document.getElementById("generateBtn").addEventListener("click", () => {
    const rawRows = parseInt(document.getElementById("gridRows").value, 10);
    const rawCols = parseInt(document.getElementById("gridCols").value, 10);

    const rows = forceOdd(rawRows, 5, 201);
    const cols = forceOdd(rawCols, 5, 401);

    document.getElementById("gridRows").value = rows;
    document.getElementById("gridCols").value = cols;

    allSteps    = [];
    currentStep = 0;

    generateMaze(rows, cols);
    resizeCanvas();
    redraw();
});

document.getElementById("clearBtn").addEventListener("click", () => {
    allSteps    = [];
    currentStep = 0;
    initGrid(numRows, numCols);
    resizeCanvas();
    redraw();
});

document.getElementById("solveBtn").addEventListener("click", () => {
    const algo = document.querySelector("input[name='algorithm']:checked")?.value;
    // TODO: wire DFS.js / BFS.js solvers here
    console.log(`Solve with ${algo} — not yet implemented`);
});

document.getElementById("stepBackBtn").addEventListener("click", () => {
    if (currentStep > 0) {
        currentStep--;
        applyStep(currentStep);
    }
});

document.getElementById("stepForwardBtn").addEventListener("click", () => {
    if (currentStep < allSteps.length) {
        currentStep++;
        applyStep(currentStep - 1);
    }
});

document.getElementById("visualiseCheck").addEventListener("change", (e) => {
    const stepControls = document.getElementById("stepControls");
    stepControls.style.display = e.target.checked ? "flex" : "none";
    if (!e.target.checked) {
        allSteps    = [];
        currentStep = 0;
    }
    updateStepUI();
});

document.querySelectorAll("input[name='algorithm']").forEach(radio => {
    radio.addEventListener("change", () => {
        document.querySelectorAll(".radio-option").forEach(el => el.classList.remove("selected"));
        radio.closest(".radio-option").classList.add("selected");
    });
});

// ─────────────────────────────────────────────
//  Boot – generate a default maze on load
// ─────────────────────────────────────────────
(function init() {
    document.getElementById("stepControls").style.display = "none";
    document.getElementById("stepBackBtn").disabled       = true;
    document.getElementById("stepForwardBtn").disabled    = true;

    generateMaze(numRows, numCols);
    resizeCanvas();
    redraw();
})();