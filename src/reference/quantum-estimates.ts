// ── Quantum Break Time Estimates ──
//
// All quantum break times assume a Cryptographically Relevant Quantum Computer
// (CRQC) with sufficient logical qubits and error correction. No such computer
// exists today. Wallclock times depend on gate speeds and error correction
// overhead — estimates below use commonly assumed parameters from the literature.
//
// Key sources:
//   [1] Gidney & Ekerå (2021). "How to factor 2048 bit RSA integers in 8 hours
//       using 20 million noisy qubits." Quantum 5, 433.
//       https://doi.org/10.22331/q-2021-04-15-433
//
//   [2] Roetteler, Naehrig, Svore, Lauter (2017). "Quantum Resource Estimates
//       for Computing Elliptic Curve Discrete Logarithms." ASIACRYPT 2017.
//       https://doi.org/10.1007/978-3-319-70697-9_9
//       Note: provides gate counts and qubit requirements, NOT wallclock times.
//
//   [3] Grassl, Langenberg, Roetteler, Steinwandt (2016). "Applying Grover's
//       Algorithm to AES: Quantum Resource Estimates." PQCrypto 2016.
//       https://doi.org/10.1007/978-3-319-29360-8_3
//
//   [4] NIST IR 8547 (2024, Initial Public Draft). "Transition to Post-Quantum
//       Cryptography Standards." https://csrc.nist.gov/pubs/ir/8547/ipd
//
//   [5] Proos & Zalka (2003). "Shor's discrete logarithm quantum algorithm for
//       elliptic curves." QIC 3(4), 317-344.
//
// Important caveats:
// - Grover's algorithm is inherently sequential — adding more qubits does not
//   speed it up. Practical Grover attacks are far slower than raw operation
//   counts suggest. (Zalka, 1999; NIST PQC standardization discussion)
// - Physical-to-logical qubit ratios vary widely (1,000:1 to 20,000:1)
//   depending on error correction code, target error rate, and code distance.
// - ECC wallclock estimates are extrapolated from gate counts, not directly
//   measured or simulated.

export type ThreatLevel =
  | 'broken-classical'   // Already broken without quantum computers (MD5, DES, SHA-1)
  | 'broken-quantum'     // Fully broken by Shor's algorithm — exponential speedup (RSA, ECC)
  | 'weakened'           // Security halved by Grover's — borderline (AES-128)
  | 'quantum-safe';      // Survives quantum attacks at acceptable security level (AES-256, SHA-256)

export interface QuantumEstimate {
  algorithm: string;
  classicalBreakTime: string;
  quantumBreakTime: string;
  quantumAlgorithm: string;
  speedup: string;
  qubitsRequired: string;
  threatLevel: ThreatLevel;
  citation: string;
  notes: string;
}

