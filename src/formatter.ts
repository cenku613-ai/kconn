import Table from 'cli-table3';
import chalk from 'chalk';
import type {
  ConnectorConfig,
  ConnectorInfo,
  ConnectorOffsets,
  ConnectorPlugin,
  ConnectorStatus,
  ConnectorTopics,
  OutputFormat,
  TaskStatus,
  ValidationResult,
} from './types.js';

function stateColor(state: string): string {
  switch (state) {
    case 'RUNNING': return chalk.green(state);
    case 'FAILED': return chalk.red(state);
    case 'PAUSED': return chalk.yellow(state);
    case 'UNASSIGNED': return chalk.gray(state);
    default: return state;
  }
}

function outputJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatConnectorList(
  connectors: Record<string, unknown>[],
  format: OutputFormat
): string {
  if (format === 'json') return outputJson(connectors);

  const table = new Table({
    head: ['Name', 'Type', 'State', 'Worker'],
  });

  for (const c of connectors) {
    const info = c as Record<string, unknown>;
    const connector = (info.connector ?? {}) as Record<string, string>;
    const status = (info.status ?? {}) as {
      connector?: { state?: string; worker_id?: string };
    };
    const state = status.connector?.state ?? 'UNKNOWN';
    const worker = status.connector?.worker_id ?? '-';
    const type = connector['connector.class'] ?? '-';

    table.push([
      String(info.name ?? ''),
      String(info.type ?? '-'),
      stateColor(state),
      worker,
    ]);
  }

  return table.toString();
}

export function formatConnectorDetail(info: ConnectorInfo, format: OutputFormat): string {
  if (format === 'json') return outputJson(info);

  const lines = [
    `Name:    ${info.name}`,
    `Type:    ${info.type}`,
    `Tasks:   ${info.tasks.map(t => t.task).join(', ') || 'none'}`,
  ];
  return lines.join('\n');
}

export function formatConnectorConfig(config: ConnectorConfig, format: OutputFormat): string {
  if (format === 'json') return outputJson(config);

  const table = new Table({ head: ['Key', 'Value'] });
  for (const [key, value] of Object.entries(config)) {
    table.push([key, value]);
  }
  return table.toString();
}

export function formatConnectorStatus(status: ConnectorStatus, format: OutputFormat): string {
  if (format === 'json') return outputJson(status);

  const lines = [
    'Connector:',
    `  Name:    ${status.name}`,
    `  Type:    ${status.type}`,
    `  State:   ${stateColor(status.connector.state)}`,
    `  Worker:  ${status.connector.worker_id}`,
  ];

  if (status.connector.msg) {
    lines.push(`  Message: ${status.connector.msg}`);
  }

  if (status.tasks.length > 0) {
    lines.push('', 'Tasks:');
    const table = new Table({ head: ['ID', 'State', 'Worker', 'Error'] });
    for (const task of status.tasks) {
      table.push([
        String(task.id),
        stateColor(task.state),
        task.worker_id,
        task.msg ?? '',
      ]);
    }
    lines.push(table.toString());
  }

  return lines.join('\n');
}

export function formatTaskList(tasks: TaskStatus[], format: OutputFormat): string {
  if (format === 'json') return outputJson(tasks);

  const table = new Table({ head: ['ID', 'State', 'Worker', 'Error'] });
  for (const task of tasks) {
    table.push([
      String(task.id),
      stateColor(task.state),
      task.worker_id,
      task.msg ?? '',
    ]);
  }
  return table.toString();
}

export function formatTaskStatus(status: TaskStatus, format: OutputFormat): string {
  if (format === 'json') return outputJson(status);

  const lines = [
    `Task ID:  ${status.id}`,
    `State:    ${stateColor(status.state)}`,
    `Worker:   ${status.worker_id}`,
  ];
  if (status.msg) lines.push(`Message:  ${status.msg}`);
  if (status.trace) lines.push(`Trace:\n${status.trace}`);
  return lines.join('\n');
}

export function formatOffsets(offsets: ConnectorOffsets, format: OutputFormat): string {
  if (format === 'json') return outputJson(offsets);

  const table = new Table({ head: ['Partition', 'Offset'] });
  for (const entry of offsets.offsets) {
    table.push([
      JSON.stringify(entry.partition),
      JSON.stringify(entry.offset),
    ]);
  }
  return table.toString();
}

export function formatTopics(topics: ConnectorTopics, format: OutputFormat): string {
  if (format === 'json') return outputJson(topics);

  const lines: string[] = [];
  for (const [name, data] of Object.entries(topics)) {
    lines.push(`Connector: ${name}`);
    for (const topic of data.topics) {
      lines.push(`  - ${topic}`);
    }
  }
  return lines.join('\n');
}

export function formatPlugins(plugins: ConnectorPlugin[], format: OutputFormat): string {
  if (format === 'json') return outputJson(plugins);

  const table = new Table({ head: ['Class', 'Type', 'Version'] });
  for (const p of plugins) {
    table.push([p.class, p.type, p.version]);
  }
  return table.toString();
}

export function formatValidation(result: ValidationResult, format: OutputFormat): string {
  if (format === 'json') return outputJson(result);

  const lines = [
    `Plugin: ${result.name}`,
    `Errors: ${result.error_count}`,
  ];

  if (result.error_count > 0) {
    const table = new Table({ head: ['Property', 'Errors'] });
    for (const entry of result.configs) {
      if (entry.value.errors.length > 0) {
        table.push([entry.definition.name, entry.value.errors.join(', ')]);
      }
    }
    lines.push(table.toString());
  }

  return lines.join('\n');
}
