import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import { createLineWebhookRouter } from './routes/lineWebhook';
import cors from 'cors';
import { SheetsService } from './services/sheets';
import { isAdmin, requireAuth } from './middleware/adminAuth';
import { createPracticesRouter } from './routes/practices';
import { createAttendanceRouter } from './routes/attendance';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use('/api/line/webhook', express.raw({ type: 'application/json' }), createLineWebhookRouter(new SheetsService()));
app.use(express.json());

const sheets = new SheetsService();

// コールドスタートごとに1回だけ実行し、結果をキャッシュ
const initPromise = sheets.init();

app.use(async (_req, _res, next) => {
  await initPromise;
  next();
});

app.use('/api/practices', requireAuth, createPracticesRouter(sheets));
app.use('/api/attendance', requireAuth, createAttendanceRouter(sheets));

app.put('/api/members/me', requireAuth, async (req, res) => {
  const displayName=req.body?.displayName;
  if (typeof displayName!=='string'||!displayName.trim()||displayName.length>100) {
    res.status(400).json({error:'有効な表示名を指定してください'});return;
  }
  try {res.json(await sheets.upsertMember(res.locals.lineUserId as string,displayName.trim()));}
  catch {res.status(500).json({error:'メンバー登録に失敗しました'});}
});

app.get('/api/me', requireAuth, (_req, res) => {
  const userId = res.locals.lineUserId as string;
  res.json({ userId, isAdmin: isAdmin(userId) });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