const ESTIMATES: Record<string, QuantumEstimate> = {
  'RSA': {
    algorithm: 'RSA-2048',
    classicalBreakTime: '~300 trillion CPU-years (via GNFS)',
    quantumBreakTime: '~8 hours',
    quantumAlgorithm: "Shor's algorithm",
    speedup: 'exponential',
    qubitsRequired: '20 million noisy qubits',
    threatLevel: 'broken-quantum',
    citation: 'Gidney & Ekerå, 2021 [1]',
    notes: 'Assumes RSA-2048 (most common). RSA-4096 estimated ~2x resources (extrapolation, not directly from paper).',
  },
  'ECDSA': {
    algorithm: 'ECDSA (P-256)',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: 'Minutes to hours (estimated from gate counts)',
    quantumAlgorithm: "Shor's algorithm (ECDLP variant)",
    speedup: 'exponential',
    qubitsRequired: '2,330 logical qubits for P-256',
    threatLevel: 'broken-quantum',
    citation: 'Roetteler et al., 2017 [2]',
    notes: 'Paper gives ~1.26×10^11 Toffoli gates for P-256. Wallclock time depends on gate speed assumptions. All standard ECC curves are vulnerable but require different resources per curve size.',
  },
  'ECDH': {
    algorithm: 'ECDH (P-256)',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: 'Minutes to hours (estimated from gate counts)',
    quantumAlgorithm: "Shor's algorithm (ECDLP variant)",
    speedup: 'exponential',
    qubitsRequired: '2,330 logical qubits for P-256',
    threatLevel: 'broken-quantum',
    citation: 'Roetteler et al., 2017 [2]',
    notes: 'Key exchange — highest HNDL priority. Same ECDLP vulnerability as ECDSA.',
  },
  'Ed25519': {
    algorithm: 'Ed25519 (Curve25519)',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: 'Minutes to hours (estimated, comparable to P-256)',
    quantumAlgorithm: "Shor's algorithm (ECDLP variant)",
    speedup: 'exponential',
    qubitsRequired: '~2,000 logical qubits (estimated via Proos & Zalka formula: ~6n for n-bit curve)',
    threatLevel: 'broken-quantum',
    citation: 'Proos & Zalka, 2003 [5]',
    notes: 'Roetteler et al. analyzed NIST curves, not Curve25519 specifically. Qubit estimate uses generic formula from Proos & Zalka. Same vulnerability class as NIST ECC.',
  },
  'DSA': {
    algorithm: 'DSA (2048-bit)',
    classicalBreakTime: '~2^112 operations',
    quantumBreakTime: '~hours (analogous to RSA-2048)',
    quantumAlgorithm: "Shor's algorithm (DLP variant)",
    speedup: 'exponential',
    qubitsRequired: '~20 million noisy qubits (analogous to RSA-2048 factoring)',
    threatLevel: 'broken-quantum',
    citation: 'Analogous to Gidney & Ekerå, 2021 [1]',
    notes: 'DLP in Z_p* uses a related but distinct quantum circuit from RSA factoring. Resource estimates are comparable in order of magnitude. Already deprecated by NIST (FIPS 186-5, 2023).',
  },
  'DH': {
    algorithm: 'Diffie-Hellman (2048-bit)',
    classicalBreakTime: '~2^112 operations',
    quantumBreakTime: '~hours (analogous to RSA-2048)',
    quantumAlgorithm: "Shor's algorithm (DLP variant)",
    speedup: 'exponential',
    qubitsRequired: '~20 million noisy qubits (analogous to RSA-2048 factoring)',
    threatLevel: 'broken-quantum',
    citation: 'Analogous to Gidney & Ekerå, 2021 [1]',
    notes: 'Key exchange — highest HNDL risk. DLP variant of Shor\'s uses comparable resources to factoring.',
  },
  'X25519': {
    algorithm: 'X25519 (Curve25519 DH)',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: 'Minutes to hours (estimated, comparable to P-256)',
    quantumAlgorithm: "Shor's algorithm (ECDLP variant)",
    speedup: 'exponential',
    qubitsRequired: '~2,000 logical qubits (estimated via Proos & Zalka formula)',
    threatLevel: 'broken-quantum',
    citation: 'Proos & Zalka, 2003 [5]',
    notes: 'Key exchange — highest HNDL risk. Comparable vulnerability to NIST ECC curves.',
  },
  'P-256': {
    algorithm: 'NIST P-256 (secp256r1)',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: 'Minutes to hours (estimated from gate counts)',
    quantumAlgorithm: "Shor's algorithm (ECDLP variant)",
    speedup: 'exponential',
    qubitsRequired: '2,330 logical qubits',
    threatLevel: 'broken-quantum',
    citation: 'Roetteler et al., 2017 [2]',
    notes: 'Most widely deployed ECC curve. Roetteler et al. gives ~1.26×10^11 Toffoli gates.',
  },
  'secp256k1': {
    algorithm: 'secp256k1 (Bitcoin curve)',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: 'Minutes to hours (estimated, comparable to P-256)',
    quantumAlgorithm: "Shor's algorithm (ECDLP variant)",
    speedup: 'exponential',
    qubitsRequired: '~2,330 logical qubits (comparable to P-256)',
    threatLevel: 'broken-quantum',
    citation: 'Comparable to Roetteler et al., 2017 [2]',
    notes: 'Used in Bitcoin/Ethereum. Roetteler et al. analyzed NIST curves, not secp256k1 directly, but resources are comparable for same-size curves.',
  },
  'AES-128': {
    algorithm: 'AES-128',
    classicalBreakTime: '~2^128 operations',
    quantumBreakTime: '~2^64 sequential quantum ops',
    quantumAlgorithm: "Grover's algorithm",
    speedup: 'quadratic',
    qubitsRequired: '2,953 logical qubits',
    threatLevel: 'weakened',
    citation: 'Grassl et al., 2016 [3]',
    notes: 'Grover\'s reduces to 64-bit security. Critically, Grover\'s is inherently sequential — parallelism does not help. NIST recommends AES-256 for long-term quantum safety.',
  },
  'AES-192': {
    algorithm: 'AES-192',
    classicalBreakTime: '~2^192 operations',
    quantumBreakTime: '~2^96 sequential quantum ops',
    quantumAlgorithm: "Grover's algorithm",
    speedup: 'quadratic',
    qubitsRequired: '~4,000 logical qubits (approximate, extrapolated from Grassl et al.)',
    threatLevel: 'quantum-safe',
    citation: 'Grassl et al., 2016 [3]',
    notes: 'Reduced to 96-bit quantum security. Still safe. Grover\'s is inherently sequential.',
  },
  'AES-256': {
    algorithm: 'AES-256',
    classicalBreakTime: '~2^256 operations',
    quantumBreakTime: '~2^128 sequential quantum ops',
    quantumAlgorithm: "Grover's algorithm",
    speedup: 'quadratic',
    qubitsRequired: '6,681 logical qubits',
    threatLevel: 'quantum-safe',
    citation: 'Grassl et al., 2016 [3]',
    notes: 'Equivalent quantum security to classical AES-128. Defines the NIST PQC Security Level 5 reference point. Quantum-safe.',
  },
  'DES': {
    algorithm: 'DES (56-bit)',
    classicalBreakTime: 'Hours (brute force)',
    quantumBreakTime: 'Seconds',
    quantumAlgorithm: "Grover's algorithm",
    speedup: 'quadratic',
    qubitsRequired: 'Minimal',
    threatLevel: 'broken-classical',
    citation: 'FIPS 46-3 (withdrawn 2005)',
    notes: 'Broken classically since 1998. Quantum attack is irrelevant — do not use.',
  },
  '3DES': {
    algorithm: '3DES (112-bit effective)',
    classicalBreakTime: '~2^112 operations (Sweet32 reduces practical security further)',
    quantumBreakTime: '~2^56 sequential quantum ops',
    quantumAlgorithm: "Grover's algorithm",
    speedup: 'quadratic',
    qubitsRequired: '~1,500 logical qubits (estimated)',
    threatLevel: 'broken-classical',
    citation: 'NIST SP 800-131A Rev 2',
    notes: 'Deprecated by NIST in 2023. Sweet32 birthday attack limits practical block cipher security.',
  },
  'RC4': {
    algorithm: 'RC4',
    classicalBreakTime: 'Minutes (known biases)',
    quantumBreakTime: 'Seconds',
    quantumAlgorithm: 'N/A — classically broken',
    speedup: 'none',
    qubitsRequired: 'N/A',
    threatLevel: 'broken-classical',
    citation: 'RFC 7465 (2015)',
    notes: 'Broken classically. Prohibited in TLS by RFC 7465. Quantum attack is irrelevant.',
  },
  'MD5': {
    algorithm: 'MD5',
    classicalBreakTime: 'Seconds (collision attack)',
    quantumBreakTime: 'Seconds',
    quantumAlgorithm: 'N/A — classically broken',
    speedup: 'none',
    qubitsRequired: 'N/A',
    threatLevel: 'broken-classical',
    citation: 'RFC 6151 (2011)',
    notes: 'Collisions generated in seconds since 2004. Never use for security.',
  },
  'SHA-1': {
    algorithm: 'SHA-1',
    classicalBreakTime: '~2^63 operations (practical collisions)',
    quantumBreakTime: '~2^53 quantum ops (generic BHT bound for 160-bit hash)',
    quantumAlgorithm: "Grover's + BHT algorithm",
    speedup: 'quadratic',
    qubitsRequired: 'Estimated ~1,000 logical qubits',
    threatLevel: 'broken-classical',
    citation: 'NIST SP 800-131A Rev 2',
    notes: 'Practical collision demonstrated (SHAttered, 2017). Deprecated by NIST. Quantum bound is generic; known classical shortcuts may further reduce quantum cost.',
  },
  'SHA-256': {
    algorithm: 'SHA-256',
    classicalBreakTime: '~2^128 collision resistance',
    quantumBreakTime: '~2^85 quantum ops (collision via BHT)',
    quantumAlgorithm: "Grover's + BHT algorithm",
    speedup: 'quadratic',
    qubitsRequired: 'Estimated ~2,500 logical qubits (no specific paper)',
    threatLevel: 'quantum-safe',
    citation: 'NIST IR 8547 [4]',
    notes: 'SHA-256 collision resistance defines the NIST PQC Security Level 1 reference point. Quantum-safe for all practical purposes. Qubit estimate is approximate.',
  },
  'SHA-512': {
    algorithm: 'SHA-512',
    classicalBreakTime: '~2^256 collision resistance',
    quantumBreakTime: '~2^170 quantum ops (collision via BHT)',
    quantumAlgorithm: "Grover's + BHT algorithm",
    speedup: 'quadratic',
    qubitsRequired: 'Estimated ~5,000 logical qubits (no specific paper)',
    threatLevel: 'quantum-safe',
    citation: 'NIST IR 8547 [4]',
    notes: 'Quantum-safe. No migration needed. Qubit estimate is approximate.',
  },
  'SHA-3': {
    algorithm: 'SHA-3 (Keccak)',
    classicalBreakTime: '~2^128 collision resistance',
    quantumBreakTime: '~2^85 quantum ops (collision via BHT)',
    quantumAlgorithm: "Grover's + BHT algorithm",
    speedup: 'quadratic',
    qubitsRequired: 'Estimated ~2,500 logical qubits (no specific paper)',
    threatLevel: 'quantum-safe',
    citation: 'NIST IR 8547 [4]',
    notes: 'Designed post-quantum. Quantum-safe. Qubit estimate is approximate.',
  },
  'TLS 1.0': {
    algorithm: 'TLS 1.0',
    classicalBreakTime: 'Broken (POODLE, BEAST)',
    quantumBreakTime: 'Broken',
    quantumAlgorithm: 'N/A — classically broken',
    speedup: 'none',
    qubitsRequired: 'N/A',
    threatLevel: 'broken-classical',
    citation: 'RFC 8996 (2021)',
    notes: 'Deprecated. Uses cipher suites vulnerable to both classical and quantum attacks.',
  },
  'TLS 1.1': {
    algorithm: 'TLS 1.1',
    classicalBreakTime: 'Broken',
    quantumBreakTime: 'Broken',
    quantumAlgorithm: 'N/A — classically broken',
    speedup: 'none',
    qubitsRequired: 'N/A',
    threatLevel: 'broken-classical',
    citation: 'RFC 8996 (2021)',
    notes: 'Deprecated. No support for modern AEAD ciphers.',
  },
  'SSLv2/v3': {
    algorithm: 'SSL 2.0/3.0',
    classicalBreakTime: 'Broken (DROWN, POODLE)',
    quantumBreakTime: 'Broken',
    quantumAlgorithm: 'N/A — classically broken',
    speedup: 'none',
    qubitsRequired: 'N/A',
    threatLevel: 'broken-classical',
    citation: 'RFC 7568, RFC 7457',
    notes: 'Completely broken. Multiple practical attacks. Must not be used.',
  },
};

