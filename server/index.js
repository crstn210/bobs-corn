import express from 'express';
import db from './db.js';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM clients').get();
  res.json({ ok: true, clients: count });
});

const PORT = process.env.PORT || 3101;
app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
