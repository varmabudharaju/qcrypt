interface Explanation {
  explanation: string;
  replacement: string;
}

const explanations: Record<string, Explanation> = {
  RSA: {
    explanation: "RSA relies on the difficulty of factoring large integers. Shor's algorithm on a quantum computer can factor these in polynomial time, completely breaking RSA at any key size.",
    replacement: 'ML-KEM (FIPS 203) for key encapsulation, ML-DSA (FIPS 204) for digital signatures. These are NIST-standardized post-quantum replacements.',
  },
  ECDSA: {
    explanation: "ECDSA relies on the elliptic curve discrete logarithm problem. Shor's algorithm solves this efficiently on a quantum computer, breaking all ECC-based schemes regardless of curve size.",
    replacement: 'ML-DSA (FIPS 204) for digital signatures, or SLH-DSA (FIPS 205) for hash-based signatures with minimal security assumptions.',
  },
  ECDH: {
    explanation: "ECDH key exchange relies on the same elliptic curve math broken by Shor's algorithm. Any captured ECDH key exchanges could be decrypted retroactively once quantum computers exist (harvest-now, decrypt-later attack).",
    replacement: 'ML-KEM (FIPS 203) for key encapsulation. Consider hybrid ML-KEM + X25519 during the transition period.',
  },
  DSA: {
    explanation: "DSA is based on the discrete logarithm problem, which Shor's algorithm solves efficiently. Already deprecated by NIST even without quantum threats.",
    replacement: 'ML-DSA (FIPS 204) for digital signatures.',
  },
  DH: {
    explanation: "Diffie-Hellman key exchange relies on the discrete logarithm problem, broken by Shor's algorithm. Captured DH exchanges are vulnerable to harvest-now, decrypt-later attacks.",
    replacement: 'ML-KEM (FIPS 203) for key encapsulation.',
  },
  EdDSA: {
    explanation: "EdDSA (including Ed25519) is an elliptic curve scheme broken by Shor's algorithm, despite being more modern than ECDSA.",
    replacement: 'ML-DSA (FIPS 204) for digital signatures.',
  },
  Ed25519: {
    explanation: "Ed25519 uses Curve25519, an elliptic curve vulnerable to Shor's algorithm. While excellent classically, it offers zero protection against quantum attacks.",
    replacement: 'ML-DSA (FIPS 204) for digital signatures.',
  },
  X25519: {
    explanation: "X25519 key exchange uses elliptic curve math broken by Shor's algorithm. Actively targeted in harvest-now, decrypt-later scenarios.",
    replacement: 'ML-KEM (FIPS 203), or hybrid ML-KEM + X25519 during transition.',
  },
  'P-256': {
    explanation: "The P-256 curve (secp256r1/prime256v1) is an elliptic curve broken by Shor's algorithm.",
    replacement: 'ML-KEM or ML-DSA depending on use case (key exchange vs signatures).',
  },
  'P-384': {
    explanation: "The P-384 curve is an elliptic curve broken by Shor's algorithm. Larger curves do not help against quantum attacks.",
    replacement: 'ML-KEM or ML-DSA depending on use case.',
  },
  secp256k1: {
    explanation: "secp256k1 (used in Bitcoin/Ethereum) is an elliptic curve broken by Shor's algorithm. Cryptocurrency signatures are especially high-value targets.",
    replacement: 'ML-DSA (FIPS 204) or SLH-DSA (FIPS 205) for signatures.',
  },
  'AES-128': {
    explanation: "Grover's algorithm halves AES-128's effective security to 64 bits, which is dangerously low. While AES itself isn't broken, 128-bit keys become insufficient.",
    replacement: 'AES-256 provides 128 bits of post-quantum security, which is considered safe.',
  },
  'AES-192': {
    explanation: "Grover's algorithm reduces AES-192's effective security to 96 bits. While still usable, the reduced margin makes AES-256 preferable.",
    replacement: 'AES-256 for full quantum resistance with comfortable security margins.',
  },
  'AES-256': {
    explanation: "AES-256 is quantum-resistant. Grover's algorithm reduces it to 128-bit equivalent security, which remains safe. No migration needed.",
    replacement: 'No change needed. AES-256 is already quantum-safe.',
  },
  DES: {
    explanation: 'DES uses 56-bit keys, already broken classically. Quantum attacks make it even worse. Should have been replaced decades ago.',
    replacement: 'AES-256-GCM for symmetric encryption.',
  },
  '3DES': {
    explanation: '3DES (Triple DES) has an effective key size of 112 bits, reduced to 56 bits by Grover\'s algorithm. Also has a 64-bit block size vulnerable to Sweet32 attacks.',
    replacement: 'AES-256-GCM for symmetric encryption.',
  },
  RC4: {
    explanation: 'RC4 is broken classically with multiple practical attacks. Quantum attacks are irrelevant — this should not be used at all.',
    replacement: 'AES-256-GCM or ChaCha20-Poly1305 for stream encryption.',
  },
  MD5: {
    explanation: 'MD5 is broken classically — collisions can be generated in seconds. Quantum attacks via Grover\'s further reduce its security. Should not be used for any security purpose.',
    replacement: 'SHA-3 or SHA-256 for hashing. For password hashing, use Argon2 or bcrypt.',
  },
  'SHA-1': {
    explanation: 'SHA-1 is broken classically — practical collision attacks exist (SHAttered, 2017). Quantum attacks further weaken it. Deprecated by NIST.',
    replacement: 'SHA-256 or SHA-3 for secure hashing.',
  },
  'SHA-256': {
    explanation: "SHA-256 is quantum-resistant. Grover's algorithm reduces it to 128-bit collision resistance, which remains safe. No migration needed.",
    replacement: 'No change needed. SHA-256 is already quantum-safe.',
  },
  'SHA-384': {
    explanation: 'SHA-384 is quantum-resistant with comfortable margins. No migration needed.',
    replacement: 'No change needed.',
  },
  'SHA-512': {
    explanation: 'SHA-512 is quantum-resistant with excellent margins. No migration needed.',
    replacement: 'No change needed.',
  },
  'SHA-3': {
    explanation: 'SHA-3 is quantum-resistant. Based on a completely different construction (Keccak) from SHA-2, providing algorithm diversity.',
    replacement: 'No change needed. SHA-3 is already quantum-safe.',
  },
  'ML-KEM': {
    explanation: 'ML-KEM (formerly Kyber) is a NIST-standardized post-quantum key encapsulation mechanism. It is quantum-resistant by design.',
    replacement: 'No change needed. This is a post-quantum algorithm.',
  },
  'ML-DSA': {
    explanation: 'ML-DSA (formerly Dilithium) is a NIST-standardized post-quantum digital signature scheme. It is quantum-resistant by design.',
    replacement: 'No change needed. This is a post-quantum algorithm.',
  },
  'SLH-DSA': {
    explanation: 'SLH-DSA (formerly SPHINCS+) is a NIST-standardized hash-based post-quantum signature scheme. It is quantum-resistant with minimal security assumptions.',
    replacement: 'No change needed. This is a post-quantum algorithm.',
  },
};

const fallback: Explanation = {
  explanation: 'This cryptographic algorithm may be vulnerable to quantum computing attacks. Review its quantum security properties.',
  replacement: 'Consult NIST post-quantum cryptography standards (FIPS 203, 204, 205) for appropriate replacements.',
};

export function getExplanation(algorithm: string): Explanation {
  return explanations[algorithm] ?? fallback;
}