export function getQuantumEstimate(algorithmId: string): QuantumEstimate | null {
  return ESTIMATES[algorithmId] ?? ESTIMATES[algorithmId.replace(/-\d+$/, '')] ?? null;
}

export function getAllQuantumEstimates(): Record<string, QuantumEstimate> {
  return { ...ESTIMATES };
}

// Threat severity ordering (higher = more urgent)
// broken-classical ranks equal to broken-quantum: classically broken algorithms
// are exploitable TODAY, while quantum-broken ones require future hardware.
const THREAT_ORDER: Record<ThreatLevel, number> = {
  'broken-classical': 3,
  'broken-quantum': 3,
  'weakened': 1,
  'quantum-safe': 0,
};

export function getWeakestThreat(algorithmIds: string[]): QuantumEstimate | null {
  let worst: QuantumEstimate | null = null;
  let worstSeverity = -1;

  for (const id of algorithmIds) {
    const base = id.replace(/-\d+$/, '');
    const est = ESTIMATES[id] ?? ESTIMATES[base];
    if (!est) continue;
    const severity = THREAT_ORDER[est.threatLevel];
    // Prefer broken-quantum over broken-classical at same severity
    // (more interesting for the quantum threat narrative)
    if (severity > worstSeverity || (severity === worstSeverity && est.threatLevel === 'broken-quantum')) {
      worstSeverity = severity;
      worst = est;
    }
  }

  return worst;
}
