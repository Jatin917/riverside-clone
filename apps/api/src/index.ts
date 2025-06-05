import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Example middleware
app.use(express.json());

// A simple “ping” route
app.get('/health', (_req: any, res: { json: (arg0: { status: string; timestamp: string; }) => void; }) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// A sample API route
app.get('/hello', (_req: any, res: { json: (arg0: { message: string; }) => void; }) => {
  res.json({ message: 'Hello from Express + TypeScript!' });
});

app.listen(PORT, () => {
  console.log(`🚀  [API] listening on http://localhost:${PORT}`);
});
