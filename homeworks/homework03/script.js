const P_FIXED = 17;
const Q_FIXED = 19;

const english_frequencies = new Map([
    ['E', 12.70], ['T', 9.06], ['A', 8.17], ['O', 7.51], ['I', 6.97],
    ['N', 6.75], ['S', 6.33], ['H', 6.09], ['R', 5.99], ['D', 4.25],
    ['L', 4.03], ['C', 2.78], ['U', 2.76], ['M', 2.41], ['W', 2.36],
    ['F', 2.23], ['G', 2.02], ['Y', 1.99], ['P', 1.93], ['B', 1.49],
    ['V', 0.98], ['K', 0.77], ['J', 0.15], ['X', 0.15], ['Q', 0.10],
    ['Z', 0.07]
]);
const english_freq_sorted = [...english_frequencies.entries()].sort((a,b) => b[1]-a[1]);

const english_bigrams = ["TH", "HE", "AN", "IN", "ER", "ON", "RE", "ED", "ND", "HA", "AT", "EN", "ES", "OF", "NT", "EA", "TI", "TO", "IO", "LE", "IS", "OU", "AR", "AS", "DE", "RT", "VE"];

const english_trigrams = ["THE", "AND", "THA", "ENT", "ION", "TIO", "FOR", "NDE", "HAS", "NCE", "TIS", "OFT", "MEN"];

const english_doubles = ["SS", "EE", "TT", "FF", "LL", "MM", "OO"];

// Greatest Common Divisor
function gcd(a, b) {
    // Ensure they are BigInt
    const aBig = BigInt(a);
    const bBig = BigInt(b);

    let a_temp = aBig < 0n ? -aBig : aBig;
    let b_temp = bBig < 0n ? -bBig : bBig;
    
    while (b_temp) {
        [a_temp, b_temp] = [b_temp, a_temp % b_temp];
    }
    // Convert back if necessary
    // Our 'find_keys' function already passes BigInt, so this is ok.
    // For RSA_genKeys which uses Number, we must convert back.
    if (typeof a === 'number' && typeof b === 'number') {
        return Number(a_temp);
    }
    return a_temp; // Returns a BigInt
}

// Aux function for modular exponentiation (pow(base, exp) % mod)
function powerMod(base, exp, mod) {
    base = BigInt(base);
    exp = BigInt(exp);
    mod = BigInt(mod);

    if (mod === 0n) throw new Error("Modulus can not be zero.");

    let res = 1n;
    base %= mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) {
            res = (res * base) % mod;
        }
        exp = exp >> 1n;
        base = (base * base) % mod;
    }
    return Number(res);
}

// Aux function computing the modular multiplicative inverse
function modInverse(e, phi) {
    // Convert to BigInt
    const eBig = BigInt(e);
    const phiBig = BigInt(phi);

    let t = 0n; 
    let newt = 1n;
    let r = phiBig;
    let newr = eBig;
    
    while (newr !== 0n) {
        let quotient = r / newr;
        [t, newt] = [newt, t - quotient * newt];
        [r, newr] = [newr, r - quotient * newr];
    }
    
    if (r > 1n) {
        console.error("e is not coprime with phi. Cannot find inverse.");
        return null;
    }
    
    if (t < 0n) {
        t = t + phiBig;
    }
    return Number(t); // Convert back to Number
}

function RSA_genKeys(p, q){
    if(!p || !q || p<=1 || q<=1 || p===q || isNaN(p) || isNaN(q)){
        return {error: "p and q must be different positive prime numbers"};
    }
    if(p * q < 90) { // Check needed because charCode(Z) is 90
        return {error: `The modulus N (${p*q}) must be greater than 90 to encrypt 'Z'. Increase p or q.`};
    }

    const n = p * q;
    const phi = (p-1)*(q-1);
    let e = 3; 
    
    while(gcd(e, phi) !== 1){
        e++;
    }
    const d = modInverse(e, phi); 

    if (d === null) {
        return {error: "Could not find modular inverse. Try other prime numbers."};
    }

    return {
        pub_exp: e,
        priv_exp: d,
        mod: n
    };
}

/** Encrypts a single message block (char code). */
function RSA_encrypt(msg, e, n){
    return powerMod(msg, e, n);
}

/** Decrypts a single ciphertext block. (Not used in FA, but kept for completeness) */
function RSA_decrypt(c, d, n){
    return powerMod(c, d, n);
}

