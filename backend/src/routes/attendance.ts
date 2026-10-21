import { Router } from 'express';
import { SheetsService } from '../services/sheets';
import { AttendanceStatus, CarpoolStatus } from '../types';
import { requireAdmin } from '../middleware/adminAuth';

const VALID_STATUSES: AttendanceStatus[] = ['参加', '不参加', '未回答'];
const VALID_CARPOOLS: CarpoolStatus[] = ['必要', '不要'];

export function createAttendanceRouter(sheets: SheetsService) {
  const router = Router();

  router.get('/:practiceId/roster', async (req, res) => {
    try {
      const practices=await sheets.getPractices();
      if (!practices.some(p=>p.id===req.params.practiceId)) {res.status(404).json({error:'練習が見つかりません'});return;}
      res.json(await sheets.getPracticeRoster(req.params.practiceId));
    } catch {res.status(500).json({error:'サーバーエラーが発生しました'});}
  });

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
    if (!practiceId || !displayName || !status) {
      res.status(400).json({ error: '全フィールドが必須です' });
      return;
    }
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'status は 参加/不参加/未回答 のいずれかです' });
      return;
    }
    if (carpool != null && carpool !== '' && !VALID_CARPOOLS.includes(carpool)) {
      res.status(400).json({ error: 'carpool は 必要/不要 のいずれかです' });
      return;
    }
    try {
      const record = await sheets.upsertAttendance({
        practiceId, lineUserId, displayName, status,
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
