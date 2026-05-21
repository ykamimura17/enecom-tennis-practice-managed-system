import { Router } from 'express';
import { SheetsService } from '../services/sheets';
import { AttendanceStatus } from '../types';

const VALID_STATUSES: AttendanceStatus[] = ['参加', '不参加', '未回答'];

export function createAttendanceRouter(sheets: SheetsService) {
  const router = Router();

  router.get('/:practiceId', async (req, res) => {
    try {
      const attendances = await sheets.getAttendance(req.params.practiceId);
      res.json(attendances);
    } catch {
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });

  router.post('/', async (req, res) => {
    const { practiceId, lineUserId, displayName, status } = req.body;
    if (!practiceId || !lineUserId || !displayName || !status) {
      res.status(400).json({ error: '全フィールドが必須です' });
      return;
    }
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'status は 参加/不参加/未回答 のいずれかです' });
      return;
    }
    try {
      const record = await sheets.upsertAttendance({ practiceId, lineUserId, displayName, status });
      res.json(record);
    } catch {
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });

  return router;
}