// returns an array of integers and strings (spaces)
function encryptText(plaintext, pub_exp, mod){
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let ciphertext = [];

    for(let i = 0; i < plaintext.length; i++){
        let chr = plaintext[i].toUpperCase();
        if(ALPHABET.includes(chr)){
            let enc_chr = RSA_encrypt(chr.charCodeAt(0), pub_exp, mod);
            ciphertext.push(enc_chr);
        }else{
            // Keeps not alphabetic characters
            ciphertext.push(plaintext[i]);
        }
    }
    return ciphertext;
}

function compute_frequencies(ciphertext){
    const frequencies = new Map();
    let n_letters = 0;

    for (const char of ciphertext) {
        if (Number.isInteger(char)) {
            frequencies.set(char, (frequencies.get(char) || 0) + 1);
            n_letters += 1;
        }
    }

    for(const [letter, value] of frequencies){
        frequencies.set(letter, Number(((value/n_letters)*100).toFixed(2)));
    }

    const enc_frequency = [...frequencies.entries()].sort((a,b) => b[1]-a[1]);
    return enc_frequency;
}

function compute_decryption_map_fa(enc_frequency, min_lang_frequency){
    let decryption_map = new Map();

    const lang_freq_sorted = [...min_lang_frequency.entries()].sort((a,b) => b[1]-a[1]);
    
    for(let i = 0; i < enc_frequency.length && i < lang_freq_sorted.length; i++){
        const [cipher_block, _] = enc_frequency[i];
        const [plain_char, __] = lang_freq_sorted[i];
        decryption_map.set(cipher_block, plain_char);
    }
    return decryption_map;
}

function compute_ngram_frequencies(ciphertext, n){
    let nGram_frequencies = new Map();
    // Filter only number blocks and spaces
    const sanitized_ciphertext = ciphertext.filter(el => Number.isInteger(el) || el === " ");
    let nGram_number = 0;
    
    for(let i = 0; i <= sanitized_ciphertext.length - n; i++){
        let n_gram_array = [];
        let is_valid = true;
        
        for(let j = 0; j < n; j++){
            const char = sanitized_ciphertext[i + j];
            if (char === " ") {
                is_valid = false;
                break;
            }
            n_gram_array.push(char);
        }
        
        if (is_valid) {
            let n_gram = n_gram_array.join(',');
            nGram_frequencies.set(n_gram, (nGram_frequencies.get(n_gram) || 0) + 1);
            nGram_number++;
        }
    }
    
    if (nGram_number === 0) return [];

    for(const [el, value] of nGram_frequencies){
        nGram_frequencies.set(el, (nGram_frequencies.get(el)/nGram_number * 100).toFixed(2));
    }
    
    const nGram_sorted = [...nGram_frequencies.entries()].sort((a,b) => b[1]-a[1]);
    return nGram_sorted;
}

function find_doubles(ciphertext){
    let doubles = new Map();
    const bigrams = compute_ngram_frequencies(ciphertext, 2);
    
    for(const [bigram, freq] of bigrams){
        let couple = bigram.split(',').map(Number);
        if(couple.length === 2 && couple[0] === couple[1]){
            doubles.set(couple[0], parseFloat(freq));
        }
    }

    return [...doubles.entries()].sort((a,b) => b[1]-a[1]);
}

function decrypt_from_decryption_map(ciphertext, decryption_map){
    let plaintext = "";
    for(const enc_chr of ciphertext){
        if(Number.isInteger(enc_chr)){
            // Get the letter from the map, otherwise use a placeholder
            let dec_chr = decryption_map.get(enc_chr) || '_';
            plaintext += dec_chr;
        }else{
            // Keep spaces and other characters
            plaintext += enc_chr;
        }
    }
    return plaintext;
}

function frequency_analysis(ciphertext) {
    const enc_frequency = compute_frequencies(ciphertext);
    const decryption_map = compute_decryption_map_fa(enc_frequency, english_frequencies);
    const enc_bigrams = compute_ngram_frequencies(ciphertext, 2);
    const enc_trigrams = compute_ngram_frequencies(ciphertext, 3);
    const enc_doubles = find_doubles(ciphertext);

    return {decryption_map, enc_bigrams, enc_trigrams, enc_doubles, enc_frequency};
}

