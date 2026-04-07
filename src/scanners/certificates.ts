import crypto from 'node:crypto';
import type { Finding, CertificateInfo } from '../types.js';
import { getAlgorithmRule } from '../rules/algorithms.js';
import { getExplanation } from '../education/explanations.js';

// ── PEM block extraction ──

const PEM_BLOCK_RE = /-----BEGIN ([A-Z0-9 ]+)-----[\s\S]*?-----END \1-----/g;

interface ParsedKey {
  algorithm: string;
  keySize: number;
  line: number;
  snippet: string;
}

interface ParsedCert {
  algorithm: string;
  keySize: number;
  signatureAlgorithm: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  line: number;
  snippet: string;
}

// Map OpenSSL curve names to bit sizes
const CURVE_BIT_SIZES: Record<string, number> = {
  'prime256v1': 256, 'P-256': 256, 'secp256r1': 256, 'secp256k1': 256,
  'secp384r1': 384, 'P-384': 384,
  'secp521r1': 521, 'P-521': 521,
  'secp224r1': 224, 'P-224': 224,
};
const ED_KEY_SIZES: Record<string, number> = { 'ed25519': 256, 'ed448': 448 };

function resolveKeySize(details: Record<string, any> | undefined, keyType: string | undefined): number {
  if (details?.modulusLength) return details.modulusLength;
  if (details?.namedCurve) return CURVE_BIT_SIZES[details.namedCurve] ?? 0;
  if (keyType && ED_KEY_SIZES[keyType]) return ED_KEY_SIZES[keyType];
  return 0;
}

function tryParseKey(pem: string, line: number): ParsedKey | null {
  try {
    const keyObj = pem.includes('PRIVATE')
      ? crypto.createPrivateKey(pem)
      : crypto.createPublicKey(pem);

    const detail = keyObj.asymmetricKeyType;
    const details = (keyObj as any).asymmetricKeyDetails as Record<string, any> | undefined;
    const size = resolveKeySize(details, detail);

    let algorithm = 'RSA';
    if (detail === 'ec') algorithm = 'ECDSA';
    else if (detail === 'ed25519') algorithm = 'Ed25519';
    else if (detail === 'ed448') algorithm = 'Ed25519'; // same vulnerability class
    else if (detail === 'dsa') algorithm = 'DSA';
    else if (detail === 'dh') algorithm = 'DH';
    else if (detail === 'rsa' || detail === 'rsa-pss') algorithm = 'RSA';

    const snippet = pem.split('\n')[0].trim();
    return { algorithm, keySize: size, line, snippet };
  } catch {
    return null;
  }
}

function tryParseCert(pem: string, line: number): ParsedCert | null {
  try {
    const cert = new crypto.X509Certificate(pem);

    const pubKey = cert.publicKey;
    const detail = pubKey.asymmetricKeyType;
    const details = (pubKey as any).asymmetricKeyDetails as Record<string, any> | undefined;
    const size = resolveKeySize(details, detail);

    let algorithm = 'RSA';
    if (detail === 'ec') algorithm = 'ECDSA';
    else if (detail === 'ed25519') algorithm = 'Ed25519';
    else if (detail === 'ed448') algorithm = 'Ed25519'; // same vulnerability class
    else if (detail === 'dsa') algorithm = 'DSA';
    else if (detail === 'dh') algorithm = 'DH';
    else if (detail === 'rsa' || detail === 'rsa-pss') algorithm = 'RSA';

    // Extract signature algorithm from the info string
    const infoString = cert.toString();
    const sigMatch = infoString.match(/Signature Algorithm:\s*(\S+)/);
    const signatureAlgorithm = sigMatch?.[1] ?? 'unknown';

    return {
      algorithm,
      keySize: size ?? 0,
      signatureAlgorithm,
      subject: cert.subject,
      issuer: cert.issuer,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      line,
      snippet: pem.split('\n')[0].trim(),
    };
  } catch {
    return null;
  }
}

// ── Fallback: header-only detection for unparseable PEMs ──

interface HeaderPattern {
  regex: RegExp;
  algorithm: string;
}

const HEADER_PATTERNS: HeaderPattern[] = [
  { regex: /-----BEGIN RSA PRIVATE KEY-----/, algorithm: 'RSA' },
  { regex: /-----BEGIN RSA PUBLIC KEY-----/, algorithm: 'RSA' },
  { regex: /-----BEGIN EC PRIVATE KEY-----/, algorithm: 'ECDSA' },
  { regex: /-----BEGIN EC PUBLIC KEY-----/, algorithm: 'ECDSA' },
  { regex: /-----BEGIN DSA PRIVATE KEY-----/, algorithm: 'DSA' },
  // OID patterns found inside certificates and keys
  { regex: /MA0GCSqGSIb3DQEBAQUAA/, algorithm: 'RSA' },
  { regex: /MAoGCCqGSM49BAM/, algorithm: 'ECDSA' },
  { regex: /sha1WithRSAEncryption/i, algorithm: 'RSA' },
  { regex: /sha256WithRSAEncryption/i, algorithm: 'RSA' },
  { regex: /ecdsa-with-SHA/i, algorithm: 'ECDSA' },
];

