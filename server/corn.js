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

export function getNextBuyAt(clientId) {
  const last = lastPurchaseStmt.get(clientId);
  if (!last) return null;
  const next = last.bought_at + RATE_LIMIT_MS;
  return next > Date.now() ? next : null;
}

const listPurchasesStmt = db.prepare(`
  SELECT id, bought_at, shipped_at
  FROM purchases
  WHERE client_id = ?
  ORDER BY bought_at DESC
`);

const inventoryStmt = db.prepare(`
  SELECT
    COUNT(*) AS purchased,
    COALESCE(SUM(CASE WHEN shipped_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS shipped
  FROM purchases
  WHERE client_id = ?
`);

const findClientByNameStmt = db.prepare(
  'SELECT id FROM clients WHERE name = ?'
);
const findUnshippedStmt = db.prepare(`
  SELECT id FROM purchases
  WHERE client_id = ? AND shipped_at IS NULL
  ORDER BY bought_at ASC
  LIMIT ?
`);
const markShippedStmt = db.prepare(
  'UPDATE purchases SET shipped_at = ? WHERE id = ?'
);

export function listPurchases(clientId) {
  return listPurchasesStmt.all(clientId);
}

export function inventoryFor(clientId) {
  const { purchased, shipped } = inventoryStmt.get(clientId);
  return { purchased, shipped, pending: purchased - shipped };
}

export class UnknownClientError extends Error {
  constructor(name) {
    super(`Unknown client: ${name}`);
    this.code = 'UNKNOWN_CLIENT';
  }
}

export const markShipped = db.transaction((clientName, quantity) => {
  const client = findClientByNameStmt.get(clientName);
  if (!client) throw new UnknownClientError(clientName);
  const rows = findUnshippedStmt.all(client.id, quantity);
  const now = Date.now();
  for (const row of rows) markShippedStmt.run(now, row.id);
  return { client: clientName, requested: quantity, shipped: rows.length };
});
