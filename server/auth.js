import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import db from './db.js';

const findClientByName = db.prepare(
  'SELECT id, name, secret_hash FROM clients WHERE name = ?'
);
const insertSession = db.prepare(
  'INSERT INTO sessions (token, client_id, created_at) VALUES (?, ?, ?)'
);
const findSession = db.prepare(`
  SELECT c.id, c.name
  FROM sessions s
  JOIN clients c ON c.id = s.client_id
  WHERE s.token = ?
`);
const deleteSession = db.prepare('DELETE FROM sessions WHERE token = ?');

export async function login(name, secret) {
  const client = findClientByName.get(name);
  if (!client) {
    await bcrypt.compare(secret, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    return null;
  }
  const ok = await bcrypt.compare(secret, client.secret_hash);
  if (!ok) return null;
  const token = crypto.randomBytes(32).toString('hex');
  insertSession.run(token, client.id, Date.now());
  return { token, name: client.name };
}

export function logout(token) {
  deleteSession.run(token);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  const client = findSession.get(token);
  if (!client) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.client = client;
  req.token = token;
  next();
}
