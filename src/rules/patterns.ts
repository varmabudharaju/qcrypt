import type { LanguagePatterns, PatternMatch } from '../types.js';
import { classifyUsage } from '../analyzers/usage.js';

const pythonPatterns: LanguagePatterns = {
  extensions: ['.py'],
  patterns: [
    { algorithm: 'RSA', regex: /\brsa\b.*(?:generate|private|public|key|sign|encrypt)/i },
    { algorithm: 'RSA', regex: /\bRSA\b/ },
    { algorithm: 'ECDSA', regex: /\bec\.(?:generate_private_key|SECP|ECDSA)\b/i },
    { algorithm: 'ECDSA', regex: /\bECDSA\b/ },
    { algorithm: 'ECDH', regex: /\bECDH\b/i },
    { algorithm: 'DSA', regex: /\bdsa\.(?:generate_private_key|DSAPrivateKey)\b/i },
    { algorithm: 'DH', regex: /\bdh\.(?:generate_parameters|DHPrivateKey)\b/i },
    { algorithm: 'Ed25519', regex: /\bEd25519\b/ },
    { algorithm: 'AES-128', regex: /\bAES\b.*\b128\b/ },
    { algorithm: 'AES-256', regex: /\bAES\b.*\b256\b/ },
    { algorithm: 'DES', regex: /\bDES\b(?!3)(?!ede)/ },
    { algorithm: '3DES', regex: /\b(?:3DES|DES3|DESede|TripleDES)\b/i },
    { algorithm: 'MD5', regex: /\bmd5\b/i },
    { algorithm: 'SHA-1', regex: /\bsha[-_]?1\b/i },
    { algorithm: 'SHA-256', regex: /\bsha[-_]?256\b/i },
    { algorithm: 'SHA-512', regex: /\bsha[-_]?512\b/i },
    { algorithm: 'SHA-3', regex: /\bsha3[-_]/i },
  ],
};

