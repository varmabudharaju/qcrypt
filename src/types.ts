export type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';

export type AlgorithmCategory = 'asymmetric' | 'symmetric' | 'hash' | 'protocol';

export type UsageType = 'operation' | 'import' | 'key-material' | 'config' | 'reference' | 'comment';

export interface CertificateInfo {
  keyType: string;
  keySize: number;
  signatureAlgorithm: string;
  subject?: string;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
}

export interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: AlgorithmCategory;
  risk: RiskLevel;
  usageType: UsageType;
  snippet: string;
  explanation: string;
  replacement: string;
  keySize?: number;
  certInfo?: CertificateInfo;
}

export interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  enrichedFindings: EnrichedFinding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  usageBreakdown: { operations: number; imports: number; keyMaterial: number; config: number; references: number; comments: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  readiness: ReadinessScore;
  quantumSummary: QuantumSummary;
  languageCoverage?: { scanned: number; skipped: number; unsupportedExtensions: { ext: string; count: number }[] };
}

export interface AlgorithmRule {
  id: string;
  name: string;
  risk: RiskLevel;
  category: AlgorithmCategory;
}

export interface PatternMatch {
  algorithm: string;
  line: number;
  snippet: string;
  usageType: UsageType;
  keySize?: number;
}

export interface LanguagePatterns {
  extensions: string[];
  patterns: Array<{
    algorithm: string;
    regex: RegExp;
  }>;
}

export interface FindingContext {
  sensitivity: 'high' | 'medium' | 'low';
  hndlRisk: boolean;
  isTestFile: boolean;
  migrationEffort: 'low' | 'medium' | 'high';
}

export interface EnrichedFinding extends Finding {
  context: FindingContext;
}

export interface DimensionScore {
  score: number;
  weighted: number;
  details: string;
}

export interface ReadinessScore {
  overall: number;
  dimensions: {
    vulnerability: DimensionScore;
    priority: DimensionScore;
    migration: DimensionScore;
    agility: DimensionScore;
  };
}

export interface QuantumThreatEntry {
  algorithm: string;
  classicalBreakTime: string;
  quantumBreakTime: string;
  quantumAlgorithm: string;
  speedup: string;
  qubitsRequired: string;
  threatLevel: 'broken-classical' | 'broken-quantum' | 'weakened' | 'quantum-safe';
  citation: string;
}

export interface QuantumSummary {
  weakestLink: QuantumThreatEntry | null;
  threats: QuantumThreatEntry[];
}

export interface QcryptConfig {
  sensitivity?: {
    high?: string[];
    low?: string[];
    ignore?: string[];
  };
}

// ── Benchmark types ──

export type Operation = 'keygen' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'hash' | 'encaps' | 'decaps';
export type BenchmarkCategory = 'all' | 'kex' | 'sigs' | 'sym' | 'hash';

export interface BenchmarkResult {
  algorithm: string;
  operation: Operation;
  opsPerSecond: number;
  avgTimeMs: number;
  iterations: number;
  isReference: boolean;
  quantumSafe: boolean;
}

export interface AlgorithmProfile {
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash';
  quantumSafe: boolean;
  publicKeySize: number;
  privateKeySize: number;
  signatureSize?: number;
  ciphertextSize?: number;
  securityLevel: string;
}

export interface BenchmarkReport {
  id: string;
  runAt: string;
  platform: { os: string; arch: string; node: string; cpuModel: string };
  iterations: number;
  results: BenchmarkResult[];
  profiles: AlgorithmProfile[];
  comparisons: Comparison[];
}

export interface Comparison {
  classical: string;
  postQuantum: string;
  speedup: string;
  sizeTradeoff: string;
  explanation: string;
}

// ── Migration types ──

export type Priority = 'immediate' | 'short-term' | 'long-term';
export type Effort = 'low' | 'medium' | 'high';

export interface MigrationStep {
  finding: Finding;
  priority: Priority;
  action: string;
  codeExample: string;
  dependencies: string[];
  effort: Effort;
  notes: string;
}

export interface MigrationPlan {
  id: string;
  generatedAt: string;
  scanReport: ScanReport;
  steps: MigrationStep[];
  summary: { immediate: number; shortTerm: number; longTerm: number };
  estimatedEffort: string;
}
