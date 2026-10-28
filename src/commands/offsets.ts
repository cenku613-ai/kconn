import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import { formatOffsets } from '../formatter.js';
import type { OutputFormat } from '../types.js';

export function registerOffsetCommands(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('offsets <name>')
    .description('Show connector offsets')
    .action(async (name: string) => {
      const client = getClient();
      const format = getFormat();
      const offsets = await client.getConnectorOffsets(name);
      console.log(formatOffsets(offsets, format));
    });

  program
    .command('offsets-reset <name>')
    .description('Reset connector offsets')
    .option('--yes', 'Skip confirmation prompt')
    .action(async (name: string, opts) => {
      const client = getClient();
      const format = getFormat();

      const isCI = process.env.CI === 'true' || process.env.CI === '1';
      if (!opts.yes && !isCI) {
        console.error(`Error: pass --yes to confirm offset reset for connector '${name}'.`);
        process.exit(1);
      }

      await client.resetConnectorOffsets(name);

      if (format === 'json') {
        console.log(JSON.stringify({ name, status: 'offsets_reset' }, null, 2));
      } else {
        console.log(`Connector '${name}' offsets reset.`);
      }
    });
}
