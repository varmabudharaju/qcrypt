import { scan } from 'qcrypt-scan';
import type { ScanReport } from './types.js';

export async function runScan(targetPath: string): Promise<ScanReport> {
  return (await scan(targetPath)) as ScanReport;
}
