import db from './db.js';

export const RATE_LIMIT_MS = 60_000;

const lastPurchaseStmt = db.prepare(
  'SELECT bought_at FROM purchases WHERE client_id = ? ORDER BY bought_at DESC LIMIT 1'
);
const insertPurchaseStmt = db.prepare(
  'INSERT INTO purchases (client_id, bought_at) VALUES (?, ?) RETURNING id, bought_at'
);

export class RateLimitedError extends Error {
  constructor(retryAfterMs) {
    super('Rate limit exceeded');
    this.code = 'RATE_LIMITED';
    this.retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  }
}

export const buyCorn = db.transaction((clientId) => {
  const last = lastPurchaseStmt.get(clientId);
  const now = Date.now();
  if (last) {
    const elapsed = now - last.bought_at;
    if (elapsed < RATE_LIMIT_MS) {
      throw new RateLimitedError(RATE_LIMIT_MS - elapsed);
    }
  }
  return insertPurchaseStmt.get(clientId, now);
});
