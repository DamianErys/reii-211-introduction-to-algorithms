// Canvas setup
const canvas = document.getElementById('plane');
const ctx = canvas.getContext('2d');

// UI Elements
const numJobsInput = document.getElementById('numJobs');
const timeSpanInput = document.getElementById('timeSpan');
const generateBtn = document.getElementById('generateBtn');
const earliestStartBtn = document.getElementById('earliestStartBtn');
const shortestJobBtn = document.getElementById('shortestJobBtn');
const earliestFinishBtn = document.getElementById('earliestFinishBtn');
const visualiseCheck = document.getElementById('visualiseCheck');
const stepControls = document.getElementById('stepControls');
const stepBackBtn = document.getElementById('stepBackBtn');
const stepForwardBtn = document.getElementById('stepForwardBtn');
const resetBtn = document.getElementById('resetBtn');
const clearBtn = document.getElementById('clearBtn');
const distanceLabel = document.getElementById('distanceLabel');
const coordDisplay = document.getElementById('coordDisplay');

// State
let jobs = [];
let selectedJobs = [];
let currentAlgorithm = null;
let visualizationSteps = [];
let currentStep = 0;
let isStepMode = false;

// Job structure: { id, start, end, duration }

// Canvas drawing constants
const PADDING = 50;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const DRAW_WIDTH = CANVAS_WIDTH - 2 * PADDING;
const DRAW_HEIGHT = CANVAS_HEIGHT - 2 * PADDING;

// Initialize
function init() {
    setupEventListeners();
    drawEmptyCanvas();
}

// Event Listeners
function setupEventListeners() {
    generateBtn.addEventListener('click', generateJobs);
    earliestStartBtn.addEventListener('click', () => runAlgorithm('earliestStart'));
    shortestJobBtn.addEventListener('click', () => runAlgorithm('shortestJob'));
    earliestFinishBtn.addEventListener('click', () => runAlgorithm('earliestFinish'));
    visualiseCheck.addEventListener('change', toggleStepMode);
    stepBackBtn.addEventListener('click', stepBack);
    stepForwardBtn.addEventListener('click', stepForward);
    resetBtn.addEventListener('click', resetSelection);
    clearBtn.addEventListener('click', clearAll);
}

// Toggle step-by-step mode
function toggleStepMode() {
    isStepMode = visualiseCheck.checked;
    stepControls.style.display = isStepMode ? 'flex' : 'none';
    
    if (!isStepMode) {
        // If turning off step mode, show final result
        if (visualizationSteps.length > 0) {
            currentStep = visualizationSteps.length - 1;
            drawVisualizationStep();
        }
    }
}

// Generate random jobs with random positioning
function generateJobs() {
    const numJobs = parseInt(numJobsInput.value);
    const timeSpan = parseInt(timeSpanInput.value);
    
    jobs = [];
    
    // Create jobs with completely random start times and durations
    for (let i = 0; i < numJobs; i++) {
        const start = Math.floor(Math.random() * (timeSpan - 1));
        const maxDuration = Math.min(timeSpan - start, Math.floor(timeSpan / 2)); // Max half the timespan
        const duration = Math.floor(Math.random() * (maxDuration - 1)) + 1;
        const end = start + duration;
        
        jobs.push({
            id: i + 1,
            start: start,
            end: end,
            duration: duration,
            row: -1 // Will be assigned later
        });
    }
    
    // Shuffle jobs to randomize order
    jobs.sort(() => Math.random() - 0.5);
    
    // Assign rows based on which jobs can fit together
    assignRowsToJobs();
    
    selectedJobs = [];
    visualizationSteps = [];
    currentStep = 0;
    currentAlgorithm = null;
    
    // Remove selected class from buttons
    document.querySelectorAll('.algo-btn').forEach(btn => btn.classList.remove('selected'));
    
    updateDisplay();
    drawJobs();
}

// Assign rows to jobs so multiple jobs can be on the same row if they don't overlap
function assignRowsToJobs() {
    // Sort jobs by start time first
    jobs.sort((a, b) => a.start - b.start);
    
    const rows = [];
    
    jobs.forEach(job => {
        // Try to find a row where this job fits
        let placed = false;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // Check if this job can fit in this row (doesn't overlap with any job in the row)
            const canFit = row.every(existingJob => 
                job.start >= existingJob.end || job.end <= existingJob.start
            );
            
            if (canFit) {
                row.push(job);
                job.row = i;
                placed = true;
                break;
            }
        }
        
        // If no row fits, create a new row
        if (!placed) {
            rows.push([job]);
            job.row = rows.length - 1;
        }
    });
    
    // Re-shuffle the job IDs to make them truly random
    const shuffledIds = jobs.map((_, i) => i + 1).sort(() => Math.random() - 0.5);
    jobs.forEach((job, i) => {
        job.id = shuffledIds[i];
    });
}

