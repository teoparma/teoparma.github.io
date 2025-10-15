const language_frequencies = [
    {
        language: 'EN', // English
        frequency: new Map([
            ['E', 12.70], ['T', 9.06], ['A', 8.17], ['O', 7.51], ['I', 6.97],
            ['N', 6.75], ['S', 6.33], ['H', 6.09], ['R', 5.99], ['D', 4.25],
            ['L', 4.03], ['C', 2.78], ['U', 2.76], ['M', 2.41], ['W', 2.36],
            ['F', 2.23], ['G', 2.02], ['Y', 1.99], ['P', 1.93], ['B', 1.49],
            ['V', 0.98], ['K', 0.77], ['J', 0.15], ['X', 0.15], ['Q', 0.10],
            ['Z', 0.07]
        ])
    },
    {
        language: 'IT', // Italian
        frequency: new Map([
            ['E', 11.79], ['A', 11.75], ['I', 10.14], ['O', 9.83], ['N', 6.88],
            ['L', 6.51], ['R', 6.37], ['T', 5.62], ['S', 4.98], ['C', 4.50],
            ['D', 3.74], ['P', 3.06], ['U', 2.81], ['M', 2.52], ['V', 2.10],
            ['G', 1.64], ['Z', 1.18], ['F', 1.53], ['B', 0.93], ['Q', 0.50], 
            ['H', 0.37], ['W', 0.03], ['Y', 0.02], ['J', 0.011], ['K', 0.009],
            ['X', 0.008]
        ])
    },
    {
        language: 'FR', // Franch
        frequency: new Map([
            ['E', 14.71], ['S', 7.95], ['A', 7.64], ['I', 7.53], ['T', 7.24],
            ['N', 7.10], ['R', 6.69], ['U', 6.31], ['O', 5.80], ['L', 5.46],
            ['D', 3.67], ['C', 3.26], ['M', 2.97], ['P', 2.52], ['V', 1.84],
            ['Q', 1.36], ['F', 1.07], ['H', 0.94], ['B', 0.90], ['G', 0.87],
            ['J', 0.81], ['Y', 0.71], ['X', 0.43], ['Z', 0.33], ['K', 0.074],
            ['W', 0.049]
        ])
    },
    {
        language: 'DE', // German
        frequency: new Map([
            ['E', 16.40], ['N', 9.78], ['S', 7.27], ['R', 7.00], ['I', 6.55],
            ['A', 6.52], ['T', 6.15], ['D', 5.08], ['H', 4.48], ['U', 4.17],
            ['L', 3.44], ['G', 3.00], ['C', 2.73], ['O', 2.59], ['M', 2.53],
            ['W', 1.92], ['B', 1.89], ['F', 1.66], ['K', 1.42], ['Z', 1.13],
            ['V', 0.85], ['P', 0.67], ['J', 0.27], ['Y', 0.039], ['X', 0.034],
            ['Q', 0.018]
        ])
    },
    {
        language: 'ES', // Spanish
        frequency: new Map([
            ['E', 13.70], ['A', 11.53], ['O', 8.68], ['S', 7.98], ['R', 6.87],
            ['N', 6.71], ['I', 6.25], ['D', 5.01], ['L', 4.97], ['T', 4.63],
            ['C', 4.02], ['U', 3.93], ['M', 3.16], ['P', 2.51], ['B', 2.22],
            ['H', 1.97], ['G', 1.77], ['Y', 1.43], ['V', 1.14], ['Q', 0.88],
            ['F', 0.69], ['X', 0.52], ['J', 0.49], ['Z', 0.47], ['W', 0.027],
            ['K', 0.026]
        ])
    },
    {
        language: 'PT', // Portuguese
        frequency: new Map([
            ['A', 14.63], ['E', 13.10], ['O', 9.74], ['S', 6.81], ['R', 6.53],
            ['I', 6.19], ['D', 4.99], ['M', 4.74], ['N', 4.45], ['T', 4.34],
            ['C', 3.88], ['U', 3.64], ['L', 2.78], ['P', 2.52], ['V', 1.58],
            ['G', 1.30], ['H', 1.28], ['Q', 1.20], ['B', 1.04], ['F', 1.02],
            ['Z', 0.47], ['X', 0.45], ['J', 0.38], ['W', 0.037], ['K', 0.015], 
            ['Y', 0.006],
    
        ])
    }
];

function frequency_analysis(chipertext) {
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const frequencies = new Map();
    for (const char of ALPHABET) { //map initialization 
        frequencies.set(char, 0);
    }

    const UppercaseTxt = chipertext.toUpperCase();
    let n_letters = 0

    //count occurrences
    for (let i = 0; i < UppercaseTxt.length; i++) {
        const char = UppercaseTxt[i];
        if (frequencies.has(char)) { 
            frequencies.set(char, frequencies.get(char) + 1);
            n_letters += 1;
        }
    }

    //compute percentage
    for(const [letter, value] of frequencies){
        frequencies.set(letter, Number(((value/n_letters)*100)))
    }

    //decrescent ordering of the map by frequencies
    const sorted_frequencies = [...frequencies.entries()].sort((a,b) => b[1]-a[1])
    
    return compair_frequencies(sorted_frequencies)
}

