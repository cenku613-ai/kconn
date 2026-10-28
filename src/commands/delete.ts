import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import type { OutputFormat } from '../types.js';

export function registerDeleteCommand(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('delete <name>')
    .description('Delete a connector')
    .option('--yes', 'Skip confirmation prompt')
    .action(async (name: string, opts) => {
      const client = getClient();
      const format = getFormat();

      const isCI = process.env.CI === 'true' || process.env.CI === '1';
      if (!opts.yes && !isCI) {
        console.error(`Error: pass --yes to confirm deletion of connector '${name}'.`);
        process.exit(1);
      }

      await client.deleteConnector(name);

      if (format === 'json') {
        console.log(JSON.stringify({ name, status: 'deleted' }, null, 2));
      } else {
        console.log(`Connector '${name}' deleted.`);
      }
    });
}