// BRUTE FORCE

/**
 * Attempts to factorize n into p*q.
 * @param {number} n The modulus to factorize.
 * @returns {{p: number, q: number} | null} An object with p and q, or null.
 */
function try_factorize(n) {
    if (isNaN(n) || n < 2) return null;
    
    // Handles factor 2 (but RSA p,q are > 2)
    if (n % 2 === 0) {
        const q = n / 2;
        if (q > 1 && q !== 2) return { p: 2, q: q }; // p=2 is a valid but rare case
        return null; 
    }
    
    // Check only odd divisors
    for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) {
            const q = n / i;
            // Assume i and q are our prime p and q
            return { p: i, q: q };
        }
    }
    // If the loop finishes, n is (probably) prime
    return null; 
}

/**
 * Intelligent factorization handler.
 * The 'n_candidate' (from GCD) could be n*k.
 * Tries to divide it by small k to find the real n.
 * @param {number} n_candidate The result from the GCD.
 * @returns {{n: number, p: number, q: number} | null}
 */
function factorize_rsa(n_candidate) {
    // List of n candidates to test.
    // Start with the candidate itself (the k=1 case)
    let n_to_test = [n_candidate];

    // Add n/k for small k
    const small_k = [2, 3, 5, 7];
    for (const k of small_k) {
        if (n_candidate % k === 0) {
            n_to_test.push(n_candidate / k);
        }
    }
    // Remove duplicates and sort (ascending)
    const unique_n = [...new Set(n_to_test)].sort((a,b) => a-b);
    
    for (const n of unique_n) {
        if (n <= 90) continue; // n must be > 'Z' (90)
        
        const factors = try_factorize(n);
        
        // If we find p and q that multiply to n, we have a winner
        if (factors && (factors.p * factors.q === n)) {
            // Found!
            return { n: n, p: factors.p, q: factors.q };
        }
    }

    // Failed, no n candidate produced valid factors
    return null; 
}

/**
 * Executes the frequency analysis attack to find n, p, q, e, d.
 * This function reads 'currentCiphertext' and 'english_freq_sorted'
 * and writes the results to the 'key_attack_results' HTML element.
 */
