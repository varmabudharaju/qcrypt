export interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash' | 'protocol';
  risk: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';
  snippet: string;
  explanation: string;
  replacement: string;
}

export interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

const BASE = '/api';

export async function scanPath(path: string): Promise<ScanReport> {
  const res = await fetch(`${BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`);
  return res.json();
}

export async function getScans(): Promise<ScanReport[]> {
  const res = await fetch(`${BASE}/scans`);
  if (!res.ok) throw new Error(`Failed to fetch scans: ${res.statusText}`);
  return res.json();
}

export async function getScan(id: string): Promise<ScanReport> {
  const res = await fetch(`${BASE}/scans/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch scan: ${res.statusText}`);
  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}
