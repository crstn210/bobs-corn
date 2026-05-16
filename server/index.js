import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3101;
app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
