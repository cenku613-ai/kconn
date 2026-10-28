import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import type { OutputFormat } from '../types.js';

export function registerLifecycleCommands(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('pause <name>')
    .description('Pause a connector')
    .action(async (name: string) => {
      const client = getClient();
      const format = getFormat();
      await client.pauseConnector(name);

      if (format === 'json') {
        console.log(JSON.stringify({ name, status: 'paused' }, null, 2));
      } else {
        console.log(`Connector '${name}' paused.`);
      }
    });

  program
    .command('resume <name>')
    .description('Resume a paused connector')
    .action(async (name: string) => {
      const client = getClient();
      const format = getFormat();
      await client.resumeConnector(name);

      if (format === 'json') {
        console.log(JSON.stringify({ name, status: 'resumed' }, null, 2));
      } else {
        console.log(`Connector '${name}' resumed.`);
      }
    });

  program
    .command('restart <name>')
    .description('Restart a connector')
    .option('--include-tasks', 'Also restart all tasks')
    .option('--only-failed', 'Only restart failed tasks')
    .option('--delay <ms>', 'Delay in ms before restart', parseInt)
    .action(async (name: string, opts) => {
      const client = getClient();
      const format = getFormat();
      await client.restartConnector(name, {
        includeTasks: opts.includeTasks,
        onlyFailed: opts.onlyFailed,
        delayMs: opts.delay,
      });

      if (format === 'json') {
        console.log(JSON.stringify({ name, status: 'restarted' }, null, 2));
      } else {
        console.log(`Connector '${name}' restart initiated.`);
      }
    });

  program
    .command('restart-task <name> <taskId>')
    .description('Restart a specific task')
    .option('--delay <ms>', 'Delay in ms before restart', parseInt)
    .action(async (name: string, taskId: string, opts) => {
      const client = getClient();
      const format = getFormat();
      await client.restartTask(name, parseInt(taskId), { delayMs: opts.delay });

      if (format === 'json') {
        console.log(JSON.stringify({ name, task: parseInt(taskId), status: 'restarted' }, null, 2));
      } else {
        console.log(`Task ${taskId} of connector '${name}' restart initiated.`);
      }
    });
}
