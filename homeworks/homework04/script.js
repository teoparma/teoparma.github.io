let m, p, maxN;
let trajectories = [];
let plotWidth, plotHeight, histWidth, padding;

// Variables for HTML elements
let inputM, inputP, inputN, startButton;


function setup() {
    let canvas = createCanvas(900, 600);

    padding = 50;
    plotWidth = width * 0.7; 
    histWidth = width * 0.25;
    plotHeight = height - (2 * padding);

    inputM = select('#m_input');
    inputP = select('#p_input');
    inputN = select('#n_input');
    startButton = select('#start_button');

    startButton.mousePressed(startSimulation);

    // Stop p5.js loop. 
    // 'draw()' will be called only when we call 'redraw()'
    noLoop(); 

    // Draw an initial waiting screen
    background(245);
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Choose parameters and click the button to start.", width / 2, height / 2);
}


function startSimulation() {

    m = int(inputM.value());
    p = float(inputP.value());
    maxN = int(inputN.value());

    // Clean old data
    trajectories = [];

    for (let i = 0; i < m; i++) {
        trajectories.push({ successes: 0, history: [] });
    }

    if (maxN <= 0) maxN = 1;

    for (let n = 0; n < maxN; n++) {
        for (let i = 0; i < m; i++) {
        let t = trajectories[i];
        if (random() < p) { 
            t.successes++;
        }
        let freq = t.successes / (n + 1); 
        t.history.push(freq);
        }
    }

    // 3. Ask p5.js to execute 'draw()' JUST ONT TIME
    redraw();
    }

    // --- Executed only when 'redaw()' is called ---
    function draw() {

    if (trajectories.length === 0 || trajectories[0].history.length === 0) {
        return; 
    }

    background(255); 
    translate(padding, padding);

    drawMainPlot();  
    drawHistogram(); 

    drawMidHistogram();

    let y_p = map(p, 0, 1, plotHeight, 0); 
    stroke(255, 0, 0); strokeWeight(2);
    line(0, y_p, plotWidth, y_p); // Line on the main plot

    drawLabels();    
}

// --- Auxiliar functions for the drawing ---

function drawMainPlot() {
    push(); 
    fill(250); stroke(200);
    rect(0, 0, plotWidth, plotHeight);

    strokeWeight(0.5);
    for (let i = 0; i < m; i++) {
        let t = trajectories[i];
        stroke(0, 50, 150, 20); 

        beginShape();
        noFill();
        for (let n = 0; n < t.history.length; n++) {
        let x = map(n, 0, maxN, 0, plotWidth);
        let y = map(t.history[n], 0, 1, plotHeight, 0);
        vertex(x, y);
        }
        endShape();
    }
    pop(); 
}

function drawHistogram() {
    push();
    translate(plotWidth + padding / 2, 0);

    let lastFrequencies = trajectories.map(t => t.history[maxN - 1]);

    let numBins = 50; // how much the histogram is detailed
    let bins = new Array(numBins).fill(0);
    let binWidth = 1.0 / numBins;

    for (let freq of lastFrequencies) {
        let binIndex = floor(freq / binWidth);
        if (binIndex >= numBins) binIndex = numBins - 1; 
        bins[binIndex]++;
    }

    let maxCount = 0;
    for (let count of bins) {
        if (count > maxCount) maxCount = count;
    }

    stroke(100);
    fill(0, 100, 200, 150); 
    let barHeight = plotHeight / numBins; 

    for (let i = 0; i < numBins; i++) {
        let y = map(i, 0, numBins, plotHeight, 0) - barHeight;
        let barWidth = map(bins[i], 0, maxCount, 0, histWidth);
        rect(0, y, barWidth, barHeight);
    }

    let y_p_hist = map(p, 0, 1, plotHeight, 0);
    stroke(255, 0, 0); 
    strokeWeight(2);
    line(0, y_p_hist, histWidth, y_p_hist);

    pop();
    }

    function drawMidHistogram() {
    push();

    let midN_index = floor(maxN / 2);
    if (midN_index >= maxN) midN_index = maxN - 1;
    if (midN_index < 0) midN_index = 0;

    let midFrequencies = trajectories.map(t => t.history[midN_index]);

    // Binning logic (copied from drawHistogram)
    let numBins = 50;
    let bins = new Array(numBins).fill(0);
    let binWidth = 1.0 / numBins;

    for (let freq of midFrequencies) {
        let binIndex = floor(freq / binWidth);
        if (binIndex >= numBins) binIndex = numBins - 1;
        if (binIndex < 0) binIndex = 0;
        bins[binIndex]++;
    }

    let maxCount = 0;
    for (let count of bins) {
        if (count > maxCount) maxCount = count;
    }

    // Drawing logic
    let midHistViewWidth = plotWidth * 0.2; // Max histogram width (ex. 20% of the plot)
    let barHeight = plotHeight / numBins;

    let x_center = map(midN_index, 0, maxN, 0, plotWidth);

    stroke(150, 0, 0, 100);
    fill(255, 0, 0, 70);

    for (let i = 0; i < numBins; i++) {
        let y = map(i, 0, numBins, plotHeight, 0) - barHeight;
        
        let barWidth = map(bins[i], 0, maxCount, 0, midHistViewWidth);
        
        rect(x_center, y, barWidth, barHeight);
    }

    stroke(255, 0, 0, 150);
    strokeWeight(1.5);
    line(x_center, 0, x_center, plotHeight);

    pop();
}
// ------------------------------------------

function drawLabels() {
    push();
    fill(0); 
    noStroke();
    textAlign(CENTER);

    textSize(14);
    text(`Number of rounds (n = ` + maxN + ")", plotWidth / 2, plotHeight + padding / 1.5);

    push();
    translate(-padding / 1.5, plotHeight / 2);
    rotate(-HALF_PI); 
    text("Relative Frequency f(n)", 0, 0);
    pop();

    textAlign(CENTER);
    text("Distribution of f(n)", 
            plotWidth + padding / 2 + histWidth / 2, -padding / 3);

    textAlign(LEFT);
    textSize(12);

    text("0.0", plotWidth + padding / 2, plotHeight + 15);
    text(p.toFixed(1), plotWidth + padding / 2, map(p, 0, 1, plotHeight, 0) + 5);
    text("1.0", plotWidth + padding / 2, 10);

    textAlign(RIGHT);
    text("1.0", -5, 0);
    text(p.toFixed(1), -5, map(p, 0, 1, plotHeight, 0) + 4);
    text("0.0", -5, plotHeight);

    textAlign(CENTER);
    text("0", 0, plotHeight + 15);
    text(floor(maxN/2), map(floor(maxN/2), 0, maxN, 0, plotWidth), plotHeight + 15);
    text(maxN, plotWidth, plotHeight + 15);

    pop();
}