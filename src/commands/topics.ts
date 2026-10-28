import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import { formatTopics } from '../formatter.js';
import type { OutputFormat } from '../types.js';

export function registerTopicsCommand(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('topics <name>')
    .description('Show connector topics')
    .option('--expand', 'Include record counts per topic')
    .action(async (name: string, opts) => {
      const client = getClient();
      const format = getFormat();
      const topics = await client.getConnectorTopics(name, opts.expand);
      console.log(formatTopics(topics, format));
    });
}
