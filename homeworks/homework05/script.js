// --- 1. STATISTICAL FUNCTIONS ---

// Central Tendency
function mean(arr) {
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function median(arr) {
    return quantile(arr, 0.5);
}

function gmean(arr) {
    // Filter out non-positive numbers for geometric mean
    const positiveArr = arr.filter(x => x > 0);
    if (positiveArr.length === 0) return NaN;
    const logSum = positiveArr.reduce((a, b) => a + Math.log(b), 0);
    return Math.exp(logSum / positiveArr.length);
}

function hmean(arr) {
    // Filter out zeros for harmonic mean
    const nonZeroArr = arr.filter(x => x !== 0);
    if (nonZeroArr.length === 0) return NaN;
    const invSum = nonZeroArr.reduce((a, b) => a + (1 / b), 0);
    return nonZeroArr.length / invSum;
}

function trimMean(arr, percent) {
    const sortedArr = [...arr].sort((a, b) => a - b);
    const removeCount = Math.floor(arr.length * percent);
    const trimmedArr = sortedArr.slice(removeCount, arr.length - removeCount);
    return mean(trimmedArr);
}

function modalBin(arr, numBins = 50, clipPercent = 0.01) {
    const sortedArr = [...arr].sort((a, b) => a - b);
    
    // Clip extremes for stable binning (especially for Cauchy)
    const lowerBound = quantile(sortedArr, clipPercent);
    const upperBound = quantile(sortedArr, 0.99);
    const clippedArr = sortedArr.filter(x => x >= lowerBound && x <= upperBound);

    if (clippedArr.length === 0) return "N/A";
    
    const dataMin = clippedArr[0];
    const dataMax = clippedArr[clippedArr.length - 1];
    const binWidth = (dataMax - dataMin) / numBins;

    if (binWidth === 0) return `${dataMin.toFixed(2)}`;

    const bins = new Array(numBins).fill(0);
    let maxCount = 0;
    let maxBinIndex = 0;

    for (const val of clippedArr) {
        let binIndex = Math.floor((val - dataMin) / binWidth);
        // Handle edge case for the max value
        if (binIndex === numBins) binIndex = numBins - 1;
        
        bins[binIndex]++;
        if (bins[binIndex] > maxCount) {
            maxCount = bins[binIndex];
            maxBinIndex = binIndex;
        }
    }

    const binStart = dataMin + maxBinIndex * binWidth;
    const binEnd = binStart + binWidth;
    return `[${binStart.toFixed(2)}, ${binEnd.toFixed(2)}]`;
}

// Dispersion
function range(arr) {
    const sortedArr = [...arr].sort((a, b) => a - b);
    return sortedArr[sortedArr.length - 1] - sortedArr[0];
}

function quantile(arr, q) {
    const sortedArr = [...arr].sort((a, b) => a - b);
    const pos = (sortedArr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedArr[base + 1] !== undefined) {
        return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
    } else {
        return sortedArr[base];
    }
}

function quartileDeviation(arr) {
    const q1 = quantile(arr, 0.25);
    const q3 = quantile(arr, 0.75);
    return (q3 - q1) / 2;
}

function variance(arr, isSample = false) {
    const m = mean(arr);
    const sumSqDiff = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0);
    const divisor = isSample ? arr.length - 1 : arr.length;
    if (divisor === 0) return NaN;
    return sumSqDiff / divisor;
}

function stdDev(arr, isSample = false) {
    return Math.sqrt(variance(arr, isSample));
}

function meanDeviation(arr) {
    const m = mean(arr);
    const sumAbsDiff = arr.reduce((a, b) => a + Math.abs(b - m), 0);
    return sumAbsDiff / arr.length;
}

// --- 2. DISTRIBUTION GENERATORS ---

// Box-Muller transform for N(0, 1)
function randn() {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function rnorm(n, mu = 0, sigma = 1) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(randn() * sigma + mu);
    return arr;
}

function rexp(n, rate = 1) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        let u = 0;
        while (u === 0) u = Math.random();
        arr.push(-Math.log(u) / rate);
    }
    return arr;
}

