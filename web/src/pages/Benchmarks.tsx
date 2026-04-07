import { useState, useEffect } from 'react';
import { runBenchmark, getBenchmarkHistory, getReference } from '../api';
import type { BenchmarkReport, BenchmarkResult, ReferenceData } from '../api';

const CATEGORIES = ['all', 'kex', 'sigs', 'sym', 'hash'] as const;

const CATEGORY_INFO: Record<string, { label: string; desc: string }> = {
  all: { label: 'ALL', desc: 'Run all benchmark categories' },
  kex: { label: 'KEY EXCHANGE', desc: 'RSA, ECDH, X25519 key generation — the algorithms that establish shared secrets' },
  sigs: { label: 'SIGNATURES', desc: 'RSA, ECDSA, Ed25519 sign & verify — used for authentication and integrity' },
  sym: { label: 'SYMMETRIC', desc: 'AES-128-GCM vs AES-256-GCM encrypt & decrypt — bulk data encryption' },
  hash: { label: 'HASHING', desc: 'MD5, SHA-256, SHA-512, SHA3-256 — data integrity and fingerprinting' },
};

export function Benchmarks() {
  const [category, setCategory] = useState<string>('all');
  const [iterations, setIterations] = useState(1000);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<BenchmarkReport | null>(null);
  const [history, setHistory] = useState<BenchmarkReport[]>([]);
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    getBenchmarkHistory().then(setHistory).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load history'));
    getReference().then(setReference).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load reference data'));
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const result = await runBenchmark({
        iterations,
        category: category === 'all' ? undefined : category,
      });
      setCurrent(result);
      setHistory((prev) => [result, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setRunning(false);
    }
  };

  const results = current?.results ?? [];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mb-2">
            PERFORMANCE ANALYSIS MODULE
          </p>
          <h1 className="font-headline text-3xl font-bold text-primary uppercase tracking-tight">
            CRYPTOGRAPHIC BENCHMARKS
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-xl">
            Measure real-world performance of classical cryptographic algorithms on your hardware, compared against NIST post-quantum standards.
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`px-4 py-2 font-mono text-xs font-bold transition-colors inline-flex items-center gap-2 ${
            showInfo
              ? 'bg-primary-container text-on-primary'
              : 'bg-surface-container text-primary-container hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
          {showInfo ? 'HIDE INFO' : 'HOW IT WORKS'}
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-surface-container-lowest p-6 space-y-5">
          <div>
            <h3 className="font-mono text-xs font-bold text-primary-container tracking-wider mb-2">WHAT THIS DOES</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              This tool runs real cryptographic operations on your machine — key generation, signing, verification,
              encryption, decryption, and hashing — thousands of times to measure their actual speed. It then
              compares your local results against NIST reference benchmarks for post-quantum (PQC) replacements,
              so you can see exactly what the performance tradeoff looks like on your hardware.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold text-primary-container tracking-wider mb-2">WHY IT MATTERS</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              The most common objection to migrating to quantum-safe cryptography is performance concerns.
              These benchmarks give you hard numbers to make informed decisions. For example, ML-KEM (the PQC
              replacement for RSA key exchange) is actually ~1000x faster at key generation than RSA-2048 —
              the tradeoff is larger keys, not slower speed.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold text-primary-container tracking-wider mb-3">CATEGORIES EXPLAINED</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(CATEGORY_INFO).filter(([k]) => k !== 'all').map(([key, info]) => (
                <div key={key} className="bg-surface-container-low p-3">
                  <p className="font-mono text-[10px] font-bold text-primary tracking-wider">{info.label}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{info.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold text-primary-container tracking-wider mb-2">HOW TO READ THE RESULTS</h3>
            <div className="space-y-2 text-sm text-on-surface-variant">
              <p><span className="font-mono text-primary-container">Ops/sec</span> — operations per second. Higher is better.</p>
              <p><span className="font-mono text-primary-container">Avg Time</span> — milliseconds per operation. Lower is better.</p>
              <p><span className="font-mono text-primary-container">PQC SAFE</span> — algorithm is resistant to quantum attacks.</p>
              <p><span className="font-mono text-error">VULNERABLE</span> — algorithm will be broken by quantum computers (Shor's or Grover's algorithm).</p>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs font-bold text-primary-container tracking-wider mb-2">PQC REFERENCE DATA</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              The "PQC Reference Comparison" section shows performance numbers from NIST's reference
              implementations running on Intel Skylake. These are the quantum-safe algorithms you'd migrate to:
              <span className="font-mono text-primary-container"> ML-KEM</span> (FIPS 203, replaces RSA/ECDH for key exchange),
              <span className="font-mono text-primary-container"> ML-DSA</span> (FIPS 204, replaces RSA/ECDSA for signatures), and
              <span className="font-mono text-primary-container"> SLH-DSA</span> (FIPS 205, conservative hash-based signatures for firmware/code signing).
            </p>
          </div>

          <div className="pt-2">
            <p className="font-mono text-[10px] text-on-surface-variant/50 tracking-wider">
              NOTE: BENCHMARKS USE NODE.JS CRYPTO MODULE. RESULTS REFLECT YOUR CPU, OS, AND NODE VERSION.
              PQC REFERENCE NUMBERS ARE FROM NIST ROUND 3 C IMPLEMENTATIONS — ACTUAL PQC PERFORMANCE IN
              YOUR LANGUAGE MAY VARY.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-surface-container-low p-6 space-y-4">
        {/* Category selector */}
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-2">CATEGORY</p>
          <div className="flex gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 font-mono text-[10px] font-bold tracking-wider uppercase transition-all ${
                  category === cat
                    ? 'bg-primary-container text-on-primary shadow-neon-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="font-mono text-[10px] text-on-surface-variant/50 mt-2">
            {CATEGORY_INFO[category]?.desc}
          </p>
        </div>

        {/* Iterations + Run */}
        <div className="flex items-end gap-4">
          <div>
            <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-2">ITERATIONS</p>
            <input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value) || 100)}
              min={10}
              max={100000}
              className="w-32 px-3 py-2 bg-surface-container-lowest text-primary font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-container/50 border-none"
            />
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="btn-neon px-8 py-2.5 text-xs"
          >
            {running ? 'RUNNING...' : 'RUN BENCHMARK'}
          </button>
        </div>

        {error && <p className="font-mono text-xs text-error">{error}</p>}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div>
          <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase mb-3">
            BENCHMARK RESULTS
          </h2>
          <div className="bg-surface-container-low overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container">
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Algorithm</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Operation</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Ops/sec</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Avg Time</th>
                  <th className="text-center px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r: BenchmarkResult, i: number) => (
                  <tr key={i} className="border-t border-surface-container-high/50 hover:bg-surface-container/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-primary">{r.algorithm}</td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{r.operation}</td>
                    <td className="px-4 py-3 font-mono text-sm text-right text-primary-fixed-dim">
                      {r.opsPerSecond.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-right text-on-surface-variant">
                      {r.avgTimeMs.toFixed(3)}ms
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.quantumSafe ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 bg-primary-container/15 text-primary-container">
                          PQC SAFE
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] px-2 py-0.5 bg-error-container/40 text-error">
                          VULNERABLE
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PQC Reference */}
      {reference && reference.results.length > 0 && (
        <div>
          <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase mb-1">
            PQC REFERENCE COMPARISON
          </h2>
          <p className="font-mono text-[10px] text-on-surface-variant/50 mb-3">
            NIST Round 3 reference implementations (Intel Skylake) — these are the quantum-safe replacements
          </p>
          <div className="bg-surface-container-low overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container">
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Algorithm</th>
                  <th className="text-left px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Operation</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Ops/sec</th>
                  <th className="text-right px-4 py-3 font-mono text-[10px] text-on-surface-variant tracking-wider uppercase">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {reference.results.map((r: BenchmarkResult, i: number) => (
                  <tr key={i} className="border-t border-surface-container-high/50">
                    <td className="px-4 py-3 font-mono text-sm text-primary-container">{r.algorithm}</td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{r.operation}</td>
                    <td className="px-4 py-3 font-mono text-sm text-right text-primary-fixed-dim">
                      {r.opsPerSecond.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-right text-on-surface-variant">
                      {r.avgTimeMs.toFixed(3)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase mb-3">
            BENCHMARK HISTORY
          </h2>
          <div className="space-y-1">
            {history.slice(0, 10).map((h) => (
              <div
                key={h.id}
                onClick={() => setCurrent(h)}
                className={`flex items-center justify-between bg-surface-container-low p-3 hover:bg-surface-container transition-colors cursor-pointer ${
                  current?.id === h.id ? 'bg-surface-container' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-on-surface-variant">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant/50">
                    {h.iterations} iterations
                  </span>
                  {h.category && (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-surface-container-high text-on-surface-variant">
                      {h.category.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs text-primary-container">
                  {h.results.length} algorithms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
