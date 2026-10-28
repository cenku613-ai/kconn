export class KconnError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'KconnError';
    this.statusCode = statusCode;
  }
}

export class ConnectionError extends KconnError {
  constructor(url: string, cause?: string) {
    super(`Cannot reach Kafka Connect at ${url}${cause ? `: ${cause}` : ''}`);
    this.name = 'ConnectionError';
  }
}

export class AuthenticationError extends KconnError {
  constructor() {
    super('Authentication failed. Check your username and password.', 401);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends KconnError {
  constructor() {
    super('Access denied.', 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends KconnError {
  constructor(resource: string) {
    super(`${resource} not found.`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends KconnError {
  constructor(message?: string) {
    super(message ?? 'Connector rebalancing, try again.', 409);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends KconnError {
  constructor(message: string) {
    super(`Invalid config: ${message}`, 400);
    this.name = 'ValidationError';
  }
}

export class ServerError extends KconnError {
  constructor(message: string) {
    super(`Server error: ${message}`);
    this.name = 'ServerError';
  }
}

export function fromAxiosError(error: unknown, url: string): KconnError {
  if (!error || typeof error !== 'object') {
    return new ConnectionError(url, String(error));
  }

  const axiosErr = error as {
    code?: string;
    message?: string;
    response?: { status: number; data?: unknown };
  };

  if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ENOTFOUND' || axiosErr.code === 'ECONNABORTED') {
    return new ConnectionError(url, axiosErr.message);
  }

  if (!axiosErr.response) {
    return new ConnectionError(url, axiosErr.message);
  }

  const { status, data } = axiosErr.response;
  const message = extractMessage(data) ?? `HTTP ${status}`;

  switch (status) {
    case 401:
      return new AuthenticationError();
    case 403:
      return new ForbiddenError();
    case 404:
      return new NotFoundError(message);
    case 409:
      return new ConflictError(message);
    case 400:
      return new ValidationError(message);
    default:
      if (status >= 500) {
        return new ServerError(message);
      }
      return new KconnError(message, status);
  }
}

function extractMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return undefined;
}
