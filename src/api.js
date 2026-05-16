import Backbone from 'backbone';

const TOKEN_KEY = 'bobs-corn:token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

export class RateLimitError extends ApiError {
  constructor(body, retryAfterSeconds) {
    super(429, body);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }

  if (!res.ok) {
    if (res.status === 429) {
      const retry =
        Number(res.headers.get('Retry-After')) ||
        payload?.retry_after_seconds ||
        0;
      throw new RateLimitError(payload, retry);
    }
    throw new ApiError(res.status, payload);
  }
  return payload;
}

Backbone.ajax = function (options) {
  const method = (options.type || 'GET').toUpperCase();
  let body;
  if (options.data) {
    body = typeof options.data === 'string' ? JSON.parse(options.data) : options.data;
  }
  const promise = api(method, options.url, body);
  promise.then(
    (payload) => options.success?.(payload),
    (err) => options.error?.(err),
  );
  return promise;
};
