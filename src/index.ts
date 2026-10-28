import { Command } from 'commander';
import { KafkaConnectClient } from './client.js';
import { resolveConfig, resolveOutputFormat } from './config.js';
import { KconnError } from './errors.js';
import type { GlobalOptions, OutputFormat } from './types.js';
import { registerListCommands } from './commands/list.js';
import { registerDescribeCommands } from './commands/describe.js';
import { registerStatusCommands } from './commands/status.js';
import { registerCreateCommand } from './commands/create.js';
import { registerUpdateCommand } from './commands/update.js';
import { registerDeleteCommand } from './commands/delete.js';
import { registerLifecycleCommands } from './commands/lifecycle.js';
import { registerOffsetCommands } from './commands/offsets.js';
import { registerTopicsCommand } from './commands/topics.js';
import { registerValidateCommand } from './commands/validate.js';

const program = new Command();

program
  .name('kconn')
  .description('CLI tool to manage Kafka Connectors via the Kafka Connect REST API')
  .version('1.0.0')
  .option('-s, --server <url>', 'Kafka Connect REST API URL (env: KCONN_SERVER)')
  .option('-u, --username <user>', 'Basic auth username (env: KCONN_USERNAME)')
  .option('-p, --password <pass>', 'Basic auth password (env: KCONN_PASSWORD)')
  .option('-o, --output <format>', 'Output format: table | json (default: table)')
  .option('--no-color', 'Disable colored output')
  .option('-v, --verbose', 'Show HTTP request/response details');

let cachedClient: KafkaConnectClient | undefined;
let cachedFormat: OutputFormat | undefined;

function getClient(): KafkaConnectClient {
  if (!cachedClient) {
    const opts = program.opts<GlobalOptions>();
    cachedClient = new KafkaConnectClient(resolveConfig(opts));
  }
  return cachedClient;
}

function getFormat(): OutputFormat {
  if (!cachedFormat) {
    cachedFormat = resolveOutputFormat(program.opts<GlobalOptions>());
  }
  return cachedFormat;
}

registerListCommands(program, getClient, getFormat);
registerDescribeCommands(program, getClient, getFormat);
registerStatusCommands(program, getClient, getFormat);
registerCreateCommand(program, getClient, getFormat);
registerUpdateCommand(program, getClient, getFormat);
registerDeleteCommand(program, getClient, getFormat);
registerLifecycleCommands(program, getClient, getFormat);
registerOffsetCommands(program, getClient, getFormat);
registerTopicsCommand(program, getClient, getFormat);
registerValidateCommand(program, getClient, getFormat);

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof KconnError) {
      const opts = program.opts<GlobalOptions>();
      if (opts.verbose && err.statusCode) {
        console.error(`[HTTP ${err.statusCode}] ${err.message}`);
      } else {
        console.error(`Error: ${err.message}`);
      }
      process.exit(1);
    }
    throw err;
  }
}

main();
