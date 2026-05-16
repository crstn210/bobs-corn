import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id          INTEGER PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    secret_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    client_id  INTEGER NOT NULL REFERENCES clients(id),
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id         INTEGER PRIMARY KEY,
    client_id  INTEGER NOT NULL REFERENCES clients(id),
    bought_at  INTEGER NOT NULL,
    shipped_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_purchases_client_bought
    ON purchases(client_id, bought_at);
`);

const BCRYPT_ROUNDS = 10;

const SEED_CLIENTS = [
  { name: 'alice', secret: 'secret-alice' },
  { name: 'bob',   secret: 'secret-bob' },
  { name: 'carol', secret: 'secret-carol' },
];

const insertClient = db.prepare(
  'INSERT OR IGNORE INTO clients (name, secret_hash) VALUES (?, ?)'
);
const seedClients = db.transaction((clients) => {
  for (const c of clients) {
    insertClient.run(c.name, bcrypt.hashSync(c.secret, BCRYPT_ROUNDS));
  }
});
seedClients(SEED_CLIENTS);

export default db;
