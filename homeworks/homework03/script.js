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
// Uses Extended Euclidean Algorithm to find 'd' s.t. (d*e) % phi == 1
function modInverse(e, phi) {
    let t = 0; 
    let newt = 1;
    let r = phi;
    let newr = e;
    
    // Stops when r become 0
    while (newr !== 0) {
        let quotient = Math.floor(r / newr);
        [t, newt] = [newt, t - quotient * newt];
        [r, newr] = [newr, r - quotient * newr];
    }
    
    // if GCD is not 1, the inverse does not exist
    if (r > 1) {
        throw new Error("e non è coprimo con phi. Impossibile trovare l'inverso.");
    }
    
    // Ensure the result is positive
    if (t < 0) {
        t = t + phi;
    }
    return t;
}

function RSA_genKeys(p, q){
    if(!p || !q || p<=1 || q<=1 || p===q){
        return {error: "p and q must be different positive prime numbers"};
    }

    const n = p *  q;
    const phi = (p-1)*(q-1);      // Euler's phi function
    let e = 3;                    // public exponent
    // while e is not coprime with phi 
    while(gcd(e, phi) !== 1){
        e++;
    }
    const d = modInverse(e, phi); // private exponent

    return {
        pub_exp: e,
        priv_exp: d,
        mod: n
    };
}

/**
 * @param {number} msg - plaintext
 * @param {number} e - public exponent
 * @param {number} n - modulus
 */
function RSA_encrypt(msg, e, n){
    return powerMod(msg, e, n); // msg^e mod(n)
}

/**
 * @param {number} c - ciphertext
 * @param {number} d - private exponent
 * @param {number} n - modulus
 */
function RSA_decrypt(c, d, n){
    return powerMod(c, d, n);
}

function main(){
    // choose p q big enough s.t. n = p*q > max ASCII value (127)
    const p = 19;
    const q = 17;

    test(p,q);
}






function test(p, q){
    const plaintext = "Text example";
    let ciphertext = "";

    const {pub_exp, priv_exp, mod} = RSA_genKeys(p, q);

    for(let chr of plaintext){
        if(chr != " "){
            let enc_chr = RSA_encrypt(chr.charCodeAt(0), pub_exp, mod);
            ciphertext += String.fromCharCode(enc_chr);
            console.log(chr + "->" + chr.charCodeAt(0) + " =enc=> " + enc_chr + " =dec=> " + RSA_decrypt(enc_chr, priv_exp, mod));
        }else{
            ciphertext += " "
        }
    }
    console.log("\n" + plaintext + " --> " + ciphertext)
}


//=============MAIN CALL======================
main()