// Draw empty canvas with axes
function drawEmptyCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    
    // X-axis (time)
    ctx.beginPath();
    ctx.moveTo(PADDING, CANVAS_HEIGHT - PADDING);
    ctx.lineTo(CANVAS_WIDTH - PADDING, CANVAS_HEIGHT - PADDING);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING);
    ctx.lineTo(PADDING, CANVAS_HEIGHT - PADDING);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time (months)', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
    
    ctx.save();
    ctx.translate(15, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Film Jobs', 0, 0);
    ctx.restore();
}

// Draw all jobs
function drawJobs() {
    if (jobs.length === 0) {
        drawEmptyCanvas();
        return;
    }
    
    drawEmptyCanvas();
    
    const timeSpan = parseInt(timeSpanInput.value);
    const barHeight = 20;
    const spacing = 5;
    const totalBarsHeight = jobs.length * (barHeight + spacing);
    const startY = (CANVAS_HEIGHT - totalBarsHeight) / 2;
    
    jobs.forEach((job, index) => {
        const y = startY + index * (barHeight + spacing);
        drawJob(job, y, barHeight, timeSpan, 'gray');
    });
}

// Draw a single job bar
function drawJob(job, y, height, timeSpan, color) {
    const x = PADDING + (job.start / timeSpan) * DRAW_WIDTH;
    const width = ((job.end - job.start) / timeSpan) * DRAW_WIDTH;
    
    // Draw bar
    ctx.fillStyle = color === 'gray' ? '#9ca3af' : 
                     color === 'green' ? '#10b981' : 
                     color === 'red' ? '#ef4444' : color;
    ctx.fillRect(x, y, width, height);
    
    // Draw border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    
    // Draw job label
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Job ${job.id}`, x + width / 2, y + height / 2);
}

// Run selected algorithm
function runAlgorithm(algorithm) {
    if (jobs.length === 0) {
        generateJobs();
    }
    
    currentAlgorithm = algorithm;
    
    // Update button states
    document.querySelectorAll('.algo-btn').forEach(btn => btn.classList.remove('selected'));
    if (algorithm === 'earliestStart') earliestStartBtn.classList.add('selected');
    if (algorithm === 'shortestJob') shortestJobBtn.classList.add('selected');
    if (algorithm === 'earliestFinish') earliestFinishBtn.classList.add('selected');
    
    // Run the algorithm
    if (algorithm === 'earliestStart') {
        runEarliestStart();
    } else if (algorithm === 'shortestJob') {
        runShortestJob();
    } else if (algorithm === 'earliestFinish') {
        runEarliestFinish();
    }
    
    if (isStepMode) {
        currentStep = 0;
        drawVisualizationStep();
    } else {
        currentStep = visualizationSteps.length - 1;
        drawVisualizationStep();
    }
}

// Algorithm: Earliest Start Time First
function runEarliestStart() {
    visualizationSteps = [];
    selectedJobs = [];
    
    const sortedJobs = [...jobs].sort((a, b) => a.start - b.start);
    let lastEnd = -1;
    
    visualizationSteps.push({ selected: [], considering: null, rejected: [] });
    
    sortedJobs.forEach(job => {
        if (job.start >= lastEnd) {
            selectedJobs.push(job);
            lastEnd = job.end;
            visualizationSteps.push({ 
                selected: [...selectedJobs], 
                considering: job, 
                rejected: sortedJobs.filter(j => !selectedJobs.includes(j) && sortedJobs.indexOf(j) <= sortedJobs.indexOf(job))
            });
        } else {
            visualizationSteps.push({ 
                selected: [...selectedJobs], 
                considering: job, 
                rejected: sortedJobs.filter(j => !selectedJobs.includes(j) && sortedJobs.indexOf(j) <= sortedJobs.indexOf(job))
            });
        }
    });
    
    updateDisplay();
}

// Algorithm: Shortest Job First
function runShortestJob() {
    visualizationSteps = [];
    selectedJobs = [];
    
    const sortedJobs = [...jobs].sort((a, b) => a.duration - b.duration);
    let lastEnd = -1;
    
    visualizationSteps.push({ selected: [], considering: null, rejected: [] });
    
    sortedJobs.forEach(job => {
        if (job.start >= lastEnd) {
            selectedJobs.push(job);
            lastEnd = job.end;
            visualizationSteps.push({ 
                selected: [...selectedJobs], 
                considering: job, 
                rejected: sortedJobs.filter(j => !selectedJobs.includes(j) && sortedJobs.indexOf(j) <= sortedJobs.indexOf(job))
            });
        } else {
            visualizationSteps.push({ 
                selected: [...selectedJobs], 
                considering: job, 
                rejected: sortedJobs.filter(j => !selectedJobs.includes(j) && sortedJobs.indexOf(j) <= sortedJobs.indexOf(job))
            });
        }
    });
    
    updateDisplay();
}

// Algorithm: Earliest Finish Time First (Optimal)
function runEarliestFinish() {
    visualizationSteps = [];
    selectedJobs = [];
    
    const sortedJobs = [...jobs].sort((a, b) => a.end - b.end);
    let lastEnd = -1;
    
    visualizationSteps.push({ selected: [], considering: null, rejected: [] });
    
    sortedJobs.forEach(job => {
        if (job.start >= lastEnd) {
            selectedJobs.push(job);
            lastEnd = job.end;
            visualizationSteps.push({ 
                selected: [...selectedJobs], 
                considering: job, 
                rejected: sortedJobs.filter(j => !selectedJobs.includes(j) && sortedJobs.indexOf(j) <= sortedJobs.indexOf(job))
            });
        } else {
            visualizationSteps.push({ 
                selected: [...selectedJobs], 
                considering: job, 
                rejected: sortedJobs.filter(j => !selectedJobs.includes(j) && sortedJobs.indexOf(j) <= sortedJobs.indexOf(job))
            });
        }
    });
    
    updateDisplay();
}

// Draw visualization step
function drawVisualizationStep() {
    if (visualizationSteps.length === 0 || currentStep < 0) return;
    
    const step = visualizationSteps[currentStep];
    drawEmptyCanvas();
    
    const timeSpan = parseInt(timeSpanInput.value);
    const barHeight = 20;
    const spacing = 5;
    const totalBarsHeight = jobs.length * (barHeight + spacing);
    const startY = (CANVAS_HEIGHT - totalBarsHeight) / 2;
    
    jobs.forEach((job, index) => {
        const y = startY + index * (barHeight + spacing);
        let color = 'gray';
        
        if (step.selected.includes(job)) {
            color = 'green';
        } else if (step.rejected.includes(job)) {
            color = 'red';
        } else if (step.considering === job) {
            color = '#fbbf24'; // Yellow for considering
        }
        
        drawJob(job, y, barHeight, timeSpan, color);
    });
    
    updateDisplay();
}

// Step forward
function stepForward() {
    if (currentStep < visualizationSteps.length - 1) {
        currentStep++;
        drawVisualizationStep();
    }
}

// Step back
function stepBack() {
    if (currentStep > 0) {
        currentStep--;
        drawVisualizationStep();
    }
}

// Reset selection
function resetSelection() {
    selectedJobs = [];
    visualizationSteps = [];
    currentStep = 0;
    currentAlgorithm = null;
    
    document.querySelectorAll('.algo-btn').forEach(btn => btn.classList.remove('selected'));
    
    updateDisplay();
    drawJobs();
}

// Clear all
function clearAll() {
    jobs = [];
    selectedJobs = [];
    visualizationSteps = [];
    currentStep = 0;
    currentAlgorithm = null;
    
    document.querySelectorAll('.algo-btn').forEach(btn => btn.classList.remove('selected'));
    
    updateDisplay();
    drawEmptyCanvas();
}

// Update display
function updateDisplay() {
    distanceLabel.textContent = `Jobs Selected: ${selectedJobs.length}`;
    
    if (jobs.length === 0) {
        coordDisplay.textContent = 'Click "Generate Jobs" to start';
    } else if (currentAlgorithm === null) {
        coordDisplay.textContent = `${jobs.length} jobs generated. Select a heuristic to solve.`;
    } else {
        const algoName = currentAlgorithm === 'earliestStart' ? 'Earliest Start' :
                        currentAlgorithm === 'shortestJob' ? 'Shortest Job' :
                        'Earliest Finish';
        coordDisplay.textContent = `Algorithm: ${algoName}\nStep ${currentStep + 1}/${visualizationSteps.length}`;
    }
}

// Start the application
init();