function find_keys() {
    const results_div = document.getElementById('key_attack_results');
    results_div.innerHTML = '<p class="text-gray-500 animate-pulse">Analysis in progress... (may take a few seconds)</p>';

    const enc_frequency = compute_frequencies(currentCiphertext);
    if(enc_frequency.length == 0) {
        results_div.innerHTML = `<p class="text-red-500">Error: Perform analysis first</p>`;
        return;
    }
    
    // Need at least 3-4 unique blocks for a reliable GCD
    const top_n_mappings = 2; 
    if (enc_frequency.length < top_n_mappings) {
        results_div.innerHTML = `<p class="text-red-500">Error: Ciphertext too short. At least ${top_n_mappings} unique blocks are needed to attempt the attack.</p>`;
        return;
    }


    const potential_exponents = [3, 5, 7, 11, 17, 65537]; // Common public exponents to test

    // Map the most frequent cipher blocks with the most frequent letters
    // C1 -> M1 ('E'), C2 -> M2 ('T'), C3 -> M3 ('A'), ...
    const mappings = [];
    for(let i=0; i < top_n_mappings; i++) {
        const [cipherBlock, _] = enc_frequency[i];
        const [plainChar, __] = english_freq_sorted[i];
        const plainCode = plainChar.charCodeAt(0); // Use ASCII (e.g., 'E' = 69)
        mappings.push({ C: cipherBlock, M: plainCode, char: plainChar });
    }

    for (const e of potential_exponents) {
        // Calculate K = |C - M^e| values
        // We must use BigInt to avoid overflow with M^e
        const K_values = [];
        try {
            for (const map of mappings) {
                const C_big = BigInt(map.C);
                const M_big = BigInt(map.M);
                const e_big = BigInt(e);
                
                const M_e_big = M_big ** e_big; // Calculate M^e
                
                let K = C_big - M_e_big; // K = C - M^e
                if(K < 0n) K = -K; // Equivalent of Math.abs()
                
                if (K !== 0n) { // A K=0 doesn't help in the GCD calculation
                   K_values.push(K);
                }
            }
        } catch (err) {
            console.warn(`Error during BigInt calculation for e=${e}: ${err}. Skipping.`);
            continue;
        }

        if (K_values.length < 2) continue; // We cannot calculate the GCD

        // Calculate the GCD of all K values
        // n must be a common divisor of all K
        let potential_n_big = K_values[0];
        for (let i = 1; i < K_values.length; i++) {
            // Use the existing gcd function, which also works with BigInt
            potential_n_big = gcd(potential_n_big, K_values[i]);
        }
        
        // The GCD result could be 0n or 1n if the assumptions are wrong
        if (potential_n_big <= 1n) continue;

        // The GCD could be n, or a multiple of n (e.g., 2n, 3n).
        // For small p,q, it's very likely to be n.
        // Convert to Number for the factorization and mod functions.
        let potential_n_gcd;
        try {
            potential_n_gcd = Number(potential_n_big);
            if(!Number.isSafeInteger(potential_n_gcd)){
                 console.warn("Potential n (from GCD) too large:", potential_n_big);
                 continue;
             }
        } catch (err) {
            console.warn("Potential n (from GCD) not convertible to Number:", potential_n_big);
            continue;
        }

        if (potential_n_gcd <= 90) continue;

        const rsa_keys = factorize_rsa(potential_n_gcd);

        const { n, p, q } = rsa_keys;
        
        // Calculate phi and d
        const phi = (p - 1) * (q - 1);
        
        // Check if e and phi are coprime
        if (gcd(e, phi) !== 1) {
            // This hypothesis (e, n) is wrong
            continue;
        }

        const d = modInverse(e, phi);
        if (d === null) continue; // Inverse not found

        // --- Final Validation ---
        // Check if C1 decrypted with (d, n) gives M1
        const M1_check = powerMod(mappings[0].C, d, n);
        const M2_check = powerMod(mappings[1].C, d, n);

        if (M1_check === mappings[0].M && M2_check === mappings[1].M) {
            // FOUND!
            results_div.innerHTML = `
                <h3 class="text-lg font-bold text-emerald-600">🎉 Keys Found!</h3>
                <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>Public Exponent (e):</strong> ${e}</li>
                    <li><strong>Modulus (n):</strong> ${n}</li>
                    <li><strong>Prime (p):</strong> ${p}</li>
                    <li><strong>Prime (q):</strong> ${q}</li>
                    <li><strong>Phi(n):</strong> ${phi}</li>
                    <li><strong>Private Exponent (d):</strong> ${d}</li>
                </ul>
                <p class="mt-3 text-sm">The decryption map and decrypted text have been updated automatically.</p>
            `;
            
            // Success! Update the global decryption map.
            currentDecryptionMap.clear();
            for(const enc_char of currentCiphertext){
                if (Number.isInteger(enc_char) && !currentDecryptionMap.has(enc_char)) {
                    const dec_code = powerMod(enc_char, d, n);
                    currentDecryptionMap.set(enc_char, String.fromCharCode(dec_code));
                }
            }
            // Update the UI with the correct map
            renderDecryptionMapTable(enc_frequency, currentDecryptionMap);
            updateDecryptedText();
            return; // Done
        }
    } // end 'e' loop

    results_div.innerHTML = '<p class="text-red-500">Attack failed. Unable to find keys with standard assumptions (e=3,5,7...; mapping E,T,A...). The numbers p and q might be too large or the text too short.</p>';
}

// --- HTML INTEGRATION ---

let currentCiphertext = [];
let currentDecryptionMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
    const n = P_FIXED * Q_FIXED;
    const n_display = document.getElementById('modulus_n');
    if (n_display) {
        n_display.textContent = n;
    }
});

function runAnalysis() {
    const plaintext = document.getElementById('plaintext').value;
    const p = P_FIXED;
    const q = Q_FIXED;
    const analysisSection = document.getElementById('analysis_section');
    
    const keys = RSA_genKeys(p, q);
    if (keys.error) {
        console.error("RSA Error: " + keys.error); 
        return;
    }

    currentCiphertext = encryptText(plaintext, keys.pub_exp, keys.mod);
    document.getElementById('ciphertext_display').textContent = currentCiphertext.join(' ').replace(/ /g, ' ');

    const analysis = frequency_analysis(currentCiphertext);
    currentDecryptionMap = analysis.decryption_map;
    
    renderCombinedFreqTable(analysis.enc_frequency); 
    
    renderDecryptionMapTable(analysis.enc_frequency, analysis.decryption_map);
    renderNGramTable('enc_bigrams_table', analysis.enc_bigrams, english_bigrams);
    renderNGramTable('enc_trigrams_table', analysis.enc_trigrams, english_trigrams);
    renderDoublesTable(analysis.enc_doubles);

    updateDecryptedText();
    
    analysisSection.style.display = 'block';
    document.getElementById('custom_ngram_section').style.display = 'block';

    document.getElementById('find_keys_button').classList.remove('hidden');
}

