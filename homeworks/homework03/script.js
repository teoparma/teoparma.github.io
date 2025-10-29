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
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

// Aux function for modular exponentiation (pow(base, exp) % mod)
function powerMod(base, exp, mod) {
    let res = 1;
    base %= mod;
    while (exp > 0) {
        if (exp % 2 === 1) {
            res = (res * base) % mod;
        }
        exp = Math.floor(exp / 2);
        base = (base * base) % mod;
    }
    return res;
}

// Aux function computing the modular multiplicative inverse
function modInverse(e, phi) {
    let t = 0; 
    let newt = 1;
    let r = phi;
    let newr = e;
    
    while (newr !== 0) {
        let quotient = Math.floor(r / newr);
        [t, newt] = [newt, t - quotient * newt];
        [r, newr] = [newr, r - quotient * newr];
    }
    
    if (r > 1) {
        console.error("e non è coprimo con phi. Impossibile trovare l'inverso.");
        return null; // Handle error gracefully
    }
    
    if (t < 0) {
        t = t + phi;
    }
    return t;
}

function RSA_genKeys(p, q){
    if(!p || !q || p<=1 || q<=1 || p===q || isNaN(p) || isNaN(q)){
        return {error: "p and q must be different positive prime numbers"};
    }
    if(p * q < 90) { // Check needed because charCode(Z) is 90
        return {error: `Il modulo N (${p*q}) deve essere maggiore di 90 per cifrare la 'Z'. Aumenta p o q.`};
    }

    const n = p * q;
    const phi = (p-1)*(q-1);
    let e = 3; 
    
    while(gcd(e, phi) !== 1){
        e++;
    }
    const d = modInverse(e, phi); 

    if (d === null) {
        return {error: "Impossibile trovare l'inverso modulare. Prova altri numeri primi."};
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

// --- HTML INTEGRATION ---

let currentCiphertext = [];
let currentDecryptionMap = new Map();

document.addEventListener('DOMContentLoaded', () => {
    updateModulusN();
    document.getElementById('p').addEventListener('input', updateModulusN);
    document.getElementById('q').addEventListener('input', updateModulusN);
});

function updateModulusN(){
    const p = parseInt(document.getElementById('p').value) || 0;
    const q = parseInt(document.getElementById('q').value) || 0;
    const n = p * q;
    document.getElementById('modulus_n').textContent = isNaN(n) ? 'Errore' : n;
}

function runAnalysis() {
    const plaintext = document.getElementById('plaintext').value;
    const p = parseInt(document.getElementById('p').value);
    const q = parseInt(document.getElementById('q').value);
    const analysisSection = document.getElementById('analysis_section');
    
    const keys = RSA_genKeys(p, q);
    if (keys.error) {
        console.error("Errore RSA: " + keys.error); 
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
    table.innerHTML = ''; // Pulisce la tabella precedente

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
 * @param {Array<[string, string]>} nGramFrequencies
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
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Double Block Cifrato</th>';
    html += '<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expected Double</th>';
    html += '</tr></thead><tbody class="divide-y divide-gray-200">';
    
    const maxRows = english_doubles.length; // Max 7, like english doubles
    const topCiphered = doublesFrequencies.slice(0, maxRows);
    const topExpected = english_doubles.slice(0, maxRows);

    const numRows = Math.max(topCiphered.length, topExpected.length);

    for (let i = 0; i < numRows; i++) {
        // Parte cifrata
        const [block, _] = topCiphered[i] || [null, null];
        const displayCipherBlock = block !== null ? `<span class="text-blue-600 font-mono">${block}, ${block}</span>` : '-';
        
        // Parte attesa
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