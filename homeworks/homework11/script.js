// Variable for the chart
let myChart = null;

// --- Box-Muller Transform ---
function boxMullerRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// --- UI Logic ---
function toggleParams() {
    const type = document.getElementById('processType').value;
    const ouParams = document.querySelectorAll('.ou-params');
    ouParams.forEach(el => {
        el.style.display = (type === 'ou') ? 'flex' : 'none';
    });
}

// --- Core Simulation Logic ---
function runSimulation() {
    // Get Inputs
    const type = document.getElementById('processType').value;
    const T = parseFloat(document.getElementById('TInput').value);
    const N = parseInt(document.getElementById('NInput').value);
    const sigma = parseFloat(document.getElementById('sigmaInput').value);
    
    // OU Parameters (if applicable)
    let theta = 0, mu = 0;
    let X_t = 0; 

    if (type === 'ou') {
        theta = parseFloat(document.getElementById('thetaInput').value);
        mu = parseFloat(document.getElementById('muInput').value);
        // Ideally start at mu or keep 0. Let's start at mu to show reversion or 0 to show pull.
        // Standard convention: start at X0 (here simplified to 0 or mu)
        X_t = 0; 
    }

    const dt = T / N;
    let pathData = [{x: 0, y: X_t}];

    // Euler-Maruyama Loop
    for (let i = 0; i < N; i++) {
        // 1. Generate stochastic increment Z ~ N(0,1)
        const Z = boxMullerRandom();
        
        // 2. Calculate Drift (f)
        let drift = 0;
        if (type === 'wiener') {
            drift = 0;
        } else if (type === 'ou') {
            drift = theta * (mu - X_t);
        }

        // 3. Update using Euler-Maruyama: X_new = X + f*dt + g*sqrt(dt)*Z
        // Note: g = sigma
        X_t += drift * dt + sigma * Math.sqrt(dt) * Z;
        
        pathData.push({x: (i + 1) * dt, y: X_t});
    }

    updateChart(pathData, T, type);
    
    // Update text info
    let theoreticalInfo = "";
    if (type === 'wiener') {
        theoreticalInfo = `Theoretically distributed as \( \mathcal{N}(0, ${ (sigma*sigma*T).toFixed(2) }) \)`;
    } else {
        theoreticalInfo = `Mean Reverting towards \(\mu = ${mu}\)`;
    }

    document.getElementById('statsOutput').innerHTML = 
        `Final Value \( X_T = ${X_t.toFixed(4)} \) (${theoreticalInfo})`;
    
    // Retrigger MathJax for the new text
    if (window.MathJax) MathJax.typesetPromise();
}

// --- Chart Management ---
function updateChart(dataPoints, T, type) {
    const ctx = document.getElementById('wienerChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: (type === 'wiener') ? 'Wiener Process W(t)' : 'OU Process X(t)',
                data: dataPoints,
                borderColor: (type === 'wiener') ? '#2980b9' : '#e74c3c', // Blue for Wiener, Red for OU
                borderWidth: 1.5,
                pointRadius: 0,
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Time (t)' },
                    min: 0, max: T
                },
                y: {
                    title: { display: true, text: 'Value X(t)' }
                }
            },
            animation: { duration: 0 },
            plugins: { legend: { display: true } }
        }
    });
}

// Auto-start
window.onload = function() {
    toggleParams(); // Set correct initial visibility
    runSimulation();
};