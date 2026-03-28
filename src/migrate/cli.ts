#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';
import { generateMigrationPlan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatMarkdown } from './reporters/markdown.js';
import { formatJson } from './reporters/json.js';
import { createServer } from '../api/server.js';
import type { ScanReport } from './types.js';

const program = new Command()
  .name('qcrypt-migrate')
  .description('Generate post-quantum migration guides from scan results')
  .argument('[path]', 'path to scan for vulnerabilities')
  .option('--scan-file <file>', 'use existing scan results JSON file')
  .option('--json', 'output as JSON')
  .option('--markdown', 'output as markdown (writes migration-plan.md)')
  .option('--serve', 'start web UI server')
  .option('--port <n>', 'server port', '3200');

program.parse();

const opts = program.opts();
const targetPath = program.args[0];

async function main() {
  if (opts.serve) {
    const port = parseInt(opts.port, 10);
    const app = createServer();
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`qcrypt-migrate server running on http://localhost:${port}`);
    return;
  }

  let scanReport: ScanReport;

  if (opts.scanFile) {
    const content = readFileSync(opts.scanFile, 'utf-8');
    scanReport = JSON.parse(content) as ScanReport;
  } else if (targetPath) {
    const { runScan } = await import('./scan-runner.js');
    scanReport = await runScan(targetPath);
  } else {
    console.error('Error: provide a path to scan or --scan-file with existing results');
    process.exit(2);
  }

  const plan = generateMigrationPlan(scanReport);

  if (opts.json) {
    console.log(formatJson(plan));
  } else if (opts.markdown) {
    const content = formatMarkdown(plan);
    writeFileSync('migration-plan.md', content);
    console.log('Migration plan written to migration-plan.md');
  } else {
    console.log(formatTerminal(plan));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
