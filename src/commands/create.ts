import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import type { KafkaConnectClient } from '../client.js';
import type { ConnectorConfig, CreateConnectorRequest, OutputFormat } from '../types.js';

export function registerCreateCommand(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('create <file>')
    .description('Create a connector from a JSON or YAML config file')
    .option('-n, --name <name>', 'Override connector name from file')
    .option('--dry-run', 'Validate and print what would be sent without creating')
    .action(async (file: string, opts) => {
      const client = getClient();
      const format = getFormat();
      const filePath = resolve(file);
      const content = readFileSync(filePath, 'utf-8');

      let parsed: Record<string, unknown>;
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        parsed = yaml.load(content) as Record<string, unknown>;
      } else {
        parsed = JSON.parse(content);
      }

      const name = opts.name
        ?? (parsed.name as string | undefined)
        ?? ((parsed.config as Record<string, unknown> | undefined)?.['name'] as string | undefined);
      const config = ((parsed.config ?? parsed) as ConnectorConfig);

      if (!name) {
        console.error('Error: connector name is required. Use -n <name> or include it in the config file.');
        process.exit(1);
      }

      const request: CreateConnectorRequest = { name, config };

      if (opts.dryRun) {
        if (format === 'json') {
          console.log(JSON.stringify(request, null, 2));
        } else {
          console.log(`Would create connector '${name}' with config:`);
          for (const [key, value] of Object.entries(config)) {
            console.log(`  ${key} = ${value}`);
          }
        }
        return;
      }

      const result = await client.createConnector(request);
      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Connector '${result.name}' created successfully.`);
      }
    });
}
