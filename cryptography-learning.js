/* Cryptography & Mathematical Algorithms — theory and language-specific code examples. */
(() => {
  'use strict';
  const languages = ['C', 'C++', 'Python', 'Java', 'JavaScript'];
  const topics = [
    {
      title: 'Euclidean Algorithm — Greatest Common Divisor',
      idea: 'The Euclidean algorithm uses gcd(a, b) = gcd(b, a mod b). Each iteration replaces the larger problem with a smaller remainder problem. When the second value becomes zero, the first value is the GCD.',
      steps: '1. Start with non-negative integers a and b. 2. Compute r = a mod b. 3. Set (a, b) = (b, r). 4. Repeat until b = 0; return a.',
      use: 'Simplifying fractions, computing coprimality, and supporting modular inverses used in number theory and public-key cryptography.',
      avoid: 'The basic version assumes integers and should normalize negative inputs if your application permits them. GCD alone does not compute a modular inverse; use extended Euclid for that.',
      complexity: 'Time: O(log min(a,b)) for positive inputs. Auxiliary space: O(1) for the iterative implementation.',
      codes: {
        C: `long long gcd(long long a, long long b) {\n    while (b != 0) {\n        long long r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}\n\n/* Example: gcd(462, 108) returns 6. */`,
        'C++': `long long gcd(long long a, long long b) {\n    while (b != 0) {\n        const long long r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}\n\n// Example: gcd(462, 108) == 6`,
        Python: `def gcd(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\nprint(gcd(462, 108))  # 6`,
        Java: `static long gcd(long a, long b) {\n    while (b != 0) {\n        long r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}\n\n// gcd(462, 108) returns 6`,
        JavaScript: `function gcd(a, b) {\n    while (b !== 0) {\n        const r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}\n\nconsole.log(gcd(462, 108)); // 6`
      }
    },
    {
      title: 'Sieve of Eratosthenes — Prime Generation',
      idea: 'The sieve finds every prime up to a limit n by initially treating numbers from 2 to n as prime, then marking multiples of each surviving prime as composite. Marking starts at p² because smaller multiples have already been handled.',
      steps: '1. Create a Boolean array and mark values below 2 as non-prime. 2. For each p while p² ≤ n, if p is prime, mark p², p²+p, … as composite. 3. Remaining unmarked values are prime.',
      use: 'Generating many primes within a known upper bound, prime tables, and educational demonstrations of number theory.',
      avoid: 'For a single very large prime candidate, a primality test may use less memory. A standard sieve uses O(n) memory and is not suitable for limits that cannot fit in memory.',
      complexity: 'Time: O(n log log n). Auxiliary space: O(n).',
      codes: {
        C: `#include <stdbool.h>\n#include <stdlib.h>\n\nvoid sieve(int n, bool prime[]) {\n    for (int i = 0; i <= n; ++i) prime[i] = true;\n    if (n >= 0) prime[0] = false;\n    if (n >= 1) prime[1] = false;\n\n    for (int p = 2; p <= n / p; ++p) {\n        if (prime[p]) {\n            for (int j = p * p; j <= n; j += p)\n                prime[j] = false;\n        }\n    }\n}`,
        'C++': `#include <vector>\nusing namespace std;\n\nvector<bool> sieve(int n) {\n    vector<bool> prime(n + 1, true);\n    if (n >= 0) prime[0] = false;\n    if (n >= 1) prime[1] = false;\n\n    for (int p = 2; p <= n / p; ++p) {\n        if (prime[p]) {\n            for (int j = p * p; j <= n; j += p)\n                prime[j] = false;\n        }\n    }\n    return prime;\n}`,
        Python: `def sieve(n):\n    prime = [True] * (n + 1)\n    if n >= 0:\n        prime[0] = False\n    if n >= 1:\n        prime[1] = False\n\n    p = 2\n    while p * p <= n:\n        if prime[p]:\n            for multiple in range(p * p, n + 1, p):\n                prime[multiple] = False\n        p += 1\n    return prime`,
        Java: `static boolean[] sieve(int n) {\n    boolean[] prime = new boolean[n + 1];\n    java.util.Arrays.fill(prime, true);\n    if (n >= 0) prime[0] = false;\n    if (n >= 1) prime[1] = false;\n\n    for (int p = 2; p <= n / p; p++) {\n        if (prime[p]) {\n            for (int j = p * p; j <= n; j += p)\n                prime[j] = false;\n        }\n    }\n    return prime;\n}`,
        JavaScript: `function sieve(n) {\n    const prime = Array(n + 1).fill(true);\n    prime[0] = false;\n    if (n >= 1) prime[1] = false;\n\n    for (let p = 2; p * p <= n; p++) {\n        if (prime[p]) {\n            for (let j = p * p; j <= n; j += p) {\n                prime[j] = false;\n            }\n        }\n    }\n    return prime;\n}`
      }
    },
    {
      title: 'Modular Exponentiation — Square and Multiply',
      idea: 'Modular exponentiation computes a^b mod m without constructing the enormous integer a^b. It processes the exponent in binary, repeatedly squaring the current value and multiplying by a when the current bit is 1.',
      steps: '1. Set result = 1 and reduce the base modulo m. 2. While exponent > 0, multiply result by base when the exponent is odd. 3. Square the base modulo m and halve the exponent. 4. Return result.',
      use: 'RSA operations, modular arithmetic, primality testing, and computations over finite fields.',
      avoid: 'Use a sufficiently wide integer type or a big-integer library: the intermediate multiplication can overflow before the modulo is applied. Cryptographic implementations must also consider timing side channels.',
      complexity: 'Time: O(log b) modular multiplications. Auxiliary space: O(1), excluding big-integer storage.',
      codes: {
        C: `long long mod_pow(long long a, long long e, long long m) {\n    long long result = 1 % m;\n    a %= m;\n    while (e > 0) {\n        if (e & 1) result = (result * a) % m;\n        a = (a * a) % m;\n        e >>= 1;\n    }\n    return result;\n}\n/* Use overflow-safe multiplication for large values. */`,
        'C++': `long long modPow(long long a, long long e, long long m) {\n    long long result = 1 % m;\n    a %= m;\n    while (e > 0) {\n        if (e & 1LL) result = (result * a) % m;\n        a = (a * a) % m;\n        e >>= 1;\n    }\n    return result;\n}\n// Use a big-integer type for large cryptographic inputs.`,
        Python: `def mod_pow(a, exponent, modulus):\n    result = 1 % modulus\n    a %= modulus\n    while exponent > 0:\n        if exponent & 1:\n            result = (result * a) % modulus\n        a = (a * a) % modulus\n        exponent >>= 1\n    return result\n\n# Python also provides pow(a, exponent, modulus).`,
        Java: `static long modPow(long a, long exponent, long modulus) {\n    long result = 1 % modulus;\n    a %= modulus;\n    while (exponent > 0) {\n        if ((exponent & 1L) != 0)\n            result = (result * a) % modulus;\n        a = (a * a) % modulus;\n        exponent >>= 1;\n    }\n    return result;\n}\n// BigInteger.modPow is safer for large values.`,
        JavaScript: `function modPow(a, exponent, modulus) {\n    let result = 1n;\n    a = BigInt(a) % BigInt(modulus);\n    exponent = BigInt(exponent);\n    modulus = BigInt(modulus);\n    while (exponent > 0n) {\n        if (exponent & 1n) result = (result * a) % modulus;\n        a = (a * a) % modulus;\n        exponent >>= 1n;\n    }\n    return result;\n}`
      }
    },
    {
      title: 'RSA — Public-Key Cryptography',
      idea: 'RSA derives a public key from modulus n = p × q and public exponent e. The private exponent d is the modular inverse of e modulo φ(n) (or an appropriate RSA exponent modulus). Real RSA encryption uses a standard padding scheme such as OAEP; signatures use a scheme such as PSS.',
      steps: '1. Choose large secret primes p and q. 2. Compute n and φ(n). 3. Choose e coprime to φ(n) and calculate d = e⁻¹ mod φ(n). 4. Use modular exponentiation with a secure padding/signature scheme.',
      use: 'Public-key encryption of small session keys and digital signatures when implemented with a vetted cryptographic library and correct padding.',
      avoid: 'Do not use textbook RSA (raw m^e mod n) in real systems. The visualizer uses small demonstration numbers and is not secure; never implement production RSA from scratch.',
      complexity: 'Key operations depend on big-integer multiplication and key size; modular exponentiation is polynomial in the bit length. Key generation and private operations are substantially more expensive than symmetric encryption.',
      codes: {
        C: `/* Production example: use a vetted crypto library (e.g., OpenSSL). */\n#include <openssl/evp.h>\n\n/* Conceptual API flow: load/generate an RSA key, then use\n   EVP_PKEY_encrypt_init + RSA-OAEP padding for encryption.\n   For signatures, use EVP_DigestSign with RSA-PSS. */\n\n/* Never deploy textbook RSA: m^e mod n without padding. */`,
        'C++': `// Production RSA should use a vetted crypto library.\n// Example API family: OpenSSL EVP_PKEY.\nEVP_PKEY_CTX* ctx = EVP_PKEY_CTX_new(publicKey, nullptr);\nEVP_PKEY_encrypt_init(ctx);\nEVP_PKEY_CTX_set_rsa_padding(\n    ctx, RSA_PKCS1_OAEP_PADDING);\n// Set an approved OAEP digest, then encrypt the data.\n// Check every return value and free the context.`,
        Python: `from cryptography.hazmat.primitives.asymmetric import padding\nfrom cryptography.hazmat.primitives import hashes\n\n# private_key is an RSA private key from a vetted library.\nciphertext = public_key.encrypt(\n    b"session key",\n    padding.OAEP(\n        mgf=padding.MGF1(algorithm=hashes.SHA256()),\n        algorithm=hashes.SHA256(),\n        label=None,\n    ),\n)\n# Use PSS with a hash for digital signatures.`,
        Java: `import javax.crypto.Cipher;\n\n// private/public keys should come from a secure key store.\nCipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");\nrsa.init(Cipher.ENCRYPT_MODE, publicKey);\nbyte[] ciphertext = rsa.doFinal(sessionKeyBytes);\n// Confirm provider OAEP parameters match your security policy.`,
        JavaScript: `import { publicEncrypt, constants } from 'node:crypto';\n\nconst ciphertext = publicEncrypt({\n    key: publicKeyPem,\n    padding: constants.RSA_PKCS1_OAEP_PADDING,\n    oaepHash: 'sha256'\n}, Buffer.from('session key'));\n// Keep private keys protected; prefer vetted APIs and defaults.`
      }
    },
    {
      title: 'AES — Advanced Encryption Standard',
      idea: 'AES is a symmetric block cipher operating on 128-bit blocks. AES-128 uses a 128-bit key and 10 rounds of transformations; AES-192 and AES-256 use 12 and 14 rounds. Encryption is normally used through a secure mode of operation rather than as a raw block cipher.',
      steps: '1. Expand the key into round keys. 2. Apply the initial AddRoundKey. 3. Perform SubBytes, ShiftRows, MixColumns and AddRoundKey in the main rounds. 4. The final round omits MixColumns. In applications, use an authenticated mode such as AES-GCM.',
      use: 'Fast bulk encryption for files, network traffic, backups and stored data. Prefer authenticated encryption (AES-GCM) when supported.',
      avoid: 'Do not reuse a nonce with the same key in GCM. Do not invent a mode, omit authentication, or use ECB for ordinary data. The visualizer shows round transformations, not a production encryption API.',
      complexity: 'For a fixed number of AES rounds, time is O(n) in the number of blocks. AES has a 128-bit block size; key sizes are 128, 192 or 256 bits.',
      codes: {
        C: `/* OpenSSL EVP example: authenticated AES-256-GCM. */\n#include <openssl/evp.h>\n\nEVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();\nEVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);\nEVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, ivLen, NULL);\nEVP_EncryptInit_ex(ctx, NULL, NULL, key, nonce);\nEVP_EncryptUpdate(ctx, out, &outLen, in, inLen);\nEVP_EncryptFinal_ex(ctx, out + outLen, &finalLen);\n/* Retrieve and store the authentication tag; check errors. */`,
        'C++': `// OpenSSL EVP is a common vetted API for AES-GCM.\nEVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();\nEVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr);\nEVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, ivLen, nullptr);\nEVP_EncryptInit_ex(ctx, nullptr, nullptr, key, nonce);\nEVP_EncryptUpdate(ctx, out, &outLen, in, inLen);\nEVP_EncryptFinal_ex(ctx, out + outLen, &finalLen);\n// Obtain the tag and verify all API return values.`,
        Python: `from cryptography.hazmat.primitives.ciphers.aead import AESGCM\nimport os\n\nkey = AESGCM.generate_key(bit_length=256)\naesgcm = AESGCM(key)\nnonce = os.urandom(12)  # unique for each encryption per key\nciphertext_and_tag = aesgcm.encrypt(\n    nonce, b"confidential data", associated_data=None\n)\nplaintext = aesgcm.decrypt(nonce, ciphertext_and_tag, None)`,
        Java: `import javax.crypto.Cipher;\nimport javax.crypto.spec.GCMParameterSpec;\n\nCipher aes = Cipher.getInstance("AES/GCM/NoPadding");\naes.init(Cipher.ENCRYPT_MODE, secretKey,\n    new GCMParameterSpec(128, nonce));\nbyte[] ciphertextAndTag = aes.doFinal(plaintext);\n// Generate a unique nonce for every encryption with this key.`,
        JavaScript: `import { createCipheriv, randomBytes } from 'node:crypto';\n\nconst key = randomBytes(32);\nconst nonce = randomBytes(12);\nconst cipher = createCipheriv('aes-256-gcm', key, nonce);\nconst ciphertext = Buffer.concat([\n    cipher.update(plaintext), cipher.final()\n]);\nconst tag = cipher.getAuthTag();\n// Store nonce and tag with ciphertext; never reuse the nonce/key pair.`
      }
    },
    {
      title: 'Cryptographic Hashing — SHA-256 and MD5',
      idea: 'A cryptographic hash maps input of arbitrary length to a fixed-length digest. SHA-256 outputs 256 bits and is widely used for integrity checks and as a component of secure protocols. MD5 outputs 128 bits but is collision-broken and must not be used where collision resistance or security is required.',
      steps: '1. Encode the message as bytes. 2. The hash function pads and processes fixed-size blocks. 3. Compression rounds update internal state. 4. Serialize the final state as the digest. For password storage, use a dedicated password-hashing scheme instead of a fast general-purpose hash.',
      use: 'File integrity checks, content identifiers, digital-signature workflows, and HMAC-based message authentication (with a suitable hash).',
      avoid: 'Never use MD5 for digital signatures or security-sensitive collision resistance. A plain hash is not encryption and does not authenticate a message. Do not store passwords as plain SHA-256 hashes; use Argon2id, scrypt or bcrypt with salts.',
      complexity: 'Time: O(n) in input length. SHA-256 digest size: 256 bits; MD5 digest size: 128 bits. Streaming APIs can process input without holding the entire message in memory.',
      codes: {
        C: `#include <openssl/evp.h>\n\nunsigned char digest[EVP_MAX_MD_SIZE];\nunsigned int digestLen = 0;\nEVP_Digest(data, dataLen, digest, &digestLen,\n           EVP_sha256(), NULL);\n/* Check the return value and encode digest as hexadecimal. */\n/* Avoid MD5 for security-sensitive use. */`,
        'C++': `#include <openssl/evp.h>\n#include <array>\n\nstd::array<unsigned char, 32> digest{};\nunsigned int digestLen = 0;\nEVP_Digest(data.data(), data.size(), digest.data(),\n           &digestLen, EVP_sha256(), nullptr);\n// Check the return value before using the digest.`,
        Python: `import hashlib\n\nmessage = b"integrity check"\ndigest = hashlib.sha256(message).hexdigest()\nprint(digest)\n\n# MD5 is shown only for legacy interoperability:\nlegacy = hashlib.md5(message).hexdigest()\n# Do not use MD5 for security-sensitive purposes.`,
        Java: `import java.security.MessageDigest;\nimport java.util.HexFormat;\n\nMessageDigest sha256 = MessageDigest.getInstance("SHA-256");\nbyte[] digest = sha256.digest(messageBytes);\nString hex = HexFormat.of().formatHex(digest);\n// Use HMAC when message authentication is required.`,
        JavaScript: `import { createHash } from 'node:crypto';\n\nconst digest = createHash('sha256')\n    .update('integrity check', 'utf8')\n    .digest('hex');\nconsole.log(digest);\n// Hashing alone does not provide confidentiality or authenticity.`
      }
    }
  ];

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);

  function highlight(src){return escapeHTML(src).split('\n').map(line=>{let x=line;if(/^\s*(\/\/|#|\/\*|\*|\*\/)/.test(x))return '<span class="com">'+x+'</span>';x=x.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|".*?"|'.*?')/g,'<span class="str">$1</span>');x=x.replace(/\b(return|if|else|for|while|break|continue|def|class|function|const|let|var|int|void|double|static|new|import|from|include|struct|typedef|true|false|null|None|public|private|final|boolean|vector|long|bool|range|in|not|and|or|this|Math|min|max|len|print|printf|cout|size_t|char|auto|unsigned|using|namespace|True|False|raise)\b/g,'<span class="kw">$1</span>');x=x.replace(/\b(\d+(?:\.\d+)?)\b/g,'<span class="num">$1</span>');return x;}).join('\n');}

  topics.forEach((topic, index) => {
    const host = document.getElementById(`cryptoLearning${index}`);
    if (!host) return;
    host.innerHTML = `
      <div class="learning-head">
        <div><div class="eyebrow">ALGORITHM KNOWLEDGE</div><h2>${escapeHTML(topic.title)} — Theory &amp; Code</h2></div>
        <label class="code-select">Language
          <select aria-label="Code language for ${escapeHTML(topic.title)}" class="crypto-language">
            ${languages.map((language) => `<option value="${language}">${language}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="learning-grid">
        <article class="learning-card">
          <h3>How it works</h3><p>${escapeHTML(topic.idea)}</p>
          <h3>Algorithm steps</h3><p>${escapeHTML(topic.steps)}</p>
          <h3>Where to use it</h3><p>${escapeHTML(topic.use)}</p>
          <h3>Limitations and cautions</h3><p>${escapeHTML(topic.avoid)}</p>
          <div class="learning-tags"><span>${escapeHTML(topic.title)}</span><span>Theory</span><span>Step-by-step</span></div>
        </article>
        <article class="learning-card complexity-card">
          <h3>Complexity &amp; properties</h3><p>${escapeHTML(topic.complexity)}</p>
          <h3>Implementation example</h3>
          <div class="code-window"><pre><code class="crypto-code">${highlight(topic.codes.C)}</code></pre></div>
          <p class="code-note">Indented language-specific example. Library examples are illustrative and require the named cryptographic API and error handling in a real project.</p>
        </article>
      </div>`;
    const selector = host.querySelector('.crypto-language');
    const code = host.querySelector('.crypto-code');
    selector.addEventListener('change', () => {
      code.innerHTML = highlight(topic.codes[selector.value]);
    });
  });
})();