const jsPatterns: LanguagePatterns = {
  extensions: ['.js', '.ts', '.mjs', '.cjs'],
  patterns: [
    { algorithm: 'RSA', regex: /['"]rsa['"]/i },
    { algorithm: 'RSA', regex: /\bRSA\b/ },
    { algorithm: 'RSA', regex: /generateKeyPairSync\s*\(\s*['"]rsa['"]/i },
    { algorithm: 'ECDSA', regex: /['"]ec['"]/i },
    { algorithm: 'ECDSA', regex: /\bECDSA\b/ },
    { algorithm: 'ECDH', regex: /\bECDH\b|createECDH/i },
    { algorithm: 'DH', regex: /\bcreateDiffieHellman\b/ },
    { algorithm: 'Ed25519', regex: /\bEd25519\b|['"]ed25519['"]/i },
    { algorithm: 'AES-128', regex: /\baes-128\b/i },
    { algorithm: 'AES-256', regex: /\baes-256\b/i },
    { algorithm: 'DES', regex: /['"]des['"]|['"]des-/i },
    { algorithm: '3DES', regex: /['"]des-ede3['"]/i },
    { algorithm: 'MD5', regex: /\bmd5\b/i },
    { algorithm: 'SHA-1', regex: /['"]sha1['"]/i },
    { algorithm: 'SHA-256', regex: /['"]sha256['"]/i },
    { algorithm: 'SHA-512', regex: /['"]sha512['"]/i },
    { algorithm: 'P-256', regex: /\bprime256v1\b|\bP-256\b|\bsecp256r1\b/i },
    { algorithm: 'secp256k1', regex: /\bsecp256k1\b/i },
  ],
};

const goPatterns: LanguagePatterns = {
  extensions: ['.go'],
  patterns: [
    { algorithm: 'RSA', regex: /\bcrypto\/rsa\b|rsa\.GenerateKey|rsa\.SignPKCS|rsa\.EncryptPKCS/ },
    { algorithm: 'ECDSA', regex: /\bcrypto\/ecdsa\b|ecdsa\.GenerateKey|ecdsa\.Sign/ },
    { algorithm: 'ECDH', regex: /\bcrypto\/ecdh\b|ecdh\./ },
    { algorithm: 'DSA', regex: /\bcrypto\/dsa\b|(?<![a-z])dsa\.GenerateKey/ },
    { algorithm: 'Ed25519', regex: /\bcrypto\/ed25519\b|ed25519\.GenerateKey/ },
    { algorithm: 'DES', regex: /\bcrypto\/des\b|des\.NewCipher/ },
    { algorithm: '3DES', regex: /des\.NewTripleDESCipher/ },
    { algorithm: 'MD5', regex: /\bcrypto\/md5\b|md5\.New\b|md5\.Sum/ },
    { algorithm: 'SHA-1', regex: /\bcrypto\/sha1\b|sha1\.New\b|sha1\.Sum/ },
    { algorithm: 'SHA-256', regex: /\bcrypto\/sha256\b|sha256\.New\b|sha256\.Sum/ },
    { algorithm: 'SHA-512', regex: /\bcrypto\/sha512\b|sha512\.New\b/ },
    { algorithm: 'AES-128', regex: /\baes\.NewCipher\b.*16\b/ },
    { algorithm: 'AES-256', regex: /\baes\.NewCipher\b.*32\b/ },
    { algorithm: 'RSA', regex: /\bx509\..*RSA\b/ },
  ],
};

const rustPatterns: LanguagePatterns = {
  extensions: ['.rs'],
  patterns: [
    { algorithm: 'RSA', regex: /\brsa::?\b|RsaPrivateKey|RsaPublicKey/i },
    { algorithm: 'ECDSA', regex: /\becdsa::?\b|EcdsaKeyPair/i },
    { algorithm: 'Ed25519', regex: /\bed25519\b|Ed25519KeyPair/i },
    { algorithm: 'DES', regex: /\bdes::?\b|Des\b/ },
    { algorithm: 'MD5', regex: /\bmd5::?\b|Md5::/ },
    { algorithm: 'SHA-1', regex: /\bsha1::?\b|Sha1::/ },
    { algorithm: 'SHA-256', regex: /\bsha2?256\b|Sha256::/i },
    { algorithm: 'AES-128', regex: /\bAes128\b/ },
    { algorithm: 'AES-256', regex: /\bAes256\b/ },
    { algorithm: 'P-256', regex: /\bNIST_P256\b|SECP256R1/i },
    { algorithm: 'secp256k1', regex: /\bsecp256k1\b/i },
  ],
};

const javaPatterns: LanguagePatterns = {
  extensions: ['.java', '.kt'],
  patterns: [
    { algorithm: 'RSA', regex: /getInstance\s*\(\s*"RSA/i },
    { algorithm: 'RSA', regex: /KeyPairGenerator.*"RSA"/ },
    { algorithm: 'ECDSA', regex: /getInstance\s*\(\s*"EC"|"ECDSA"/i },
    { algorithm: 'DSA', regex: /getInstance\s*\(\s*"DSA"/i },
    { algorithm: 'DH', regex: /getInstance\s*\(\s*"DH"|DiffieHellman/i },
    { algorithm: 'DES', regex: /getInstance\s*\(\s*"DES\b/i },
    { algorithm: '3DES', regex: /getInstance\s*\(\s*"DESede/i },
    { algorithm: 'AES-128', regex: /\bAES\b.*128/ },
    { algorithm: 'AES-256', regex: /\bAES\b.*256/ },
    { algorithm: 'MD5', regex: /getInstance\s*\(\s*"MD5"/i },
    { algorithm: 'SHA-1', regex: /getInstance\s*\(\s*"SHA-?1"/i },
    { algorithm: 'SHA-256', regex: /getInstance\s*\(\s*"SHA-?256"/i },
    { algorithm: 'RC4', regex: /getInstance\s*\(\s*"RC4"|"ARCFOUR"/i },
  ],
};

const cPatterns: LanguagePatterns = {
  extensions: ['.c', '.h', '.cpp', '.cc', '.hpp', '.cxx'],
  patterns: [
    // OpenSSL RSA
    { algorithm: 'RSA', regex: /\bRSA_generate_key|RSA_new\b|EVP_PKEY_RSA\b|RSA_sign\b|RSA_verify\b|RSA_encrypt\b|RSA_decrypt\b/ },
    { algorithm: 'RSA', regex: /\bRSA_public_encrypt|RSA_private_decrypt/ },
    // OpenSSL ECDSA / EC
    { algorithm: 'ECDSA', regex: /\bEC_KEY_generate_key|ECDSA_sign\b|ECDSA_verify\b|EVP_PKEY_EC\b/ },
    { algorithm: 'ECDH', regex: /\bECDH_compute_key\b/ },
    // OpenSSL DH
    { algorithm: 'DH', regex: /\bDH_generate_key|DH_compute_key\b|EVP_PKEY_DH\b/ },
    // OpenSSL DSA
    { algorithm: 'DSA', regex: /\b(?<![A-Z])DSA_generate_key|(?<![A-Z])DSA_sign\b|EVP_PKEY_DSA\b/ },
    // OpenSSL Ed25519
    { algorithm: 'Ed25519', regex: /\bEVP_PKEY_ED25519\b|ED25519_sign\b/ },
    // OpenSSL symmetric
    { algorithm: 'AES-128', regex: /\bEVP_aes_128|AES_set_encrypt_key.*128/ },
    { algorithm: 'AES-256', regex: /\bEVP_aes_256|AES_set_encrypt_key.*256/ },
    { algorithm: 'DES', regex: /\bEVP_des_\w|DES_ecb_encrypt\b|DES_set_key\b/ },
    { algorithm: '3DES', regex: /\bEVP_des_ede3|DES_ede3_cbc_encrypt/ },
    { algorithm: 'RC4', regex: /\bEVP_rc4\b|RC4_set_key\b/ },
    // OpenSSL hashing
    { algorithm: 'MD5', regex: /\bMD5_Init\b|MD5_Update\b|MD5_Final\b|EVP_md5\b/ },
    { algorithm: 'SHA-1', regex: /\bSHA1_Init\b|SHA1_Update\b|SHA1_Final\b|EVP_sha1\b/ },
    { algorithm: 'SHA-256', regex: /\bSHA256_Init\b|SHA256_Update\b|EVP_sha256\b/ },
    { algorithm: 'SHA-512', regex: /\bSHA512_Init\b|SHA512_Update\b|EVP_sha512\b/ },
    { algorithm: 'SHA-3', regex: /\bEVP_sha3_\d+/ },
    // TLS
    { algorithm: 'RSA', regex: /\bSSL_CTX_set_cipher_list.*RSA/ },
  ],
};

const rubyPatterns: LanguagePatterns = {
  extensions: ['.rb'],
  patterns: [
    { algorithm: 'RSA', regex: /OpenSSL::PKey::RSA|PKey::RSA\.new|PKey::RSA\.generate/ },
    { algorithm: 'ECDSA', regex: /OpenSSL::PKey::EC|PKey::EC\.new|PKey::EC\.generate/ },
    { algorithm: 'DSA', regex: /OpenSSL::PKey::(?<![A-Z])DSA/ },
    { algorithm: 'DH', regex: /OpenSSL::PKey::DH/ },
    { algorithm: 'DES', regex: /OpenSSL::Cipher::DES|Cipher\.new\s*\(\s*['"]des/i },
    { algorithm: '3DES', regex: /Cipher\.new\s*\(\s*['"]des-ede3/i },
    { algorithm: 'AES-128', regex: /Cipher\.new\s*\(\s*['"]aes-128/i },
    { algorithm: 'AES-256', regex: /Cipher\.new\s*\(\s*['"]aes-256/i },
    { algorithm: 'MD5', regex: /Digest::MD5|OpenSSL::Digest::MD5/ },
    { algorithm: 'SHA-1', regex: /Digest::SHA1|OpenSSL::Digest::SHA1/ },
    { algorithm: 'SHA-256', regex: /Digest::SHA256|OpenSSL::Digest::SHA256/ },
    { algorithm: 'SHA-512', regex: /Digest::SHA512|OpenSSL::Digest::SHA512/ },
    { algorithm: 'RC4', regex: /Cipher\.new\s*\(\s*['"]rc4/i },
  ],
};

const phpPatterns: LanguagePatterns = {
  extensions: ['.php'],
  patterns: [
    { algorithm: 'RSA', regex: /OPENSSL_KEYTYPE_RSA|openssl_pkey_new.*rsa/i },
    { algorithm: 'RSA', regex: /openssl_sign\s*\(|openssl_verify\s*\(|openssl_public_encrypt\s*\(|openssl_private_decrypt\s*\(/ },
    { algorithm: 'ECDSA', regex: /OPENSSL_KEYTYPE_EC|openssl_pkey_new.*ec/i },
    { algorithm: 'DES', regex: /openssl_encrypt\s*\([^)]*['"]des['"]/i },
    { algorithm: '3DES', regex: /openssl_encrypt\s*\([^)]*['"]des-ede3/i },
    { algorithm: 'AES-128', regex: /openssl_encrypt\s*\([^)]*['"]aes-128/i },
    { algorithm: 'AES-256', regex: /openssl_encrypt\s*\([^)]*['"]aes-256/i },
    { algorithm: 'RC4', regex: /openssl_encrypt\s*\([^)]*['"]rc4/i },
    { algorithm: 'MD5', regex: /\bmd5\s*\(|md5_file\s*\(/ },
    { algorithm: 'SHA-1', regex: /\bsha1\s*\(|sha1_file\s*\(/ },
    { algorithm: 'SHA-256', regex: /hash\s*\(\s*['"]sha256['"]/i },
    { algorithm: 'SHA-512', regex: /hash\s*\(\s*['"]sha512['"]/i },
    { algorithm: 'SHA-3', regex: /hash\s*\(\s*['"]sha3/i },
  ],
};

const allLanguages: LanguagePatterns[] = [
  pythonPatterns,
  jsPatterns,
  goPatterns,
  rustPatterns,
  javaPatterns,
  cPatterns,
  rubyPatterns,
  phpPatterns,
];

export function getLanguagePatterns(extension: string): LanguagePatterns | undefined {
  return allLanguages.find((lang) => lang.extensions.includes(extension));
}

// Key size extraction patterns — match common ways key sizes appear on the same line
const KEY_SIZE_PATTERNS: RegExp[] = [
  /modulusLength\s*:\s*(\d{3,5})/,       // JS: modulusLength: 2048
  /key_size\s*=\s*(\d{3,5})/,            // Python: key_size=2048
  /GenerateKey\s*\([^,]+,\s*(\d{3,5})/,  // Go: rsa.GenerateKey(rand, 2048)
  /\.initialize\s*\(\s*(\d{3,5})/,       // Java: kpg.initialize(2048)
  /RSA_generate_key_ex?\s*\([^,]*,\s*(\d{3,5})/, // C: RSA_generate_key(NULL, 2048, ...)
  /(\d{3,5})\s*bit/i,                     // General: "2048 bit" or "4096-bit"
  /key.*?(\d{3,5})/i,                     // Fallback: key...2048
];

function extractKeySize(line: string, algorithm: string): number | undefined {
  // Only try for algorithms where key size matters
  if (!['RSA', 'DSA', 'DH'].includes(algorithm)) return undefined;

  for (const pattern of KEY_SIZE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const size = parseInt(match[1], 10);
      // Validate: common RSA/DSA/DH key sizes
      if ([1024, 2048, 3072, 4096, 8192].includes(size)) return size;
    }
  }
  return undefined;
}

export function scanContent(content: string, extension: string): PatternMatch[] {
  const lang = getLanguagePatterns(extension);
  if (!lang) return [];

  const lines = content.split('\n');
  const matches: PatternMatch[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of lang.patterns) {
      if (pattern.regex.test(line)) {
        const key = `${pattern.algorithm}:${i + 1}`;
        if (!seen.has(key)) {
          seen.add(key);
          const keySize = extractKeySize(line, pattern.algorithm);
          matches.push({
            algorithm: keySize ? `${pattern.algorithm}-${keySize}` : pattern.algorithm,
            line: i + 1,
            snippet: line.trim(),
            usageType: classifyUsage(line, extension),
            keySize,
          });
        }
      }
    }
  }

  return matches;
}
