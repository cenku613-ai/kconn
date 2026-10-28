export interface ClientConfig {
  serverUrl: string;
  username?: string;
  password?: string;
  timeout: number;
}

export type OutputFormat = 'table' | 'json';

export type ConnectorState = 'RUNNING' | 'PAUSED' | 'FAILED' | 'UNASSIGNED';

export interface ConnectorInfo {
  name: string;
  type: 'source' | 'sink';
  connector: Record<string, unknown>;
  tasks: TaskId[];
}

export interface TaskId {
  connector: string;
  task: number;
}

export interface ConnectorStatus {
  name: string;
  connector: {
    state: ConnectorState;
    worker_id: string;
    msg?: string;
  };
  tasks: TaskStatus[];
  type: 'source' | 'sink';
}

export interface TaskStatus {
  id: number;
  state: ConnectorState;
  worker_id: string;
  msg?: string;
  trace?: string;
}

export interface ConnectorConfig {
  [key: string]: string;
}

export interface CreateConnectorRequest {
  name: string;
  config: ConnectorConfig;
}

export interface ConnectorOffsets {
  offsets: ConnectorPartitionOffset[];
}

export interface ConnectorPartitionOffset {
  partition: Record<string, unknown>;
  offset: Record<string, unknown>;
}

export interface ConnectorTopics {
  [connectorName: string]: {
    topics: string[];
  };
}

export interface ConnectorPlugin {
  class: string;
  type: string;
  version: string;
}

export interface ValidationResult {
  name: string;
  error_count: number;
  groups: string[];
  configs: ValidationConfigEntry[];
}

export interface ValidationConfigEntry {
  definition: {
    name: string;
    type: string;
    required: boolean;
    default_value: string | null;
    importance: string;
    documentation: string;
    group: string;
    width: string;
    display_name: string;
    dependents: string[];
    order: number;
  };
  value: {
    name: string;
    value: string | null;
    recommended_values: string[];
    errors: string[];
    visible: boolean;
  };
}

export interface RestartOptions {
  includeTasks?: boolean;
  onlyFailed?: boolean;
  delayMs?: number;
}

export interface GlobalOptions {
  server?: string;
  username?: string;
  password?: string;
  output?: OutputFormat;
  color?: boolean;
  verbose?: boolean;
}
