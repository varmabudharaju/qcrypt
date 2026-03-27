#!/usr/bin/env node
import { Command } from 'commander';
import { scan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatJson } from './reporters/json.js';
import { createServer } from './api/server.js';

const program = new Command();

program
  .name('qcrypt-scan')
  .description('Scan codebases for quantum-vulnerable cryptography')
  .version('0.1.0');

program
  .argument('[path]', 'path to scan', '.')
  .option('--json', 'output as JSON')
  .option('--serve', 'start API server')
  .option('--port <number>', 'API server port', '3100')
  .action(async (targetPath: string, options: { json?: boolean; serve?: boolean; port?: string }) => {
    if (options.serve) {
      const port = parseInt(options.port ?? '3100', 10);
      const server = createServer();
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`qcrypt-scan API server running on http://localhost:${port}`);
      return;
    }

    try {
      const report = await scan(targetPath);

      if (options.json) {
        console.log(formatJson(report));
      } else {
        console.log(formatTerminal(report));
      }

      if (report.summary.critical > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(2);
    }
  });

program.parse();