function rcauchy(n, loc = 0, scale = 1) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        let u = 0;
        while (u === 0) u = Math.random();
        arr.push(loc + scale * Math.tan(Math.PI * (u - 0.5)));
    }
    return arr;
}

function rlnorm(n, meanlog = 0, sdlog = 1) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(Math.exp(meanlog + sdlog * randn()));
    return arr;
}

// --- 3. HISTOGRAM DRAWING ---

function drawHistogram(canvas, data, numBins = 50, clipPercent = 0.01) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // --- Prep data ---
    const sortedData = [...data].sort((a, b) => a - b);
    
    // Clip extremes for a better visualization (especially for Cauchy)
    // We'll visualize the middle 98% of the data
    const lowerBound = quantile(sortedData, clipPercent);
    const upperBound = quantile(sortedData, 1.0 - clipPercent);
    const clippedData = sortedData.filter(x => x >= lowerBound && x <= upperBound);

    if (clippedData.length === 0) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#666';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No data to display (all values may be extreme outliers).', width / 2, height / 2);
        return;
    }

    const dataMin = clippedData[0];
    const dataMax = clippedData[clippedData.length - 1];
    const binWidth = (dataMax - dataMin) / numBins;

    // --- Create bins ---
    const bins = new Array(numBins).fill(0);
    for (const val of clippedData) {
        let binIndex = Math.floor((val - dataMin) / binWidth);
        if (binIndex === numBins) binIndex = numBins - 1; // Edge case for max value
        bins[binIndex]++;
    }
    
    const maxBinCount = Math.max(...bins);
    
    // --- Drawing ---
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f4f4f4'; // Background
    ctx.fillRect(0, 0, width, height);
    
    const padding = { top: 20, right: 20, bottom: 50, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / numBins;

    // --- Draw bars ---
    for (let i = 0; i < numBins; i++) {
        const barHeight = (bins[i] / maxBinCount) * chartHeight;
        const x = padding.left + i * barWidth;
        const y = padding.top + chartHeight - barHeight;
        
        ctx.fillStyle = 'rgb(79, 70, 229)'; // indigo-600
        ctx.fillRect(x, y, barWidth - 1, barHeight);
    }

    // --- Draw axes ---
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();
    
    // --- Draw labels ---
    ctx.fillStyle = '#333';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // X-axis labels (e.g., 5 labels)
    const numXLabels = 5;
    for (let i = 0; i <= numXLabels; i++) {
        const x = padding.left + (i / numXLabels) * chartWidth;
        const val = dataMin + (i / numXLabels) * (dataMax - dataMin);
        ctx.fillText(val.toFixed(2), x, padding.top + chartHeight + 8);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const numYLabels = 5;
    for (let i = 0; i <= numYLabels; i++) {
        const y = padding.top + (i / numYLabels) * chartHeight;
        const val = maxBinCount * (1 - (i / numYLabels));
        ctx.fillText(Math.round(val), padding.left - 8, y);
    }
    
    // Axis titles
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Value', padding.left + chartWidth / 2, height - padding.bottom / 2 + 10);
    
    ctx.save();
    ctx.translate(padding.left / 2 - 10, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Frequency', 0, 0);
    ctx.restore();
    
    // Show clipped info
    ctx.font = '12px Inter';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText(`Displaying middle ${100 - (clipPercent * 2)}% of data`, width - padding.right, padding.top - 5);
}

// --- 4. MAIN LOGIC ---

function format(val) {
    if (isNaN(val)) return "N/A";
    if (Math.abs(val) > 1e6 || Math.abs(val) < 1e-3 && val !== 0) {
        return val.toExponential(3);
    }
    return val.toFixed(4);
}

function calculateAndDisplayStats(data, distributionType) {
    // Central Tendency
    const m = mean(data);
    const med = median(data);
    const g = gmean(data);
    const h = hmean(data);
    const tm = trimMean(data, 0.2); // 20% trim
    const mb = modalBin(data);

    const centralValues = `
    Arithmetic Mean: ${format(m)}
    Median:          ${format(med)}
    Geometric Mean:  ${format(g)}
    Harmonic Mean:   ${format(h)}
    Trimmed Mean (20%):${format(tm)}
    Modal Bin:       ${mb}
    `.trim();
    document.getElementById('stats-values-central').textContent = centralValues;

    // Dispersion
    const r = range(data);
    const qd = quartileDeviation(data);
    const v = variance(data); // Population variance (N)
    const s = stdDev(data);   // Population std dev (N)
    const md = meanDeviation(data);
    
    const dispersionValues = `
        Range:             ${format(r)}
        Quartile Deviation:${format(qd)}
        Variance (N):      ${format(v)}
        Std. Deviation (N):${format(s)}
        Mean Deviation:    ${format(md)}
            `.trim();
    document.getElementById('stats-values-dispersion').textContent = dispersionValues;

    // Commentary
    let commentary = "";
    switch(distributionType) {
        case "normal":
            commentary = `
            <strong>Central Tendency:</strong> All measures (Mean, Median, Mode) should be very close. The Arithmetic Mean is the best and most efficient estimator.
            <br><br>
            <strong>Dispersion:</strong> Standard Deviation is the standard and most reliable measure of spread.
            `;
            break;
        case "exponential":
            commentary = `
            <strong>Central Tendency:</strong> This distribution is skewed. The Mean is pulled higher than the Median. The Median is a more 'typical' representation. The Geometric and Harmonic means are even lower.
            <br><br>
            <strong>Dispersion:</strong> The Standard Deviation is heavily influenced by the long tail. The Quartile Deviation is a more robust measure of the central spread.
            `;
            break;
        case "lognormal":
            commentary = `
            <strong>Central Tendency:</strong> Strongly skewed. The Arithmetic Mean is highly misleading. The Median or Geometric Mean are the most appropriate measures of central tendency.
            <br><br>
            <strong>Dispersion:</strong> Variance and Standard Deviation are massive and not very useful. Quartile Deviation is the only robust measure here.
            `;
            break;
        case "cauchy":
            commentary = `
            <strong>Central Tendency:</strong> This distribution has no defined mean. The Arithmetic, Geometric, and Harmonic Mean values are COMPLETELY USELESS and unstable.
            <br><strong>Use Median or Trimmed Mean.</strong>
            <br><br>
            <strong>Dispersion:</strong> This distribution has infinite variance. Range, Variance, Standard Deviation, and Mean Deviation are USELESS.
            <br><strong>Use Quartile Deviation.</strong>
            `;
            break;
    }
    document.getElementById('stats-commentary').innerHTML = commentary;
}

function generateData() {
    const distType = document.getElementById('distribution').value;
    const size = parseInt(document.getElementById('sampleSize').value, 10);
    
    if (isNaN(size) || size <= 0) {
        alert("Please enter a valid sample size > 0");
        return;
    }

    let data;
    switch(distType) {
        case 'normal':
            data = rnorm(size, 0, 1);
            break;
        case 'exponential':
            data = rexp(size, 1);
            break;
        case 'lognormal':
            data = rlnorm(size, 0, 1);
            break;
        case 'cauchy':
            data = rcauchy(size, 0, 1);
            break;
    }

    // Draw histogram
    const canvas = document.getElementById('histogramCanvas');
    // Set internal resolution
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    drawHistogram(canvas, data);
    
    // Calculate stats
    calculateAndDisplayStats(data, distType);
}

// --- 5. EVENT LISTENERS ---
document.getElementById('generateBtn').addEventListener('click', generateData);

// Also listen for Enter key in the input field
document.getElementById('sampleSize').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        generateData();
    }
});

// Generate on first load
window.addEventListener('load', () => {
        // Set canvas internal resolution based on its displayed size
    const canvas = document.getElementById('histogramCanvas');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateData();
});

// Redraw on resize (with a debounce to avoid flooding)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const canvas = document.getElementById('histogramCanvas');
        // Check if canvas is still on the page
        if (canvas && canvas.clientWidth > 0) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            // We don't regenerate new data, just redraw with existing logic
            // (which involves regeneration, but that's fast)
            generateData();
        }
    }, 250); // 250ms debounce
});