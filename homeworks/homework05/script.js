// --- 1. FUNZIONI STATISTICHE (MEDIE) ---

function mean(arr) {
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function median(arr) {
    const sortedArr = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sortedArr.length / 2);
    return sortedArr.length % 2 === 0
        ? (sortedArr[mid - 1] + sortedArr[mid]) / 2
        : sortedArr[mid];
}

function gmean(arr) {
    // Filtra solo valori positivi per evitare log(0) o log(-)
    const positiveArr = arr.filter(d => d > 0);
    if (positiveArr.length === 0) return NaN;
    const logSum = positiveArr.reduce((a, b) => a + Math.log(b), 0);
    return Math.exp(logSum / positiveArr.length);
}

function hmean(arr) {
    // Filtra solo valori non-zero
    const nonZeroArr = arr.filter(d => d !== 0);
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

// --- 2. FUNZIONI GENERATRICI (DISTRIBUZIONI) ---

// Generatore Normale Standard (Box-Muller)
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
    for (let i = 0; i < n; i++) {
        arr.push(Math.exp(meanlog + sdlog * randn()));
    }
    return arr;
}

// --- 3. LOGICA DI DISEGNO (CANVAS) ---

/**
 * Disegna un istogramma sul canvas
 * @param {number[]} data - L'array di dati
 * @param {string} title - Titolo del grafico
 * @param {string} distType - Tipo di distribuzione (per clipping)
 */
function drawHistogram(data, title, distType) {
    const canvas = document.getElementById('histogram-canvas');
    const ctx = canvas.getContext('2d');
    
    // Imposta la dimensione del canvas alla sua dimensione CSS
    // Questo è cruciale per la responsività e per evitare sfocature
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const width = canvas.width;
    const height = canvas.height;
    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    ctx.clearRect(0, 0, width, height);

    // --- Binning dei dati ---

    // Per distribuzioni con code pesanti (Cauchy, LogNorm, Exp)
    // tagliamo i valori estremi per una visualizzazione leggibile.
    const sortedData = [...data].sort((a, b) => a - b);
    let minVal, maxVal;

    if (distType === 'cauchy') {
        // Mostra il 98% centrale dei dati
        minVal = sortedData[Math.floor(data.length * 0.01)];
        maxVal = sortedData[Math.floor(data.length * 0.99)];
    } else if (distType === 'lognormal' || distType === 'exponential') {
        // Mostra dal 0 al 99%
        minVal = sortedData[0];
        maxVal = sortedData[Math.floor(data.length * 0.99)];
    } else {
        // Normale: mostra tutto
        minVal = sortedData[0];
        maxVal = sortedData[sortedData.length - 1];
    }
    
    // Evita divisione per zero se tutti i dati sono uguali
    if (minVal === maxVal) maxVal += 1; 

    const numBins = 50;
    const binWidth = (maxVal - minVal) / numBins;
    const bins = new Array(numBins).fill(0);
    
    let clippedCount = 0;
    for (const val of data) {
        if (val >= minVal && val <= maxVal) {
            const binIndex = Math.floor((val - minVal) / binWidth);
            // L'ultimo bin include il maxVal
            const index = Math.min(binIndex, numBins - 1); 
            bins[index]++;
        } else {
            clippedCount++;
        }
    }

    const maxBinCount = Math.max(...bins);
    
    // --- Disegna Assi e Titolo ---
    ctx.fillStyle = '#374151'; // text-gray-700
    ctx.strokeStyle = '#D1D5DB'; // border-gray-300
    ctx.lineWidth = 1;

    // Titolo
    ctx.font = '16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, margin.top / 2 + 5);
    if (clippedCount > 0) {
            ctx.font = '12px Inter';
            ctx.fillStyle = '#9CA3AF'; // text-gray-400
            ctx.fillText(`(mostra ${numBins} bin tra ${minVal.toFixed(2)} e ${maxVal.toFixed(2)}, ${clippedCount} outlier nascosti)`, width / 2, margin.top / 2 + 25);
    }

    // Asse Y
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // Asse X
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();
    
    // Labels Assi
    ctx.font = '12px Inter';
    ctx.fillStyle = '#6B7280'; // text-gray-500
    ctx.textAlign = 'right';
    ctx.fillText(maxBinCount, margin.left - 8, margin.top + 5);
    ctx.fillText('0', margin.left - 8, height - margin.bottom);
    
    ctx.textAlign = 'center';
    ctx.fillText(minVal.toFixed(2), margin.left, height - margin.bottom + 15);
    ctx.fillText(maxVal.toFixed(2), width - margin.right, height - margin.bottom + 15);

    // --- Disegna Barre Istogramma ---
    ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'; // bg-blue-600 con opacità
    ctx.strokeStyle = 'rgba(30, 64, 175, 0.8)'; // blue-800
    
    const barWidthPx = plotWidth / numBins;

    for (let i = 0; i < numBins; i++) {
        const barHeight = (bins[i] / maxBinCount) * plotHeight;
        if (barHeight <= 0) continue;

        const x = margin.left + i * barWidthPx;
        const y = height - margin.bottom - barHeight;
        
        ctx.fillRect(x, y, barWidthPx, barHeight);
        ctx.strokeRect(x, y, barWidthPx, barHeight);
    }
}