function algorithmWithSize(algorithm: string, keySize: number): string {
  if (keySize <= 0) return algorithm;
  if (algorithm === 'RSA') return `RSA-${keySize}`;
  if (algorithm === 'ECDSA' || algorithm === 'Ed25519') return algorithm;
  return algorithm;
}

export function scanCertificateFile(filePath: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  // Find line numbers for PEM blocks
  const lines = content.split('\n');
  function lineOfOffset(offset: number): number {
    let pos = 0;
    for (let i = 0; i < lines.length; i++) {
      pos += lines[i].length + 1;
      if (pos > offset) return i + 1;
    }
    return 1;
  }

  // Try to parse each PEM block
  let match: RegExpExecArray | null;
  PEM_BLOCK_RE.lastIndex = 0;
  while ((match = PEM_BLOCK_RE.exec(content)) !== null) {
    const blockType = match[1];
    const pem = match[0];
    const line = lineOfOffset(match.index);

    // Try to parse CERTIFICATE blocks
    if (blockType.includes('CERTIFICATE')) {
      const parsed = tryParseCert(pem, line);
      if (parsed) {
        const algoId = algorithmWithSize(parsed.algorithm, parsed.keySize);
        const baseAlgo = parsed.algorithm;
        const key = `cert:${baseAlgo}:${parsed.keySize}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const rule = getAlgorithmRule(baseAlgo);
        if (!rule) continue;
        const education = getExplanation(baseAlgo);

        findings.push({
          file: filePath,
          line: parsed.line,
          algorithm: algoId,
          category: rule.category,
          risk: rule.risk,
          usageType: 'key-material',
          snippet: `Certificate: ${parsed.subject} (${algoId}, ${parsed.signatureAlgorithm})`,
          explanation: education.explanation,
          replacement: education.replacement,
          keySize: parsed.keySize,
          certInfo: {
            keyType: baseAlgo,
            keySize: parsed.keySize,
            signatureAlgorithm: parsed.signatureAlgorithm,
            subject: parsed.subject,
            issuer: parsed.issuer,
            validFrom: parsed.validFrom,
            validTo: parsed.validTo,
          },
        });
        continue;
      }
      // Certificate parse failed — fall through to header/OID detection below
    }

    // Try to parse KEY blocks
    if (blockType.includes('KEY')) {
      const parsed = tryParseKey(pem, line);
      if (parsed) {
        const algoId = algorithmWithSize(parsed.algorithm, parsed.keySize);
        const baseAlgo = parsed.algorithm;
        const key = `key:${baseAlgo}:${parsed.keySize}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const rule = getAlgorithmRule(baseAlgo);
        if (!rule) continue;
        const education = getExplanation(baseAlgo);

        findings.push({
          file: filePath,
          line: parsed.line,
          algorithm: algoId,
          category: rule.category,
          risk: rule.risk,
          usageType: 'key-material',
          snippet: `${blockType}: ${algoId} (${parsed.keySize}-bit)`,
          explanation: education.explanation,
          replacement: education.replacement,
          keySize: parsed.keySize,
        });
        continue;
      }
    }

    // Fallback: header-only detection for blocks we can't parse
    for (const pattern of HEADER_PATTERNS) {
      if (pattern.regex.test(pem)) {
        const key = `header:${pattern.algorithm}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const rule = getAlgorithmRule(pattern.algorithm);
        if (!rule) continue;
        const education = getExplanation(pattern.algorithm);

        findings.push({
          file: filePath,
          line,
          algorithm: pattern.algorithm,
          category: rule.category,
          risk: rule.risk,
          usageType: 'key-material',
          snippet: pem.split('\n')[0].trim(),
          explanation: education.explanation,
          replacement: education.replacement,
        });
      }
    }
  }

  // If no PEM blocks found, fall back to line-by-line header scan
  if (findings.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of HEADER_PATTERNS) {
        if (pattern.regex.test(lines[i]) && !seen.has(pattern.algorithm)) {
          seen.add(pattern.algorithm);
          const rule = getAlgorithmRule(pattern.algorithm);
          if (!rule) continue;
          const education = getExplanation(pattern.algorithm);
          findings.push({
            file: filePath,
            line: i + 1,
            algorithm: pattern.algorithm,
            category: rule.category,
            risk: rule.risk,
            usageType: 'key-material',
            snippet: lines[i].trim(),
            explanation: education.explanation,
            replacement: education.replacement,
          });
        }
      }
    }
  }

  return findings;
}
