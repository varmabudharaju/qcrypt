// ── NIST PQC Migration Deadlines ──
//
// Sources:
//   NIST IR 8547 (November 2024, Initial Public Draft): "Transition to
//   Post-Quantum Cryptography Standards"
//   https://csrc.nist.gov/pubs/ir/8547/ipd
//   NOTE: IR 8547 is a draft as of April 2026 — dates are proposed, not finalized.
//   The 2035 outer deadline originates from NSM-10 (2022).
//
//   CNSA 2.0 (NSA, 2022): "Commercial National Security Algorithm Suite 2.0"
//   https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF
//
//   NIST SP 800-131A Rev 2 (2019): "Transitioning the Use of Cryptographic
//   Algorithms and Key Lengths"
//
//   NIST FIPS 186-5 (2023): "Digital Signature Standard"
//
// Important: NIST IR 8547 distinguishes by security strength:
//   - Algorithms at 112-bit security: deprecated after 2030, disallowed after 2035
//   - Algorithms at >=128-bit security: disallowed after 2035 (no 2030 deprecation)
// These timelines apply to federal information systems. They serve as
// guidance for the private sector, not mandates.

export interface NistDeadline {
  algorithm: string;
  deprecated: string;
  prohibited: string;
  source: string;
  notes: string;
}

const DEADLINES: Record<string, NistDeadline> = {
  'RSA': {
    algorithm: 'RSA (key-size dependent)',
    deprecated: '2030',
    prohibited: '2035',
    source: 'NIST IR 8547 (draft)',
    notes: 'RSA-2048 (112-bit security): deprecated 2030, disallowed 2035. RSA-3072+ (128-bit): disallowed 2035 only. Federal guidance; serves as industry reference.',
  },
  'ECDSA': {
    algorithm: 'ECDSA (curve-size dependent)',
    deprecated: '2035',
    prohibited: '2035',
    source: 'NIST IR 8547 (draft)',
    notes: 'P-256/P-384/P-521 (>=128-bit security): disallowed after 2035, no 2030 deprecation. P-224 (112-bit): deprecated 2030, disallowed 2035.',
  },
  'ECDH': {
    algorithm: 'ECDH (curve-size dependent)',
    deprecated: '2035',
    prohibited: '2035',
    source: 'NIST IR 8547 (draft)',
    notes: 'P-256+ (>=128-bit security): disallowed after 2035. Application-specific guidance may require earlier migration due to HNDL risk.',
  },
  'Ed25519': {
    algorithm: 'Ed25519 / EdDSA',
    deprecated: '2035',
    prohibited: '2035',
    source: 'NIST IR 8547 (draft)',
    notes: 'Ed25519 provides ~128-bit security. Per IR 8547, >=128-bit algorithms are disallowed after 2035 with no 2030 deprecation.',
  },
  'DSA': {
    algorithm: 'DSA',
    deprecated: '2023',
    prohibited: '2023',
    source: 'NIST FIPS 186-5 (2023)',
    notes: 'Disallowed for new signature generation as of FIPS 186-5 (Feb 2023). Verification of legacy signatures still permitted.',
  },
  'DH': {
    algorithm: 'Diffie-Hellman',
    deprecated: '2030',
    prohibited: '2035',
    source: 'NIST IR 8547 (draft)',
    notes: 'DH-2048 (112-bit): deprecated 2030, disallowed 2035. DH-3072+ (128-bit): disallowed 2035 only. HNDL risk may justify earlier migration.',
  },
  'P-256': {
    algorithm: 'NIST P-256 (secp256r1)',
    deprecated: '2035',
    prohibited: '2035',
    source: 'NIST IR 8547 (draft)',
    notes: 'P-256 provides 128-bit security. Per IR 8547, disallowed after 2035 with no 2030 deprecation phase.',
  },
  'secp256k1': {
    algorithm: 'secp256k1',
    deprecated: '2035',
    prohibited: '2035',
    source: 'Inferred from NIST IR 8547 (draft)',
    notes: 'secp256k1 is not a NIST-recommended curve. Timeline inferred from NIST guidance for equivalent-security ECC (~128-bit). Used in Bitcoin/Ethereum.',
  },
  'SHA-1': {
    algorithm: 'SHA-1',
    deprecated: '2011',
    prohibited: '2030',
    source: 'NIST SP 800-131A Rev 2; NIST announcement Dec 2022',
    notes: 'Disallowed for digital signatures since ~2013 (SP 800-131A Rev 1). Remaining uses (HMAC, KDF) disallowed by end of 2030 per NIST Dec 2022 announcement.',
  },
  'MD5': {
    algorithm: 'MD5',
    deprecated: '2010',
    prohibited: '2010',
    source: 'RFC 6151 (2011); general NIST guidance',
    notes: 'MD5 was never a FIPS-approved hash function. Disallowed for all cryptographic purposes. Collisions trivially generated since 2004.',
  },
  'DES': {
    algorithm: 'DES',
    deprecated: '2005',
    prohibited: '2005',
    source: 'FIPS 46-3 (withdrawn May 19, 2005)',
    notes: 'Withdrawn as a federal standard in 2005. Must not be used.',
  },
  '3DES': {
    algorithm: '3DES (Triple DES)',
    deprecated: '2023',
    prohibited: '2023',
    source: 'NIST SP 800-131A Rev 2',
    notes: 'Disallowed for encryption after Dec 31, 2023. Decryption of legacy data still permitted. SP 800-67 Rev 2 withdrawn Jan 2024.',
  },
  'RC4': {
    algorithm: 'RC4',
    deprecated: '2015',
    prohibited: '2015',
    source: 'RFC 7465 (2015)',
    notes: 'Prohibited in TLS by IETF (not a NIST standard). RC4 was never FIPS-approved. Known statistical biases make it insecure.',
  },
};

export function getNistDeadline(algorithmId: string): NistDeadline | null {
  const base = algorithmId.replace(/-\d+$/, '');
  return DEADLINES[base] ?? null;
}

export interface DeadlineStatus {
  deadline: NistDeadline;
  yearsRemaining: number | null;
  status: 'overdue' | 'urgent' | 'upcoming' | 'safe';
}

export function computeDeadlineStatus(algorithmId: string): DeadlineStatus | null {
  const deadline = getNistDeadline(algorithmId);
  if (!deadline) return null;

  const prohibitedYear = parseInt(deadline.prohibited, 10);
  if (isNaN(prohibitedYear)) return null;

  const currentYear = new Date().getFullYear();
  const yearsRemaining = prohibitedYear - currentYear;

  let status: DeadlineStatus['status'];
  if (yearsRemaining <= 0) status = 'overdue';
  else if (yearsRemaining <= 3) status = 'urgent';
  else if (yearsRemaining <= 7) status = 'upcoming';
  else status = 'safe';

  return { deadline, yearsRemaining: yearsRemaining > 0 ? yearsRemaining : null, status };
}
