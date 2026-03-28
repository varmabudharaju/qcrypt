import { describe, it, expect } from 'vitest';
import { detectLanguage, getDependencies } from '../src/migrate/steps/dependencies.js';

describe('detectLanguage', () => {
  it('detects JavaScript from .js extension', () => {
    expect(detectLanguage('src/auth.js')).toBe('javascript');
  });

  it('detects TypeScript from .ts extension', () => {
    expect(detectLanguage('src/auth.ts')).toBe('typescript');
  });

  it('detects Python from .py extension', () => {
    expect(detectLanguage('utils/hash.py')).toBe('python');
  });

  it('detects Go from .go extension', () => {
    expect(detectLanguage('main.go')).toBe('go');
  });

  it('detects Rust from .rs extension', () => {
    expect(detectLanguage('src/lib.rs')).toBe('rust');
  });

  it('detects Java from .java extension', () => {
    expect(detectLanguage('Auth.java')).toBe('java');
  });

  it('detects Kotlin from .kt extension', () => {
    expect(detectLanguage('Auth.kt')).toBe('kotlin');
  });

  it('returns unknown for unrecognized extensions', () => {
    expect(detectLanguage('readme.md')).toBe('unknown');
    expect(detectLanguage('config.yaml')).toBe('unknown');
  });
});

describe('getDependencies', () => {
  it('returns @noble/post-quantum for JS asymmetric', () => {
    expect(getDependencies('javascript', 'asymmetric')).toEqual(['@noble/post-quantum']);
  });

  it('returns @noble/post-quantum for TS asymmetric', () => {
    expect(getDependencies('typescript', 'asymmetric')).toEqual(['@noble/post-quantum']);
  });

  it('returns oqs for Python asymmetric', () => {
    expect(getDependencies('python', 'asymmetric')).toEqual(['oqs']);
  });

  it('returns circl for Go asymmetric', () => {
    expect(getDependencies('go', 'asymmetric')).toEqual(['github.com/cloudflare/circl']);
  });

  it('returns golang.org/x/crypto/sha3 for Go hash', () => {
    expect(getDependencies('go', 'hash')).toEqual(['golang.org/x/crypto/sha3']);
  });

  it('returns pqcrypto for Rust asymmetric', () => {
    expect(getDependencies('rust', 'asymmetric')).toEqual(['pqcrypto']);
  });

  it('returns bcpqc for Java asymmetric', () => {
    expect(getDependencies('java', 'asymmetric')).toEqual(['bcpqc']);
  });

  it('returns empty array for JS hash (built-in)', () => {
    expect(getDependencies('javascript', 'hash')).toEqual([]);
  });

  it('returns empty array for JS symmetric (built-in)', () => {
    expect(getDependencies('javascript', 'symmetric')).toEqual([]);
  });

  it('returns empty array for unknown language', () => {
    expect(getDependencies('unknown', 'asymmetric')).toEqual([]);
  });
});
