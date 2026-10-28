import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import type { KafkaConnectClient } from '../client.js';
import type { ConnectorConfig, OutputFormat } from '../types.js';

export function registerUpdateCommand(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('update <name>')
    .description('Update connector config')
    .option('-f, --file <path>', 'Update config from JSON/YAML file')
    .option('-s, --set <key=value...>', 'Set individual config key-value pairs')
    .action(async (name: string, opts) => {
      const client = getClient();
      const format = getFormat();

      if (!opts.file && !opts.set) {
        console.error('Error: provide --file or --set to update config.');
        process.exit(1);
      }

      let config: ConnectorConfig;

      if (opts.file) {
        const filePath = resolve(opts.file);
        const content = readFileSync(filePath, 'utf-8');
        if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          config = yaml.load(content) as ConnectorConfig;
        } else {
          config = JSON.parse(content);
        }
        if (config.config && typeof config.config === 'object') {
          config = config.config as ConnectorConfig;
        }
      } else {
        const existing = await client.getConnectorConfig(name);
        config = { ...existing };
        for (const pair of opts.set as string[]) {
          const eqIndex = pair.indexOf('=');
          if (eqIndex === -1) {
            console.error(`Error: invalid --set format '${pair}'. Use key=value.`);
            process.exit(1);
          }
          config[pair.slice(0, eqIndex)] = pair.slice(eqIndex + 1);
        }
      }

      await client.updateConnectorConfig(name, config);

      if (format === 'json') {
        console.log(JSON.stringify({ name, status: 'updated' }, null, 2));
      } else {
        console.log(`Connector '${name}' config updated.`);
      }
    });
}
