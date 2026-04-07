// src/compliance/frameworks.ts

export interface ComplianceFramework {
  id: string;
  name: string;
  fullName: string;
  authority: string;
  version: string;
  url: string;
  description: string;
  deadline: string | null;
}

export type ComplianceStatus = 'non-compliant' | 'deprecated' | 'compliant' | 'recommended';

export interface ComplianceRule {
  algorithmPattern: string;
  status: ComplianceStatus;
  reason: string;
  recommendation: string;
  deadline: string | null;
}

export const FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'cnsa-2.0',
    name: 'CNSA 2.0',
    fullName: 'Commercial National Security Algorithm Suite 2.0',
    authority: 'NSA',
    version: '2.0',
    url: 'https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF',
    description: 'NSA requirements for national security systems — mandates post-quantum migration by 2030',
    deadline: '2030',
  },
  {
    id: 'fips-140-3',
    name: 'FIPS 140-3',
    fullName: 'Security Requirements for Cryptographic Modules',
    authority: 'NIST',
    version: '140-3',
    url: 'https://csrc.nist.gov/pubs/fips/140-3/final',
    description: 'Cryptographic module validation — approved algorithms for federal systems',
    deadline: null,
  },
  {
    id: 'nist-sp-800-208',
    name: 'SP 800-208',
    fullName: 'Recommendation for Stateful Hash-Based Signature Schemes',
    authority: 'NIST',
    version: '800-208',
    url: 'https://csrc.nist.gov/pubs/sp/800/208/final',
    description: 'Hash-based signature recommendations for firmware and code signing',
    deadline: null,
  },
  {
    id: 'pci-dss-4.0',
    name: 'PCI DSS 4.0',
    fullName: 'Payment Card Industry Data Security Standard',
    authority: 'PCI SSC',
    version: '4.0',
    url: 'https://www.pcisecuritystandards.org/document_library/',
    description: 'Payment card industry requirements — minimum 128-bit equivalent cryptography',
    deadline: null,
  },
];

// Rules keyed by framework ID
// algorithmPattern is a regex tested against finding.algorithm (case-insensitive)
export const RULES: Record<string, ComplianceRule[]> = {
  'cnsa-2.0': [
    { algorithmPattern: '^RSA', status: 'non-compliant', reason: 'RSA is vulnerable to quantum attack via Shor\'s algorithm', recommendation: 'Migrate to ML-KEM or ML-DSA', deadline: '2030' },
    { algorithmPattern: '^ECDSA', status: 'non-compliant', reason: 'ECDSA is vulnerable to quantum attack', recommendation: 'Migrate to ML-DSA-65 or ML-DSA-87', deadline: '2030' },
    { algorithmPattern: '^ECDH', status: 'non-compliant', reason: 'ECDH is vulnerable to quantum attack', recommendation: 'Migrate to ML-KEM-768 or ML-KEM-1024', deadline: '2030' },
    { algorithmPattern: '^(DH|Diffie)', status: 'non-compliant', reason: 'Diffie-Hellman is vulnerable to quantum attack', recommendation: 'Migrate to ML-KEM', deadline: '2030' },
    { algorithmPattern: '^Ed25519', status: 'non-compliant', reason: 'Ed25519 is vulnerable to quantum attack', recommendation: 'Migrate to ML-DSA-44', deadline: '2030' },
    { algorithmPattern: '^Ed448', status: 'non-compliant', reason: 'Ed448 is vulnerable to quantum attack', recommendation: 'Migrate to ML-DSA-65', deadline: '2030' },
    { algorithmPattern: 'AES-128', status: 'non-compliant', reason: 'CNSA 2.0 requires AES-256', recommendation: 'Upgrade to AES-256', deadline: '2030' },
    { algorithmPattern: 'AES-192', status: 'non-compliant', reason: 'CNSA 2.0 requires AES-256', recommendation: 'Upgrade to AES-256', deadline: '2030' },
    { algorithmPattern: '^SHA-256$', status: 'non-compliant', reason: 'CNSA 2.0 requires SHA-384 or SHA-512', recommendation: 'Upgrade to SHA-384 or SHA-512', deadline: '2030' },
    { algorithmPattern: 'SHA-?1(?!\\d)', status: 'non-compliant', reason: 'SHA-1 is cryptographically broken', recommendation: 'Upgrade to SHA-384 or SHA-512', deadline: null },
    { algorithmPattern: '^MD5', status: 'non-compliant', reason: 'MD5 is cryptographically broken', recommendation: 'Upgrade to SHA-384 or SHA-512', deadline: null },
    { algorithmPattern: '3DES|Triple.?DES|DES-EDE', status: 'non-compliant', reason: '3DES has insufficient block size', recommendation: 'Migrate to AES-256', deadline: null },
    { algorithmPattern: '^DES(?!-EDE)', status: 'non-compliant', reason: 'DES is completely broken', recommendation: 'Migrate to AES-256', deadline: null },
  ],
  'fips-140-3': [
    { algorithmPattern: '^MD5', status: 'non-compliant', reason: 'MD5 is not FIPS-approved', recommendation: 'Use SHA-256 or SHA-3', deadline: null },
    { algorithmPattern: 'SHA-?1(?!\\d)', status: 'deprecated', reason: 'SHA-1 is deprecated for digital signatures', recommendation: 'Use SHA-256 or SHA-3', deadline: null },
    { algorithmPattern: '^DES(?!-EDE)', status: 'non-compliant', reason: 'DES is not approved', recommendation: 'Use AES', deadline: null },
    { algorithmPattern: '3DES|Triple.?DES|DES-EDE', status: 'deprecated', reason: '3DES deprecated after 2023', recommendation: 'Use AES', deadline: '2023' },
    { algorithmPattern: '^RC4', status: 'non-compliant', reason: 'RC4 is not FIPS-approved', recommendation: 'Use AES', deadline: null },
  ],
  'nist-sp-800-208': [
    { algorithmPattern: '^RSA', status: 'deprecated', reason: 'RSA signatures are quantum-vulnerable for long-lived artifacts', recommendation: 'Consider SLH-DSA or LMS for firmware/code signing', deadline: null },
    { algorithmPattern: '^ECDSA', status: 'deprecated', reason: 'ECDSA signatures are quantum-vulnerable for long-lived artifacts', recommendation: 'Consider SLH-DSA for code signing', deadline: null },
    { algorithmPattern: '^Ed25519', status: 'deprecated', reason: 'Ed25519 is quantum-vulnerable for long-lived artifacts', recommendation: 'Consider SLH-DSA', deadline: null },
  ],
  'pci-dss-4.0': [
    { algorithmPattern: '^MD5', status: 'non-compliant', reason: 'MD5 does not meet minimum strength requirements', recommendation: 'Use SHA-256 or stronger', deadline: null },
    { algorithmPattern: 'SHA-?1(?!\\d)', status: 'non-compliant', reason: 'SHA-1 does not meet minimum strength requirements', recommendation: 'Use SHA-256 or stronger', deadline: null },
    { algorithmPattern: '^DES(?!-EDE)', status: 'non-compliant', reason: 'DES does not meet minimum key length', recommendation: 'Use AES-128 or stronger', deadline: null },
    { algorithmPattern: '3DES|Triple.?DES|DES-EDE', status: 'deprecated', reason: '3DES is being phased out', recommendation: 'Use AES-128 or stronger', deadline: null },
    { algorithmPattern: '^RC4', status: 'non-compliant', reason: 'RC4 has known vulnerabilities', recommendation: 'Use AES', deadline: null },
  ],
};
