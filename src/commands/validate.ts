import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import type { KafkaConnectClient } from '../client.js';
import { formatValidation } from '../formatter.js';
import type { ConnectorConfig, OutputFormat } from '../types.js';

export function registerValidateCommand(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('validate <connectorClass>')
    .description('Validate connector config against a plugin')
    .option('--config <path>', 'Config file to validate (JSON/YAML)')
    .action(async (connectorClass: string, opts) => {
      const client = getClient();
      const format = getFormat();

      let config: ConnectorConfig = {};
      if (opts.config) {
        const filePath = resolve(opts.config);
        const content = readFileSync(filePath, 'utf-8');
        if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          config = yaml.load(content) as ConnectorConfig;
        } else {
          config = JSON.parse(content);
        }
        if (config.config && typeof config.config === 'object') {
          config = config.config as ConnectorConfig;
        }
      }

      const result = await client.validateConnectorConfig(connectorClass, config);
      console.log(formatValidation(result, format));

      if (result.error_count > 0) {
        process.exit(1);
      }
    });
}
