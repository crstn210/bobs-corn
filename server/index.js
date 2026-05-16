import express from 'express';
import db from './db.js';
import { login, logout, authMiddleware } from './auth.js';
import { buyCorn, RateLimitedError } from './corn.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM clients').get();
  res.json({ ok: true, clients: count });
});

app.post('/api/login', async (req, res) => {
  const { name, secret } = req.body ?? {};
  if (typeof name !== 'string' || typeof secret !== 'string') {
    return res.status(400).json({ error: 'name and secret are required' });
  }
  const result = await login(name, secret);
  if (!result) return res.status(401).json({ error: 'Invalid credentials' });
  res.json(result);
});

app.post('/api/logout', authMiddleware, (req, res) => {
  logout(req.token);
  res.json({ ok: true });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ name: req.client.name });
});

app.post('/api/buy', authMiddleware, (req, res) => {
  try {
    const purchase = buyCorn(req.client.id);
    res.status(201).json({ purchase });
  } catch (err) {
    if (err instanceof RateLimitedError) {
      res.set('Retry-After', String(err.retryAfterSeconds));
      return res.status(429).json({
        error: 'Bob sells at most 1 corn per minute per client',
        retry_after_seconds: err.retryAfterSeconds,
      });
    }
    throw err;
  }
});

const PORT = process.env.PORT || 3101;
app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