/**
 * @param {Array<[number, number]>} enc_frequency ordered encrypted frequencies [block, freq].
 */
function renderCombinedFreqTable(enc_frequency) {
    const table = document.getElementById('combined_freq_table');
    
    let html = '<thead class="bg-gray-50"><tr>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Encrypted Block</th>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency (%)</th>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected Letter</th>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency (%)</th>';
    html += '</tr></thead><tbody class="divide-y divide-gray-200">';
    
    const lang_freq_map = english_freq_sorted;
    
    const numRows = Math.max(enc_frequency.length, lang_freq_map.length);

    for (let i = 0; i < numRows; i++) {
        const [cipherBlock, cipherFreq] = enc_frequency[i] || [null, null];
        const [langChar, langFreq] = lang_freq_map[i] || [null, null];

        const cipherBlockDisplay = cipherBlock !== null ? `<span class="text-blue-600 font-bold font-mono">${cipherBlock}</span>` : '-';
        const cipherFreqDisplay = cipherFreq !== null ? cipherFreq.toFixed(2) : '-';
        
        const langCharDisplay = langChar !== null ? `<span class="text-emerald-600 font-bold">${langChar}</span>` : '-';
        const langFreqDisplay = langFreq !== null ? langFreq.toFixed(2) : '-';


        html += `<tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm">${cipherBlockDisplay}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${cipherFreqDisplay}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm">${langCharDisplay}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${langFreqDisplay}</td>
                </tr>`;
    }
    
    html += '</tbody>';
    table.innerHTML = html;
}


function generateCustomNGrams() {
    const nInput = document.getElementById('ngram_n_input');
    const n = parseInt(nInput.value);
    const table = document.getElementById('custom_ngram_table');
    table.innerHTML = ''; // Clears the previous table

    if (isNaN(n) || n < 1) {
        alert("Insert a valid number for N");
        return;
    }

    if (!currentCiphertext || currentCiphertext.length === 0) {
        alert("First compute encryption and main analysis");
        return;
    }

    const customNGrams = compute_ngram_frequencies(currentCiphertext, n);
    
    renderCustomNGramTable(customNGrams, n);
}

function renderCustomNGramTable(nGramFrequencies, n) {
    const table = document.getElementById('custom_ngram_table');
    
    let html = `<thead class="bg-gray-50"><tr>`;
    html += `<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Encrypted Sequence (${n}-Grams)</th>`;
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Frequency (%)</th>';
    html += '</tr></thead><tbody class="divide-y divide-gray-200">';
    
    const maxRows = 20; // Show first 20 N-Grams
    const topNGrams = nGramFrequencies.slice(0, maxRows);

    if (topNGrams.length === 0) {
        html += `<tr><td colspan="3" class="px-3 py-2 text-center text-gray-500">No ${n}-Gram found (N could be too big for the words in the text).</td></tr>`;
    } else {
        topNGrams.forEach(([sequence, freq], i) => {
            const displaySequence = sequence.replace(/,/g, ' ');
            
            html += `<tr>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-mono">${displaySequence}</td>
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">${freq}%</td>
                    </tr>`;
        });
    }
    
    html += '</tbody>';
    table.innerHTML = html;
}

function renderDecryptionMapTable(enc_frequency, initialMap) {
    const table = document.getElementById('decryption_map_table');
    let html = '<thead class="bg-gray-50"><tr><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Encrypted Block</th><th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Decrypt as</th></tr></thead><tbody class="divide-y divide-gray-200">';
    
    // Sort blocks numerically for a consistent display
    const sortedEncFrequency = [...enc_frequency].sort(([a], [b]) => a - b);


    sortedEncFrequency.forEach(([block, _]) => {
        const initialChar = initialMap.get(block) || '';
        html += `<tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-mono font-bold">${block}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                        <input type="text" 
                                data-block="${block}" 
                                value="${initialChar}" 
                                maxlength="1" 
                                class="decryption-input"
                                oninput="handleMapChange(this)">
                    </td>
                </tr>`;
    });

    if (sortedEncFrequency.length === 0) {
            html += `<tr><td colspan="2" class="px-3 py-2 text-center text-gray-500">No encrypted block to analyze.</td></tr>`;
    }

    html += '</tbody>';
    table.innerHTML = html;
}

