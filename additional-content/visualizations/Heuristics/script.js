const canvas = document.getElementById("plane");
const ctx = canvas.getContext("2d");

const SIZE = 100;          // coordinate limit
const SCALE = canvas.width / (2 * SIZE);

let points = [];

/* -----------------------------
   Coordinate conversion
------------------------------ */
function toCanvas(x, y) {
    return {
        x: canvas.width / 2 + x * SCALE,
        y: canvas.height / 2 - y * SCALE
    };
}

function toWorld(cx, cy) {
    return {
        x: Math.round((cx - canvas.width / 2) / SCALE),
        y: Math.round((canvas.height / 2 - cy) / SCALE)
    };
}

/* -----------------------------
   Drawing
------------------------------ */
function drawAxes() {
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function drawPoints() {
    ctx.fillStyle = "black";

    for (const p of points) {
        const c = toCanvas(p.x, p.y);
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();
    drawPoints();
}

/* -----------------------------
   Interaction
------------------------------ */
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const p = toWorld(cx, cy);

    if (Math.abs(p.x) <= SIZE && Math.abs(p.y) <= SIZE) {
        points.push(p);
        redraw();
    }
});

/* -----------------------------
   Random generation
------------------------------ */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

document.getElementById("generateBtn").addEventListener("click", () => {
    const n = parseInt(document.getElementById("numPoints").value, 10);
    points = [];

    for (let i = 0; i < n; i++) {
        points.push({
            x: randomInt(-SIZE, SIZE),
            y: randomInt(-SIZE, SIZE)
        });
    }

    redraw();
});

document.getElementById("clearBtn").addEventListener("click", () => {
    points = [];
    redraw();
});

/* -----------------------------
   Initial draw
------------------------------ */
redraw();