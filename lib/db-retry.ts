type RetriableDbError = Error & {
  code?: string;
};

// PostgreSQL error codes for transient connection issues
const RETRIABLE_DB_ERROR_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '57P01', '08006', '08001']);

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const err = lastError as RetriableDbError;
      console.log(`Attempt ${attempt} failed:`, err.message);

      if (attempt < maxRetries && err.code && RETRIABLE_DB_ERROR_CODES.has(err.code)) {
        console.log(`Retrying in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }

      break;
    }
  }

  throw lastError;
}
