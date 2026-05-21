import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { SheetsService } from './services/sheets';
import { isAdmin } from './middleware/adminAuth';
import { createPracticesRouter } from './routes/practices';
import { createAttendanceRouter } from './routes/attendance';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const sheets = new SheetsService();

app.use('/api/practices', createPracticesRouter(sheets));
app.use('/api/attendance', createAttendanceRouter(sheets));

app.get('/api/me', (req, res) => {
  const userId = req.headers['x-line-user-id'] as string | undefined;
  if (!userId) {
    res.status(400).json({ error: 'x-line-user-id ヘッダーが必要です' });
    return;
  }
  res.json({ userId, isAdmin: isAdmin(userId) });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function main() {
  await sheets.init();
  console.log('✅ Google Sheets initialized');

  app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('起動エラー:', err);
  process.exit(1);
});
