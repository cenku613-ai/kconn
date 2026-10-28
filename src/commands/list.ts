import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import { formatConnectorList, formatPlugins } from '../formatter.js';
import type { OutputFormat } from '../types.js';

export function registerListCommands(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('list')
    .description('List all connectors')
    .option('--expand', 'Include status for each connector')
    .option('--state <state>', 'Filter by state: RUNNING|PAUSED|FAILED|UNASSIGNED')
    .action(async (opts) => {
      const client = getClient();
      const format = getFormat();
      const connectors = await client.listConnectors(opts.expand);

      let filtered = connectors;
      if (opts.state) {
        const state = opts.state.toUpperCase();
        filtered = connectors.filter((c) => {
          const status = (c as Record<string, unknown>).status as {
            connector?: { state?: string };
          } | undefined;
          return status?.connector?.state === state;
        });
      }

      console.log(formatConnectorList(filtered, format));
    });

  program
    .command('plugins')
    .description('List available connector plugins')
    .action(async () => {
      const client = getClient();
      const format = getFormat();
      const plugins = await client.getConnectorPlugins();
      console.log(formatPlugins(plugins, format));
    });
}
