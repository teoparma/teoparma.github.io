// --- Globals ---
const $ = (selector) => document.querySelector(selector);
const margin = { top: 20, right: 20, bottom: 40, left: 50 };
const tooltip = d3.select("#tooltip");

// --- Math Helpers ---
// Theoretical functions (logFactorial, binomialProb, getPoissonBinomialProbs) are removed.

// --- Core Simulation ---
function runSimulation(model, n, m_initial, p, T) {
    let trajectories = [];
    let finalScoreCounts = new Map();
    const q_constant = Math.pow(1 - p, m_initial); // q for constant model

    for (let t = 0; t < T; t++) {
        let score = 0;
        let path = [{ week: 0, score: 0 }];

        for (let week = 1; week <= n; week++) {
            let prob_secure;
            
            if (model === "constant") {
                prob_secure = q_constant;
            } else {
                // Variable model: recalculate q_k each week
                const current_m = Math.max(0, m_initial - (week - 1));
                prob_secure = Math.pow(1 - p, current_m);
            }

            if (Math.random() < prob_secure) {
                score++; // Secure
            } else {
                score--; // Breached
            }
            
            if (t < 50) { // Only store full paths for the first 50 trajectories
                path.push({ week: week, score: score });
            }
        }
        
        if (t < 50) {
            trajectories.push(path);
        }
        
        // Tally final score
        finalScoreCounts.set(score, (finalScoreCounts.get(score) || 0) + 1);
    }
    return { trajectories, finalScoreCounts };
}

// --- Theoretical Data Calculation ---
// getTheoreticalData function is removed.

// --- D3 Drawing Functions ---
function drawTrajectories(data, n) {
    const chartDiv = $("#chart_trajectories");
    chartDiv.innerHTML = ""; // Clear
    
    const width = chartDiv.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(chartDiv)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    const x = d3.scaleLinear().domain([0, n]).range([0, width]);
    const yMin = d3.min(data, path => d3.min(path, d => d.score)) || -n;
    const yMax = d3.max(data, path => d3.max(path, d => d.score)) || n;
    const y = d3.scaleLinear().domain([Math.min(-10, yMin), Math.max(10, yMax)]).range([height, 0]).nice();

    // Grid
    svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickSize(-height).tickFormat(""));
    svg.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""));
    
    // Axes
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
    
    // Axis labels
    svg.append("text").attr("class", "axis-label").attr("x", width / 2).attr("y", height + margin.bottom - 5).style("text-anchor", "middle").text("Week (n)");
    svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("y", 0 - margin.left + 15).attr("x", 0 - (height / 2)).style("text-anchor", "middle").text("Cumulative Score");

    // Line
    const line = d3.line()
        .x(d => x(d.week))
        .y(d => y(d.score));
    
    // Colors
    const color = d3.scaleSequential(d3.interpolateTurbo).domain([0, data.length]);

    svg.selectAll(".line")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", line)
        .style("stroke", (d, i) => color(i))
        .style("opacity", 0.7);
}

function drawHistogram(simData, n) {
    const chartDiv = $("#chart_histogram");
    chartDiv.innerHTML = ""; // Clear

    const width = chartDiv.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(chartDiv)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Prepare data for histogram bins from simulation data
    const bins = [];
    // We still create bins for the full possible range to have a complete axis
    for (let score = -n; score <= n; score += 2) {
        bins.push({
            score: score,
            simCount: simData.get(score) || 0,
        });
    }

    // --- Dynamic X-Axis Domain ---
    const filteredBins = bins.filter(d => d.simCount > 0);
    
    let domainMin, domainMax;
    const maxSimCount = d3.max(bins, d => d.simCount);
    const maxCount = maxSimCount;

    if (filteredBins.length === 0) {
        domainMin = -n - 1; domainMax = n + 1;
    } else if (filteredBins.length === 1) {
        domainMin = filteredBins[0].score - 4; // Add padding
        domainMax = filteredBins[0].score + 4;
    } else {
        const minScore = d3.min(filteredBins, d => d.score);
        const maxScore = d3.max(filteredBins, d => d.score);
        const padding = Math.max(4, (maxScore - minScore) * 0.1); // 10% padding, min 2 bins
        domainMin = minScore - padding;
        domainMax = maxScore + padding;
    }
    if (domainMax - domainMin < 10) {
        const mid = (domainMax + domainMin) / 2;
        domainMin = mid - 5;
        domainMax = mid + 5;
    }
    // --- End Dynamic X-Axis ---

    // Axes
    const x = d3.scaleLinear()
        .domain([domainMin, domainMax]) // Use dynamic domain
        .range([0, width]);
    
    const y = d3.scaleLinear()
        .domain([0, maxCount > 0 ? maxCount * 1.1 : 10]) // Handle 0 count
        .range([height, 0]).nice();
        
    // Grid
    svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickSize(-height).tickFormat(""));
    svg.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(""));

    // Axes
    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));
    
    // Axis labels
    svg.append("text").attr("class", "axis-label").attr("x", width / 2).attr("y", height + margin.bottom - 5).style("text-anchor", "middle").text("Final Score (S = 2k - n)");
    svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("y", 0 - margin.left + 15).attr("x", 0 - (height / 2)).style("text-anchor", "middle").text("Number of Trajectories (Count)");

    // Bars (Simulation)
    const barWidth = Math.max(1, x(2) - x(0) - 1); // Bar width of 2 units, with 1px gap
    svg.selectAll(".bar-sim")
        .data(bins)
        .enter()
        .append("rect")
        .attr("class", "bar-sim")
        .attr("x", d => x(d.score - 1)) // Centered bar
        .attr("y", d => y(d.simCount))
        .attr("width", barWidth) 
        .attr("height", d => height - y(d.simCount))
        .attr("fill", "steelblue")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            const k = (d.score + n) / 2; // Calculate k from score
            tooltip.style("opacity", 1)
                    .html(`<strong>Score: ${d.score}</strong> (k=${k})<br>
                            Simulated: ${d.simCount}`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });
}

// --- Main Controller ---
async function main() {
    $("#loading").style.display = "block";
    
    // Get inputs
    const model = $("#model_select").value;
    const n = parseInt($("#n_weeks").value);
    const m = parseInt($("#m_attackers").value);
    const p = parseFloat($("#p_breach").value);
    const T = parseInt($("#t_trajectories").value);

    // Run simulation (in a timeout to allow UI to update)
    await new Promise(resolve => setTimeout(() => {
        const { trajectories, finalScoreCounts } = runSimulation(model, n, m, p, T);
        
        // Get theoretical data - REMOVED
        
        // Draw charts
        drawTrajectories(trajectories, n);
        drawHistogram(finalScoreCounts, n); // Pass n for k calculation in tooltip
        
        $("#loading").style.display = "none";
        resolve();
    }, 50));
}

$("#run_sim").addEventListener("click", main);
$("#model_select").addEventListener("change", main);

// Run on page load
main();
