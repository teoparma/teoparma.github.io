// Global chart objects
let pathChart = null;
let histChart = null;

// --- Utility Functions ---
function factorial(k) {
    if (k < 0) return 0;
    let res = 1;
    for (let i = 2; i <= k; i++) res *= i;
    return res;
}

function poissonPMF(k, lambdaT) {
    // P(N=k) = (e^(-λT) * (λT)^k) / k!
    if (k < 0 || !Number.isInteger(k)) return 0;
    return (Math.exp(-lambdaT) * Math.pow(lambdaT, k)) / factorial(k);
}

// --- Simulation Logic ---
function runSingleSimulation(lambda, T, n) {
    const dt = T / n;
    const p = (lambda * T) / n;
    let currentCount = 0;
    let pathData = [{x: 0, y: 0}];

    for (let i = 0; i < n; i++) {
        if (Math.random() < p) {
            currentCount++;
            let time = (i + 1) * dt;
            pathData.push({x: time, y: currentCount});
        }
    }
    pathData.push({x: T, y: currentCount});
    
    return { finalCount: currentCount, path: pathData };
}

function updateSimulation() {
    // 1. Get Inputs
    const lambda = parseFloat(document.getElementById('lambdaInput').value);
    const T = parseFloat(document.getElementById('timeInput').value);
    const n = parseInt(document.getElementById('intervalsInput').value);
    const M = parseInt(document.getElementById('runsInput').value);
    
    // Input validation (simplified)
    if (isNaN(lambda) || isNaN(T) || isNaN(n) || isNaN(M) || lambda <= 0 || T <= 0 || n < 100 || M < 10) {
        alert("Please check inputs: Lambda and T must be > 0. n (intervals) and M (runs) must be reasonable integers.");
        return;
    }

    const mean = lambda * T;
    let finalCounts = [];
    let lastRunPath = [];

    // 2. Run M simulations and collect final counts
    for (let j = 0; j < M; j++) {
        const result = runSingleSimulation(lambda, T, n);
        finalCounts.push(result.finalCount);
        if (j === M - 1) {
            lastRunPath = result.path; // Keep the path of the last run for visualization
        }
    }
    
    // 3. Update Path Chart (N(t))
    plotPath(lastRunPath, mean, T);

    // 4. Update Histogram Chart (N(T) Distribution)
    plotHistogram(finalCounts, mean, M);

    // 5. Update Text Stats
    const avgActual = finalCounts.reduce((a, b) => a + b) / M;
    document.getElementById('stat-theoretical').innerHTML = `Expected Events (\u03BBT): <strong>${mean.toFixed(2)}</strong>`;
    document.getElementById('stat-actual').innerHTML = `Average Simulated N(T): <strong>${avgActual.toFixed(2)}</strong>`;
    document.getElementById('stat-runs').innerHTML = `Runs (M): <strong>${M}</strong>`;
}


// --- Plotting Functions ---

function plotPath(processData, mean, T) {
    if (!pathChart) {
        pathChart = new Chart(document.getElementById('simulationChart').getContext('2d'), {
            type: 'scatter', 
            data: {
                datasets: [
                            {label: 'Simulated Process N(t)', data: [], borderColor: 'rgba(52, 152, 219, 1)', borderWidth: 2, showLine: true, stepped: true, pointRadius: 0},
                            {label: 'Expected Mean (λt)', data: [], borderColor: 'rgba(231, 76, 60, 0.8)', borderWidth: 2, borderDash: [5, 5], showLine: true, pointRadius: 0, fill: false}
                ]
            },
            options: {
                responsive: true, 
                scales: {
                            x: {type: 'linear', position: 'bottom', title: { display: true, text: 'Time (t)' }, min: 0},
                            y: {title: { display: true, text: 'Number of Events N(t)' }, beginAtZero: true, suggestedMax: mean + Math.sqrt(mean) * 3}
                }
            }
        });
    }
    pathChart.data.datasets[0].data = processData;
    pathChart.data.datasets[1].data = [{x: 0, y: 0}, {x: T, y: mean}];
    pathChart.options.scales.x.max = T;
    pathChart.update();
}

function plotHistogram(finalCounts, mean, M) {
    if (histChart) { histChart.destroy(); }

    // 1. Data Aggregation (Empirical Frequency)
    let empiricalCounts = {};
    let maxCount = 0;
    finalCounts.forEach(count => {
        empiricalCounts[count] = (empiricalCounts[count] || 0) + 1;
        if (count > maxCount) maxCount = count;
    });

    // 2. Prepare Labels and Data
    const maxK = Math.max(maxCount + 2, Math.ceil(mean) + 4);
    let labels = [];
    let empiricalProb = []; // Normalized frequencies
    let theoreticalProb = [];

    for (let k = 0; k <= maxK; k++) {
        labels.push(k);
        
        // Empirical: Observed count / Total runs
        empiricalProb.push((empiricalCounts[k] || 0) / M); 
        
        // Theoretical: Poisson PMF
        theoreticalProb.push(poissonPMF(k, mean));
    }

    // 3. Create Histogram Chart
    histChart = new Chart(document.getElementById('histogramChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Empirical Probability (M Runs)',
                    data: empiricalProb,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    yAxisID: 'y'
                },
                {
                    label: 'Theoretical Poisson PMF',
                    data: theoreticalProb,
                    type: 'line',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 3,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {title: { display: true, text: 'Final Count N(T)' }},
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Empirical Probability' },
                    beginAtZero: true
                },
                y1: { // Used for the line (same scale, just better labeling/display)
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Theoretical Probability' },
                    beginAtZero: true
                }
            },
            plugins: { title: { display: true, text: `Poisson Distribution Approximation (\u03BBT = ${mean.toFixed(2)})` } }
        }
    });
}

// Initialize on Load
window.onload = function() {
    initChart();
    updateSimulation();
};