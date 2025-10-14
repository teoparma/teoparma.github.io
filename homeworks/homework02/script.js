const language_frequencies = [
    {
        language: 'EN', // Inglese
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
        language: 'IT', // Italiano
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
        language: 'FR', // Francese
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
        language: 'DE', // Tedesco
        frequency: new Map([
            ['E', 15.99], ['N', 9.77], ['I', 7.00], ['S', 7.82], ['A', 6.51],
            ['R', 7.00], ['T', 6.15], ['D', 5.08], ['H', 1.95], ['U', 4.34],
            ['L', 3.43], ['C', 2.73], ['G', 3.00], ['M', 2.53], ['O', 2.59],
            ['B', 1.89], ['W', 1.87], ['F', 1.69], ['K', 1.14], ['Z', 1.13],
            ['P', 0.79], ['V', 0.84], ['J', 0.17], ['Y', 0.07], ['X', 0.04],
            ['Q', 0.02]
        ])
    },
    {
        language: 'ES', // Spagnolo
        frequency: new Map([
            ['E', 13.58], ['A', 11.72], ['O', 8.68], ['L', 6.64], ['R', 6.77],
            ['S', 7.98], ['I', 5.86], ['D', 4.67], ['U', 4.68], ['T', 4.40],
            ['C', 3.87], ['M', 3.01], ['P', 2.51], ['B', 1.49], ['G', 1.01],
            ['H', 0.70], ['F', 0.69], ['V', 1.05], ['J', 0.52], ['N', 0.31],
            ['X', 0.11], ['Z', 0.47], ['Q', 0.88], ['Y', 1.09], ['K', 0.02],
            ['W', 0.01]
        ])
    },
    {
        language: 'PT', // Portoghese
        frequency: new Map([
            ['A', 14.63], ['E', 11.69], ['O', 10.64], ['S', 7.35], ['R', 6.73],
            ['I', 6.18], ['N', 8.32], ['T', 5.06], ['M', 3.08], ['D', 5.01],
            ['L', 5.00], ['P', 2.76], ['U', 4.63], ['C', 3.88], ['H', 0.92],
            ['V', 1.67], ['G', 1.30], ['B', 1.04], ['F', 1.12], ['Q', 1.39],
            ['Z', 0.23], ['J', 0.31], ['K', 0.01], ['W', 0.01], ['Y', 0.01],
            ['X', 0.23]
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

    var distance = {}
    var language, freq_map, i

    //compute distances
    for(lang of language_frequencies){
        i=0
        language = lang.language
        freq_map = lang.frequency   
        distance[language] = 0

        //language frequencies are ordered yet
        for(const [_, value] of enc_frequency){
            exp_value = [...freq_map.entries()][i][1]
            distance[language] += ((value - exp_value)**2)/exp_value
            i += 1
        }

        //console.log("distance for language %s: %d", language, distance[language])
    }

    //take the language with the smallest distance from enc_frequency
    const [min_lang, _] = Object.entries(distance).reduce((a, b) =>  a[1] < b[1] ? a : b )
    //console.log("Language detected: %s", min_lang)

    const language_map = language_frequencies.find(item => item.language === min_lang)

    //compute rotation
    const Acode = 'A'.charCodeAt(0); //65
    const firstLetter = (enc_frequency.entries().next().value[1][0]).charCodeAt(0) - Acode
    const secondLetter = (language_map.frequency.keys().next().value).charCodeAt(0) - Acode

    const rot = (firstLetter - secondLetter + 26) % 26
    //console.log("rotation: %d", rot)

    return { rot, min_lang, distance, enc_frequency }
}

function encrypt(plaintext, rot) {
    let ciphertext = '';
    const ALPHABET_SIZE = 26;
    
    for (let i = 0; i < plaintext.length; i++) {
        const char = plaintext[i];
        const charCode = char.toUpperCase().charCodeAt(0);
        
        if (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) {
            // Calcola la nuova posizione
            let newCharCode = charCode - 'A'.charCodeAt(0);
            
            // Applica la cifratura: (Indice + Rotazione) % 26
            newCharCode = (newCharCode + rot) % ALPHABET_SIZE;
            
            // Riconverte in carattere
            let newChar = String.fromCharCode(newCharCode + 'A'.charCodeAt(0));
            
            // Mantieni la cassa originale
            ciphertext += (char === char.toUpperCase()) ? newChar : newChar.toLowerCase();
        } else {
            // Mantiene spazi e punteggiatura
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

    // Funzione helper per visualizzare i messaggi nell'area di output
    function displayMessage(message, targetElement) {
        targetElement.innerHTML = message;
    }
    
    // Funzione per validare la chiave (utilizzata sia in cifratura che decifratura manuale)
    function getValidKey() {
        const key = parseInt(keyInput.value, 10);
        if (isNaN(key) || key < 0 || key > 25) {
            // Uso una div invece di alert() come richiesto dalle istruzioni
            displayMessage('<div style="color: red; padding: 10px;">Errore: La chiave deve essere un numero intero tra 0 e 25.</div>', resultOutput);
            return null;
        }
        return key;
    }

    // Listener per il pulsante di CIFRATURA
    encryptButton.addEventListener('click', () => {
        const plaintext = plaintextInput.value;
        const rot = getValidKey();

        displayMessage('', resultOutput);
        encryptedOutput.value = '';

        if (!plaintext || plaintext.trim().length === 0) {
            displayMessage('<div style="color: red; padding: 10px;">Inserisci un testo da cifrare nel campo di input.</div>', resultOutput);
            return;
        }
        
        if (rot === null) return; // Errore già mostrato da getValidKey

        // 1. Cifra il testo
        const encryptedText = encrypt(plaintext, rot);
        encryptedOutput.value = encryptedText;

        // 2. Visualizzazione del risultato
        /*displayMessage(`
            <h2>Operazione Eseguita</h2>
            <p><strong>Modalità:</strong> Cifratura (Encode)</p>
            <p><strong>Chiave (Rotazione):</strong> <span style="font-size: 1.2em; color: #3B82F6;">${rot}</span></p>
            <p>Testo cifrato generato con successo.</p>
        `, resultOutput);*/
    });


    // Listener per il pulsante di DECIFRATURA (Analisi)
    analyzeButton.addEventListener('click', () => {
        const ciphertext = ciphertextInput.value;
        
        // Pulizia dell'output
        displayMessage('', resultOutput);
        decryptedOutput.value = '';
        

        if (!ciphertext || ciphertext.trim().length < 10) { // Aumenta il minimo per una buona analisi
            displayMessage('<div style="color: red; padding: 10px;">Inserisci un testo cifrato di almeno 10 caratteri per un\'analisi accurata.</div>', resultOutput);
            return;
        }

        // 1. Esegue l'analisi e la comparazione
        const analysisResult = frequency_analysis(ciphertext);
        const { rot, min_lang, distances, enc_sorted_array } = analysisResult;

        // Controlla se l'analisi ha trovato una rotazione
        if (rot === null) {
            displayMessage('<div style="color: orange; padding: 10px;">Impossibile eseguire l\'analisi. Il testo non contiene lettere valide.</div>', resultOutput);
            return;
        }

        // 2. Decifra il testo
        const decryptedText = decrypt(ciphertext, rot);
        decryptedOutput.value = decryptedText;

        // 3. Visualizzazione dei risultati
        let outputHTML = `
            <h2>Risultati Analisi (Decifratura Automatica)</h2>
            <p><strong>Lingua Rilevata:</strong> <span style="font-size: 1.2em; color: #10B981;">${min_lang}</span></p>
            <p><strong>Chiave (Rotazione):</strong> <span style="font-size: 1.2em; color: #3B82F6;">${rot}</span></p>
            <hr class="my-3">
            <h3>Distanze di Somiglianza (Minore è, Meglio è)</h3>
            <table class="w-full text-left border-collapse mt-2 text-sm">
                <thead>
                    <tr><th class="py-2 px-4 border-b">Lingua</th><th class="py-2 px-4 border-b">Distanza ($(\sum (f_{oss}-f_{att})^2)$)</th></tr>
                </thead>
                <tbody>
        `;
        
        // Ordina le distanze per mostrarle dalla più vicina alla più lontana
        /*const sortedDistances = Object.entries(distances).sort((a, b) => a[1] - b[1]);
        

        sortedDistances.forEach(([lang, dist]) => {
            outputHTML += `<tr><td class="py-1 px-4 border-b">${lang}</td><td class="py-1 px-4 border-b">${dist.toFixed(4)}</td></tr>`;
        });*/

        outputHTML += `</tbody></table>`;

        displayMessage(outputHTML, resultOutput);
    });
});



