import { fetchWithRetry } from '../utils/fetchWithRetry';

export const API_BASE_URL =
  'https://wealth-monitor-backend.vercel.app/api/v1';

export type ValidationError = { field: string; message: string };

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
};

/** Error carrying the server's message, HTTP status and any field-level errors. */
export class ApiError extends Error {
  status: number;
  errors?: ValidationError[];

  constructor(message: string, status: number, errors?: ValidationError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string | null;
};

/**
 * Low-level request helper for the wealth-monitor backend.
 * Unwraps the `{ success, message, data }` envelope and throws an ApiError
 * (with the server's message) on any non-success response.
 */
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetchWithRetry(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }

  if (!res.ok || !json || !json.success) {
    const message = json?.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status, json?.errors);
  }

  return json.data as T;
}
