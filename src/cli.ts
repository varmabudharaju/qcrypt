#!/usr/bin/env node
import { Command } from 'commander';
import { runBenchmarks } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { createServer } from './api/server.js';
import type { BenchmarkCategory } from './types.js';

const VALID_CATEGORIES: BenchmarkCategory[] = ['all', 'kex', 'sigs', 'sym', 'hash'];

const program = new Command()
  .name('qcrypt-bench')
  .description('Benchmark classical crypto and compare with post-quantum alternatives')
  .option('--iterations <n>', 'number of benchmark iterations', '1000')
  .option('--category <cat>', 'benchmark category: all, kex, sigs, sym, hash', 'all')
  .option('--json', 'output as JSON')
  .option('--serve', 'start web UI server')
  .option('--port <n>', 'server port', '3200');

program.parse();

const opts = program.opts();

async function main() {
  if (opts.serve) {
    const port = parseInt(opts.port, 10);
    const app = createServer();
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`qcrypt-bench server running on http://localhost:${port}`);
    return;
  }

  const iterations = parseInt(opts.iterations, 10);
  const category = opts.category as BenchmarkCategory;

  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`Invalid category: ${category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    process.exit(2);
  }

  const report = runBenchmarks({ iterations, category });

  if (opts.json) {
    console.log(formatJson(report));
  } else {
    console.log(formatTerminal(report));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