function handleMapChange(inputElement) {
    const block = parseInt(inputElement.getAttribute('data-block'));
    let value = inputElement.value.toUpperCase();
    
    // Input cleaning
    if (value.length > 1) {
        value = value.charAt(0);
        inputElement.value = value;
    }
    
    // Stop the input with one single uppercase letter
    if (value && /^[A-Z]$/.test(value)) {
        currentDecryptionMap.set(block, value);
    } else if (value === '') {
        currentDecryptionMap.delete(block);
    } else {
        inputElement.value = currentDecryptionMap.get(block) || ''; 
    }

    updateDecryptedText();
}

function updateDecryptedText() {
    if (currentCiphertext.length === 0) return;
    
    let display_text = '';
    
    for (const element of currentCiphertext) {
            if (!Number.isInteger(element)) {
                display_text += element;
            } else {
                // use an underscore if not mapped
                display_text += currentDecryptionMap.get(element) || '_';
            }
    }
    
    document.getElementById('decrypted_text_output').textContent = display_text;
}

/**
 * @param {string} tableId HTML table ID.
 *Map
 * @param {string[]} expectedNGrams
 */
function renderNGramTable(tableId, nGramFrequencies, expectedNGrams) {
    const table = document.getElementById(tableId);
    
    let html = '<thead class="bg-gray-50"><tr>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Encrypted Sequence (Top 10)</th>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected Sequence</th>';
    html += '</tr></thead><tbody class="divide-y divide-gray-200">';
    
    const maxRows = 10;
    const topCiphered = nGramFrequencies.slice(0, maxRows);
    const topExpected = expectedNGrams.slice(0, maxRows); 

    const numRows = Math.max(topCiphered.length, topExpected.length);

    for (let i = 0; i < numRows; i++) {
        // Encrypted part
        const [cipherSequence, _] = topCiphered[i] || [null, null];
        const displayCipherSequence = cipherSequence ? cipherSequence.replace(/,/g, ' ') : '-';
        
        // Expected part
        const expectedSequence = topExpected[i] || '-';

        html += `<tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-blue-600 font-mono">${displayCipherSequence}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-emerald-600 font-bold font-mono">${expectedSequence}</td>
                </tr>`;
    }
    
    if (nGramFrequencies.length === 0) {
            html += `<tr><td colspan="3" class="px-3 py-2 text-center text-gray-500">No N-Gram found</td></tr>`;
    }
    
    html += '</tbody>';
    table.innerHTML = html;
}

/**
 * @param {Array<[number, number]>} doublesFrequencies
 */
function renderDoublesTable(doublesFrequencies) {
    const table = document.getElementById('enc_doubles_table');
    
    let html = '<thead class="bg-gray-50"><tr>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Encrypted Double Block</th>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected Double</th>';
    html += '</tr></thead><tbody class="divide-y divide-gray-200">';
    
    const maxRows = english_doubles.length; // Max 7, like english doubles
    const topCiphered = doublesFrequencies.slice(0, maxRows);
    const topExpected = english_doubles.slice(0, maxRows);

    const numRows = Math.max(topCiphered.length, topExpected.length);

    for (let i = 0; i < numRows; i++) {
        // Encrypted part
        const [block, _] = topCiphered[i] || [null, null];
        const displayCipherBlock = block !== null ? `<span class="text-blue-600 font-mono">${block}, ${block}</span>` : '-';
        
        // Expected part
        const expectedSequence = topExpected[i] || '-';

        html += `<tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm">${displayCipherBlock}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-emerald-600 font-bold font-mono">${expectedSequence}</td>
                </tr>`;
    }
    
    if (doublesFrequencies.length === 0) {
            html += `<tr><td colspan="3" class="px-3 py-2 text-center text-gray-500">No double found</td></tr>`;
    }

    html += '</tbody>';
    table.innerHTML = html;
}