import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SheetsService } from './services/sheets';
import { isAdmin } from './middleware/adminAuth';
import practicesRouter from './routes/practices';
import attendanceRouter from './routes/attendance';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/practices', practicesRouter);
app.use('/api/attendance', attendanceRouter);

/** GET /api/me - LINEユーザー情報と管理者フラグを返す */
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
  // Google Sheetsのシート初期化（ヘッダーがなければ追加）
  const sheets = new SheetsService();
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
