export type BackendErrorCode =
  | 'not_configured'
  | 'not_authenticated'
  | 'offline'
  | 'invalid_data'
  | 'conflict'
  | 'remote'
  | 'cache'
  | 'migration_already_completed';

export class BackendError extends Error {
  readonly code: BackendErrorCode;
  readonly retryable: boolean;
  readonly cause?: unknown;

  constructor(code: BackendErrorCode, message: string, options?: { retryable?: boolean; cause?: unknown }) {
    super(message);
    this.name = 'BackendError';
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}

export function asBackendError(error: unknown, fallbackMessage: string): BackendError {
  if (error instanceof BackendError) return error;
  const candidate = error as { message?: string; code?: string } | null;
  const message = candidate?.message || fallbackMessage;
  const isConflict = candidate?.code === '40001' || candidate?.code === 'P0002';
  const migrationExists = candidate?.code === '23505';
  return new BackendError(isConflict ? 'conflict' : migrationExists ? 'migration_already_completed' : 'remote', message, {
    retryable: !migrationExists,
    cause: error,
  });
}
