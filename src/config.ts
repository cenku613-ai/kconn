import type { ClientConfig, GlobalOptions, OutputFormat } from './types.js';

export function resolveConfig(options: GlobalOptions): ClientConfig {
  return {
    serverUrl: options.server ?? process.env.KCONN_SERVER ?? 'http://localhost:8083',
    username: options.username ?? process.env.KCONN_USERNAME,
    password: options.password ?? process.env.KCONN_PASSWORD,
    timeout: 30_000,
  };
}

export function resolveOutputFormat(options: GlobalOptions): OutputFormat {
  if (options.output) return options.output;
  if (process.env.KCONN_OUTPUT === 'table' || process.env.KCONN_OUTPUT === 'json') {
    return process.env.KCONN_OUTPUT;
  }
  if (!process.stdout.isTTY) return 'json';
  return 'table';
}
