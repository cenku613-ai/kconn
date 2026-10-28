import { Command } from 'commander';
import type { KafkaConnectClient } from '../client.js';
import { formatConnectorStatus, formatTaskList, formatTaskStatus } from '../formatter.js';
import type { OutputFormat } from '../types.js';

export function registerStatusCommands(
  program: Command,
  getClient: () => KafkaConnectClient,
  getFormat: () => OutputFormat
) {
  program
    .command('status <name>')
    .description('Show connector and task status')
    .option('--tasks-only', 'Show only task statuses')
    .option('--task <id>', 'Show status of a specific task', parseInt)
    .action(async (name: string, opts) => {
      const client = getClient();
      const format = getFormat();

      if (opts.task !== undefined) {
        const taskStatus = await client.getTaskStatus(name, opts.task);
        console.log(formatTaskStatus(taskStatus, format));
        return;
      }

      const status = await client.getConnectorStatus(name);
      console.log(formatConnectorStatus(status, format));
    });

  program
    .command('tasks <name>')
    .description('List all tasks with their statuses')
    .action(async (name: string) => {
      const client = getClient();
      const format = getFormat();
      const tasks = await client.getTasks(name);
      console.log(formatTaskList(tasks, format));
    });
}