function compair_frequencies(enc_frequency){

    var distances = {}
    var language, freq_map, i

    //compute distances
    for(lang of language_frequencies){
        i=0
        language = lang.language
        freq_map = lang.frequency   
        distances[language] = 0

        //language frequencies are ordered yet
        for(const [_, value] of enc_frequency){
            exp_value = [...freq_map.entries()][i][1]
            distances[language] += ((value - exp_value)**2)/exp_value
            i += 1
        }

        //console.log("distance for language %s: %d", language, distance[language])
    }

    //take the language with the smallest distance from enc_frequency
    const [min_lang, _] = Object.entries(distances).reduce((a, b) =>  a[1] < b[1] ? a : b )
    //console.log("Language detected: %s", min_lang)

    const language_map = language_frequencies.find(item => item.language === min_lang)

    //compute rotation
    const Acode = 'A'.charCodeAt(0); //65
    const firstLetter = (enc_frequency.entries().next().value[1][0]).charCodeAt(0) - Acode
    const secondLetter = (language_map.frequency.keys().next().value).charCodeAt(0) - Acode

    const rot = (firstLetter - secondLetter + 26) % 26
    //console.log("rotation: %d", rot)

    return { rot, min_lang, distances, enc_frequency }
}

function encrypt(plaintext, rot) {
    let ciphertext = '';
    const ALPHABET_SIZE = 26;
    
    for (let i = 0; i < plaintext.length; i++) {
        const char = plaintext[i];
        const charCode = char.toUpperCase().charCodeAt(0);
        
        if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) {
            // Compute new position
            let newCharCode = charCode - 'A'.charCodeAt(0);
            
            // Apply encryption: (index + rotation) % 26
            newCharCode = (newCharCode + rot) % ALPHABET_SIZE;
            
            let newChar = String.fromCharCode(newCharCode + 'A'.charCodeAt(0));
            
            ciphertext += (char === char.toUpperCase()) ? newChar : newChar.toLowerCase();
        } else {
            ciphertext += char;
        }
    }
    return ciphertext;
}

function decrypt(ciphertext, rot) {
    let plaintext = '';
    const ALPHABET_SIZE = 26;
    
    for (let i = 0; i < ciphertext.length; i++) {
        const char = ciphertext[i];
        const charCode = char.toUpperCase().charCodeAt(0);
        
        if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) {

            let newCharCode = charCode - 'A'.charCodeAt(0);
            
            newCharCode = (newCharCode - rot + ALPHABET_SIZE) % ALPHABET_SIZE;
            
            let newChar = String.fromCharCode(newCharCode + 'A'.charCodeAt(0));
            
            plaintext += (char === char.toUpperCase()) ? newChar : newChar.toLowerCase();
        } else {
            plaintext += char;
        }
    }
    return plaintext;
}

// --- DOM logic and listener ---

document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyzeButton');
    const encryptButton = document.getElementById('encryptButton');
    const ciphertextInput = document.getElementById('ciphertextInput');
    const plaintextInput = document.getElementById('plaintextInput');
    const keyInput = document.getElementById('keyInput');
    const resultOutput = document.getElementById('resultOutput');
    const decryptedOutput = document.getElementById('decryptedOutput');
    const encryptedOutput = document.getElementById('encryptedOutput');

    function displayMessage(message, targetElement) {
        targetElement.innerHTML = message;
    }
    
    function getValidKey() {
        const key = parseInt(keyInput.value, 10);
        if (isNaN(key) || key < 0 || key > 25) {
            displayMessage('<div style="color: red; padding: 10px;">Errore: La chiave deve essere un numero intero tra 0 e 25.</div>', resultOutput);
            return null;
        }
        return key;
    }

    encryptButton.addEventListener('click', () => {
        const plaintext = plaintextInput.value;
        const rot = getValidKey();

        displayMessage('', resultOutput);
        encryptedOutput.value = '';

        if (!plaintext || plaintext.trim().length === 0) {
            displayMessage('<div style="color: red; padding: 10px;">Inserisci un testo da cifrare nel campo di input.</div>', resultOutput);
            return;
        }
        
        if (rot === null) return;

        const encryptedText = encrypt(plaintext, rot);
        encryptedOutput.value = encryptedText;
    });


    analyzeButton.addEventListener('click', () => {
        const ciphertext = ciphertextInput.value;
        
        displayMessage('', resultOutput);
        decryptedOutput.value = '';
        

        if (!ciphertext || ciphertext.trim().length < 2000) {
            displayMessage('<div style="color: red; padding: 10px;">Inserisci un testo cifrato di almeno 2000 caratteri per un\'analisi accurata.</div>', resultOutput);
            return;
        }

        const analysisResult = frequency_analysis(ciphertext);
        const { rot, min_lang, distances, enc_frequency } = analysisResult;
        console.log(distances)

        if (rot === null) {
            displayMessage('<div style="color: orange; padding: 10px;">Impossibile eseguire l\'analisi. Il testo non contiene lettere valide.</div>', resultOutput);
            return;
        }

        const decryptedText = decrypt(ciphertext, rot);
        decryptedOutput.value = decryptedText;

        let outputHTML = `
            <h2>Analysis Result (Decifratura Automatica)</h2>
            <p><strong>Language detected:</strong> <span style="font-size: 1.2em; color: #10B981;">${min_lang}</span></p>
            <p><strong>Rotation:</strong> <span style="font-size: 1.2em; color: #3B82F6;">${rot}</span></p>
            <hr class="my-3">
            <h3>Measures of Similarity</h3>
            <table class="w-full text-left border-collapse mt-2 text-sm">
                <thead>
                    <tr><th class="py-2 px-4 border-b">Lingua</th><th class="py-2 px-4 border-b">Distance</th></tr>
                </thead>
                <tbody>
        `;
        
        const sortedDistances = Object.entries(distances).sort((a, b) => a[1] - b[1]);
        

        sortedDistances.forEach(([lang, dist]) => {
            outputHTML += `<tr><td class="py-1 px-4 border-b">${lang}</td><td class="py-1 px-4 border-b">${dist.toFixed(4)}</td></tr>`;
        });

        outputHTML += `</tbody></table>`;

        displayMessage(outputHTML, resultOutput);
    });
});



