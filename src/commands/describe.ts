import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import { formatConnectorDetail, formatConnectorConfig } from '../formatter.js';
import type { OutputFormat } from '../types.js';

export function registerDescribeCommands(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('describe <name>')
    .description('Show full connector details')
    .action(async (name: string) => {
      const client = getClient();
      const format = getFormat();
      const info = await client.getConnector(name);
      console.log(formatConnectorDetail(info, format));
    });

  program
    .command('config <name>')
    .description('Show connector config')
    .action(async (name: string) => {
      const client = getClient();
      const format = getFormat();
      const config = await client.getConnectorConfig(name);
      console.log(formatConnectorConfig(config, format));
    });
}
