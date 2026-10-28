import axios, { type AxiosInstance } from 'axios';
import type {
  ClientConfig,
  ConnectorConfig,
  ConnectorInfo,
  ConnectorOffsets,
  ConnectorPlugin,
  ConnectorStatus,
  ConnectorTopics,
  CreateConnectorRequest,
  RestartOptions,
  TaskStatus,
  ValidationResult,
} from './types.js';
import { fromAxiosError } from './errors.js';

export class KafkaConnectClient {
  private readonly http: AxiosInstance;
  private readonly serverUrl: string;

  constructor(config: ClientConfig) {
    this.serverUrl = config.serverUrl;
    this.http = axios.create({
      baseURL: config.serverUrl,
      timeout: config.timeout,
      auth: config.username && config.password
        ? { username: config.username, password: config.password }
        : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async listConnectors(expand = false): Promise<Record<string, unknown>[]> {
    try {
      const params: Record<string, string> = {};
      if (expand) params.expand = 'true';
      const res = await this.http.get('/connectors', { params });
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getConnector(name: string): Promise<ConnectorInfo> {
    try {
      const res = await this.http.get(`/connectors/${encodeURIComponent(name)}`);
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getConnectorConfig(name: string): Promise<ConnectorConfig> {
    try {
      const res = await this.http.get(`/connectors/${encodeURIComponent(name)}/config`);
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async createConnector(req: CreateConnectorRequest): Promise<ConnectorInfo> {
    try {
      const res = await this.http.post('/connectors', req);
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async updateConnectorConfig(name: string, config: ConnectorConfig): Promise<void> {
    try {
      await this.http.put(`/connectors/${encodeURIComponent(name)}/config`, config);
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async deleteConnector(name: string): Promise<void> {
    try {
      await this.http.delete(`/connectors/${encodeURIComponent(name)}`);
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getConnectorStatus(name: string): Promise<ConnectorStatus> {
    try {
      const res = await this.http.get(`/connectors/${encodeURIComponent(name)}/status`);
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async pauseConnector(name: string): Promise<void> {
    try {
      await this.http.put(`/connectors/${encodeURIComponent(name)}/pause`);
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async resumeConnector(name: string): Promise<void> {
    try {
      await this.http.put(`/connectors/${encodeURIComponent(name)}/resume`);
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async restartConnector(name: string, options?: RestartOptions): Promise<void> {
    try {
      const params: Record<string, string> = {};
      if (options?.includeTasks) params.includeTasks = 'true';
      if (options?.onlyFailed) params.onlyFailed = 'true';
      if (options?.delayMs !== undefined) params.delay = String(options.delayMs);
      await this.http.post(`/connectors/${encodeURIComponent(name)}/restart`, null, { params });
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getTasks(name: string): Promise<TaskStatus[]> {
    try {
      const res = await this.http.get(`/connectors/${encodeURIComponent(name)}/tasks`);
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getTaskStatus(name: string, taskId: number): Promise<TaskStatus> {
    try {
      const res = await this.http.get(
        `/connectors/${encodeURIComponent(name)}/tasks/${taskId}/status`
      );
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async restartTask(name: string, taskId: number, options?: RestartOptions): Promise<void> {
    try {
      const params: Record<string, string> = {};
      if (options?.delayMs !== undefined) params.delay = String(options.delayMs);
      await this.http.post(
        `/connectors/${encodeURIComponent(name)}/tasks/${taskId}/restart`,
        null,
        { params }
      );
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getConnectorOffsets(name: string): Promise<ConnectorOffsets> {
    try {
      const res = await this.http.get(`/connectors/${encodeURIComponent(name)}/offsets`);
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async resetConnectorOffsets(name: string): Promise<void> {
    try {
      await this.http.delete(`/connectors/${encodeURIComponent(name)}/offsets`);
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getConnectorTopics(name: string, expand = false): Promise<ConnectorTopics> {
    try {
      const params: Record<string, string> = {};
      if (expand) params.expand = 'records';
      const res = await this.http.get(
        `/connectors/${encodeURIComponent(name)}/topics`,
        { params }
      );
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async getConnectorPlugins(): Promise<ConnectorPlugin[]> {
    try {
      const res = await this.http.get('/connector-plugins');
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }

  async validateConnectorConfig(
    pluginClass: string,
    config: ConnectorConfig
  ): Promise<ValidationResult> {
    try {
      const res = await this.http.put(
        `/connector-plugins/${encodeURIComponent(pluginClass)}/config/validate`,
        config,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return res.data;
    } catch (err) {
      throw fromAxiosError(err, this.serverUrl);
    }
  }
}
