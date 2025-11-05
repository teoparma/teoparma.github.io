
class OnlineStats {
    constructor() {
        this.n = 0;
        this.mean = 0.0;
        this.M2 = 0.0;
    }
    
    /**
     * Add a new data point 'x' to the dataset.
     * @param {number} x - The new data point.
     */
    update(x) {
        this.n += 1;
        const delta = x - this.mean;
        this.mean += delta / this.n;
        const delta2 = x - this.mean;
        this.M2 += delta * delta2;
    }
    
    /**
     * Return the current mean.
     * @returns {number} The current mean.
     */
    getMean() {
        return this.mean;
    }
    
    /**
     * Return the current variance.
     * @param {boolean} [sample=true] - If true, returns sample variance (n-1). If false, returns population variance (n).
     * @returns {number} The current variance.
     */
    getVariance(sample = true) {
        if (this.n < 2) return 0.0;
        return sample ? this.M2 / (this.n - 1) : this.M2 / this.n;
    }
    
    /**
     * Return the current standard deviation.
     * @param {boolean} [sample=true] - If true, returns sample standard deviation.
     * @returns {number} The current standard deviation.
     */
    getStdDev(sample = true) {
        return Math.sqrt(this.getVariance(sample));
    }

    /**
     * Resets the calculator state.
     */
    reset() {
        this.n = 0;
        this.mean = 0.0;
        this.M2 = 0.0;
    }
    
    toString() {
        return `OnlineStats(n=${this.n}, mean=${this.getMean().toFixed(4)}, variance=${this.getVariance(true).toFixed(4)})`;
    }
}

// --- Interactive Front-End Logic ---

// Use 'let' so it can be re-initialized on reset
let stats = new OnlineStats();

// Get DOM Elements
const dataInput = document.getElementById('dataInput');
const addButton = document.getElementById('addButton');
const resetButton = document.getElementById('resetButton');
const errorMessage = document.getElementById('errorMessage');

// Result Spans
const statCount = document.getElementById('statCount');
const statMean = document.getElementById('statMean');
const statVariance = document.getElementById('statVariance');
const statStdDev = document.getElementById('statStdDev');

/**
 * Reads from the 'stats' object and updates the HTML.
 */
function updateUI() {
    statCount.textContent = stats.n;
    if (stats.n === 0) {
        statMean.textContent = '0.0000';
        statVariance.textContent = '0.0000';
        statStdDev.textContent = '0.0000';
    } else {
        statMean.textContent = stats.getMean().toFixed(4);
        statVariance.textContent = stats.getVariance(true).toFixed(4);
        statStdDev.textContent = stats.getStdDev(true).toFixed(4);
    }
}

/**
 * Reads the input, validates it, and updates the stats.
 */
function addNumber() {
    const valueStr = dataInput.value;
    if (valueStr === '') {
        errorMessage.textContent = 'Please enter a value.';
        errorMessage.style.display = 'block';
        return;
    }
    
    const value = parseFloat(valueStr);
    
    if (isNaN(value)) {
        errorMessage.textContent = 'Please enter a valid number.';
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none'; // Hide error
        stats.update(value); // Run the core algorithm
        updateUI(); // Update the display
        
        // Clear input and focus for next entry
        dataInput.value = '';
        dataInput.focus();
    }
}

/**
 * Resets the calculator and UI.
 */
function resetCalculator() {
    stats.reset();
    updateUI();
    errorMessage.style.display = 'none';
    dataInput.value = '';
    dataInput.focus();
}

// --- Attach Event Listeners ---

// Add number on button click
addButton.addEventListener('click', addNumber);

// Add number on 'Enter' key press
dataInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addNumber();
    }
});

// Reset calculator on button click
resetButton.addEventListener('click', resetCalculator);

// Initialize UI on page load
updateUI();