// --- 4. LOGICA DI CONTROLLO (UI) ---

function calculateAndDisplayStats(data, distType) {
    const statsOutput = document.getElementById('stats-output');
    
    // Calcola tutte le medie
    const m = mean(data);
    const med = median(data);
    const g = gmean(data); // Restituisce NaN se ci sono dati <= 0
    const h = hmean(data); // Restituisce NaN se ci sono dati == 0
    const tm10 = trimMean(data, 0.1); // Troncata al 10%
    
    // Helper per formattare (gestisce NaN)
    const format = (val) => isNaN(val) ? "N/A" : val.toFixed(4);

    let results = `Campioni (n): ${data.length}\n\n`;

    switch (distType) {
        case 'normal':
            results += `Media Aritmetica: ${format(m)} (robusta)\n`;
            results += `Mediana:           ${format(med)} (robusta)\n`;
            results += `Media Geometrica: ${format(g)} (N/A se dati < 0)\n`;
            results += `Media Armonica:   ${format(h)} (N/A se dati == 0)\n`;
            results += `Media Troncata 10%: ${format(tm10)} (robusta)\n`;
            results += `\n(Nota: Media, Mediana e Troncata sono molto simili)`;
            break;
        case 'exponential':
            // Tutti i dati sono > 0, quindi gmean e hmean sono valide
            results += `Media Aritmetica: ${format(m)} (sensibile agli outlier)\n`;
            results += `Mediana:           ${format(med)} (più robusta)\n`;
            results += `Media Geometrica: ${format(g)} (robusta)\n`;
            results += `Media Armonica:   ${format(h)} (robusta)\n`;
            results += `Media Troncata 10%: ${format(tm10)} (più robusta)\n`;
            results += `\n(Nota: Hmean < Gmean < Amean. Mediana è un buon indicatore)`;
            break;
        case 'lognormal':
                // Tutti i dati sono > 0
            results += `Media Aritmetica: ${format(m)} (MOLTO sensibile!)\n`;
            results += `Mediana:           ${format(med)} (misura migliore)\n`;
            results += `Media Geometrica: ${format(g)} (misura migliore)\n`;
            results += `Media Armonica:   ${format(h)}\n`;
            results += `Media Troncata 10%: ${format(tm10)} (più robusta della media)\n`;
            results += `\n(Nota: Mediana e Geometrica sono le più indicate)`;
            break;
        case 'cauchy':
            // I dati includono valori negativi, quindi gmean è N/A
            const tm20 = trimMean(data, 0.2); // Troncata specifica per Cauchy
            results += `Media Aritmetica: ${format(m)} (INUTILE, instabile!)\n`;
            results += `Mediana:           ${format(med)} (ROBUSTA)\n`;
            results += `Media Geometrica: ${format(g)} (N/A, dati negativi)\n`;
            results += `Media Armonica:   ${format(h)} (instabile)\n`;
            results += `Media Troncata 10%: ${format(tm10)} (robusta)\n`;
            results += `Media Troncata 20%: ${format(tm20)} (ancora più robusta)\n`;
            results += `\n(Nota: Solo Mediana e Troncata sono affidabili)`;
            break;
    }
    statsOutput.textContent = results;
}

function mainApp() {
    const generateBtn = document.getElementById('generate-btn');
    const distSelect = document.getElementById('dist-select');
    const sampleSizeInput = document.getElementById('sample-size');
    const canvasTitle = document.getElementById('canvas-title');
    
    let currentData = null;
    let currentTitle = "";
    let currentDistType = "";

    function runGeneration() {
        const distType = distSelect.value;
        const n = parseInt(sampleSizeInput.value) || 1000;
        let data;
        let title;

        switch (distType) {
            case 'normal':
                data = rnorm(n, 0, 1);
                title = 'Distribuzione Normale';
                break;
            case 'exponential':
                data = rexp(n, 1.0);
                title = 'Distribuzione Esponenziale';
                break;
            case 'lognormal':
                data = rlnorm(n, 0, 1);
                title = 'Distribuzione Log-Normale';
                break;
            case 'cauchy':
                data = rcauchy(n, 0, 1);
                title = 'Distribuzione di Cauchy';
                break;
        }
        
        // Salva i dati per il resize
        currentData = data;
        currentTitle = title;
        currentDistType = distType;
        
        canvasTitle.textContent = title;

        drawHistogram(currentData, currentTitle, currentDistType);
        calculateAndDisplayStats(currentData, currentDistType);
    }
    
    generateBtn.addEventListener('click', runGeneration);
    
    // Ridisegna sul resize della finestra
    window.addEventListener('resize', () => {
        if (currentData) {
            drawHistogram(currentData, currentTitle, currentDistType);
        }
    });

    // Genera la prima visualizzazione al caricamento
    runGeneration();
}

// Avvia l'app dopo il caricamento del DOM
document.addEventListener('DOMContentLoaded', mainApp);
