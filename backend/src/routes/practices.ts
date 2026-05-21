import { Router } from 'express';
import { SheetsService } from '../services/sheets';
import { buildAnnounceMessage } from '../services/line';
import { requireAdmin } from '../middleware/adminAuth';
import { PracticeStatus } from '../types';

const VALID_PRACTICE_STATUSES: PracticeStatus[] = ['開催', '雨天中止', '中止'];

export function createPracticesRouter(sheets: SheetsService) {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const practices = await sheets.getPractices();
      res.json(practices);
    } catch {
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });

  router.post('/', requireAdmin, async (req, res) => {
    const { title, date, time, location, description } = req.body;
    if (!title || !date || !time || !location) {
      res.status(400).json({ error: 'title, date, time, location は必須です' });
      return;
    }
    try {
      const practice = await sheets.createPractice({ title, date, time, location, description: description ?? '' });
      res.status(201).json(practice);
    } catch {
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });

  router.patch('/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!VALID_PRACTICE_STATUSES.includes(status)) {
      res.status(400).json({ error: 'status は 開催/雨天中止/中止 のいずれかです' });
      return;
    }
    try {
      const practice = await sheets.updatePracticeStatus(req.params.id, status);
      res.json(practice);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      res.status(msg === '練習が見つかりません' ? 404 : 500).json({ error: msg || 'サーバーエラーが発生しました' });
    }
  });

  // Flex Message を返す。フロントエンドが liff.shareTargetPicker() で送信する。
  router.post('/:id/announce', requireAdmin, async (req, res) => {
    const liffId = process.env.VITE_LIFF_ID ?? '';
    try {
      const practices = await sheets.getPractices();
      const practice = practices.find(p => p.id === req.params.id);
      if (!practice) {
        res.status(404).json({ error: '練習が見つかりません' });
        return;
      }
      res.json({ message: buildAnnounceMessage(practice, liffId) });
    } catch {
      res.status(500).json({ error: 'サーバーエラーが発生しました' });
    }
  });

  return router;
}
