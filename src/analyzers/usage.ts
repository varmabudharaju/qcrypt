import type { UsageType } from '../types.js';

// ── Comment detection ──

const LINE_COMMENT: Record<string, RegExp[]> = {
  '.py': [/^\s*#/],
  '.go': [/^\s*\/\//, /^\s*\*/],
  '.js': [/^\s*\/\//, /^\s*\*/],
  '.ts': [/^\s*\/\//, /^\s*\*/],
  '.mjs': [/^\s*\/\//, /^\s*\*/],
  '.cjs': [/^\s*\/\//, /^\s*\*/],
  '.rs': [/^\s*\/\//],
  '.java': [/^\s*\/\//, /^\s*\*/],
  '.kt': [/^\s*\/\//, /^\s*\*/],
  '.c': [/^\s*\/\//, /^\s*\*/],
  '.h': [/^\s*\/\//, /^\s*\*/],
  '.cpp': [/^\s*\/\//, /^\s*\*/],
  '.cc': [/^\s*\/\//, /^\s*\*/],
  '.hpp': [/^\s*\/\//, /^\s*\*/],
  '.cxx': [/^\s*\/\//, /^\s*\*/],
  '.rb': [/^\s*#/],
  '.php': [/^\s*\/\//, /^\s*#/, /^\s*\*/],
};

function isComment(line: string, ext: string): boolean {
  const patterns = LINE_COMMENT[ext];
  if (!patterns) return false;
  return patterns.some((p) => p.test(line));
}

// ── Import detection ──

const IMPORT_PATTERNS: Record<string, RegExp[]> = {
  '.py': [/^\s*import\s/, /^\s*from\s+\S+\s+import\s/],
  '.go': [/^\s*"[^"]+"\s*$/, /^\s*\w+\s+"[^"]+"\s*$/],
  '.js': [/^\s*import\s/, /\brequire\s*\(/, /^\s*export\s.*\bfrom\s/],
  '.ts': [/^\s*import\s/, /\brequire\s*\(/, /^\s*export\s.*\bfrom\s/],
  '.mjs': [/^\s*import\s/, /^\s*export\s.*\bfrom\s/],
  '.cjs': [/\brequire\s*\(/],
  '.rs': [/^\s*use\s/, /^\s*extern\s+crate\s/],
  '.java': [/^\s*import\s/],
  '.kt': [/^\s*import\s/],
  '.c': [/^\s*#\s*include\s/],
  '.h': [/^\s*#\s*include\s/],
  '.cpp': [/^\s*#\s*include\s/],
  '.cc': [/^\s*#\s*include\s/],
  '.hpp': [/^\s*#\s*include\s/],
  '.cxx': [/^\s*#\s*include\s/],
  '.rb': [/^\s*require\s/, /^\s*require_relative\s/],
  '.php': [/^\s*use\s/, /\brequire\s/, /\binclude\s/],
};

function isImport(line: string, ext: string): boolean {
  const patterns = IMPORT_PATTERNS[ext];
  if (!patterns) return false;
  return patterns.some((p) => p.test(line));
}

// ── Operation detection (active crypto function calls) ──

const OPERATION_PATTERNS: RegExp[] = [
  // Key generation
  /GenerateKey/i, /generateKeyPair/i, /generate_private_key/i,
  /KeyPairGenerator/i, /genkey/i,

  // Sign / verify
  /\.sign\s*\(/, /\.verify\s*\(/, /createSign\s*\(/, /createVerify\s*\(/,

  // Encrypt / decrypt
  /\.encrypt\s*\(/, /\.decrypt\s*\(/, /doFinal\s*\(/, /createCipher/i, /createDecipher/i,

  // Hashing calls
  /\.New\s*\(\s*\)/, /\.Sum\d*\s*\(/, /createHash\s*\(/, /\.update\s*\(/, /\.digest\s*\(/,
  /\.hexdigest\s*\(/, /hashlib\.\w+\s*\(/,

  // Key exchange
  /createECDH\s*\(/, /computeSecret\s*\(/, /generate_parameters\s*\(/,
  /NewCipher\s*\(/, /NewTripleDESCipher\s*\(/,

  // Certificate operations
  /x509\.Create/, /x509\.Parse/, /tls\.LoadX509/,

  // Java crypto operations (Cipher, MessageDigest, Signature, KeyFactory, etc.)
  /\.getInstance\s*\(/,

  // C/OpenSSL operations
  /RSA_generate_key/, /RSA_sign\s*\(/, /RSA_verify\s*\(/, /RSA_encrypt\s*\(/, /RSA_decrypt\s*\(/,
  /RSA_public_encrypt\s*\(/, /RSA_private_decrypt\s*\(/,
  /EC_KEY_generate_key\s*\(/, /ECDSA_sign\s*\(/, /ECDSA_verify\s*\(/,
  /DH_generate_key\s*\(/, /DH_compute_key\s*\(/,
  /EVP_DigestSign/, /EVP_DigestVerify/, /EVP_Encrypt/, /EVP_Decrypt/,
  /MD5_Init\s*\(/, /MD5_Update\s*\(/, /MD5_Final\s*\(/,
  /SHA1_Init\s*\(/, /SHA1_Update\s*\(/, /SHA256_Init\s*\(/,
  /SSL_CTX_new\s*\(/, /SSL_new\s*\(/,

  // Ruby operations
  /\.generate\s*\(/, /\.new\s*\(/,

  // PHP operations
  /openssl_pkey_new\s*\(/, /openssl_sign\s*\(/, /openssl_verify\s*\(/,
  /openssl_encrypt\s*\(/, /openssl_decrypt\s*\(/,
];

function isOperation(line: string): boolean {
  return OPERATION_PATTERNS.some((p) => p.test(line));
}

// ── Main classifier ──

export function classifyUsage(line: string, ext: string): UsageType {
  if (isComment(line, ext)) return 'comment';
  if (isImport(line, ext)) return 'import';
  if (isOperation(line)) return 'operation';
  return 'reference';
}
