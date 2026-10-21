import { Router } from 'express';
import { SheetsService } from '../services/sheets';
import { AttendanceStatus, CarpoolStatus } from '../types';
import { requireAdmin } from '../middleware/adminAuth';

const VALID_STATUSES: AttendanceStatus[] = ['参加', '不参加', '未回答'];
const VALID_CARPOOLS: CarpoolStatus[] = ['必要', '不要'];

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
    const { practiceId, displayName, status, carpool } = req.body;
    const lineUserId = res.locals.lineUserId as string;
    if (req.body.lineUserId && req.body.lineUserId !== lineUserId) {
      res.status(403).json({ error: '他人の出欠は変更できません' });
      return;
    }
    if (typeof practiceId !== 'string' || !practiceId.trim() || typeof displayName !== 'string' || !displayName.trim() || typeof status !== 'string' || !status) {
      res.status(400).json({ error: '全フィールドが必須です' });
      return;
    }
    if (!VALID_STATUSES.includes(status as AttendanceStatus)) {
      res.status(400).json({ error: 'status は 参加/不参加/未回答 のいずれかです' });
      return;
    }
    if (carpool != null && carpool !== '' && !VALID_CARPOOLS.includes(carpool)) {
      res.status(400).json({ error: 'carpool は 必要/不要 のいずれかです' });
      return;
    }
    if (status === '参加' && !VALID_CARPOOLS.includes(carpool)) {
      res.status(400).json({ error: '参加の場合は配車の要否を指定してください' });
      return;
    }
    try {
      const practices = await sheets.getPractices();
      const practice = practices.find(p => p.id === practiceId);
      if (!practice) {
        res.status(404).json({ error: '練習が見つかりません' });
        return;
      }
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (practice.status !== '開催' || practice.date < today) {
        res.status(409).json({ error: '過去または中止された練習には回答できません' });
        return;
      }
      const record = await sheets.upsertAttendance({
        practiceId, lineUserId, displayName, status: status as AttendanceStatus,
        carpool: carpool || undefined,
      });
      res.json(record);
    } catch {
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });

  router.patch('/:id/actual', requireAdmin, async (req, res) => {
    const { actual } = req.body;
    if (typeof actual !== 'boolean') {
      res.status(400).json({ error: 'actual は boolean で指定してください' });
      return;
    }
    try {
      const record = await sheets.updateActual(req.params.id, actual);
      res.json(record);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'サーバーエラーが発生しました';
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
