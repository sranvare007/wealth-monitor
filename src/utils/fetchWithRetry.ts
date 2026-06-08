const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function isRetryable(res: Response): boolean {
  // Retry on server errors and rate-limiting; not on 4xx client errors
  return res.status >= 500 || res.status === 429;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(input, init);
      if (!res.ok && isRetryable(res) && attempt < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      // Network-level failure (no connection, timeout, etc.)
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }
  throw lastError;
}
