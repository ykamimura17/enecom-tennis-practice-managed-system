import { createHmac, timingSafeEqual } from 'crypto';
import { Router } from 'express';
import type { SheetsService } from '../services/sheets';

const actions = {
  attend: { status: '参加' as const, carpool: '不要' as const, label: '参加' },
  carpool: { status: '参加' as const, carpool: '必要' as const, label: '参加（配車あり）' },
  absent: { status: '不参加' as const, carpool: undefined, label: '不参加' },
};

export function createLineWebhookRouter(sheets: Pick<SheetsService, 'getPractices' | 'getMembers' | 'upsertAttendance'>) {
  const router = Router();
  router.post('/', async (req, res) => {
    const secret = process.env.LINE_CHANNEL_SECRET;
    if (!secret || !Buffer.isBuffer(req.body)) { res.sendStatus(503); return; }
    const signature = req.header('x-line-signature') ?? '';
    const digest = createHmac('sha256', secret).update(req.body).digest('base64');
    const a = Buffer.from(signature), b = Buffer.from(digest);
    if (a.length !== b.length || !timingSafeEqual(a, b)) { res.sendStatus(401); return; }
    let payload: { events?: unknown[] };
    try { payload = JSON.parse(req.body.toString('utf8')); }
    catch { res.sendStatus(400); return; }
    if (!Array.isArray(payload.events)) { res.sendStatus(400); return; }
    try {
      for (const raw of payload.events) {
        const event = raw as { type?: string; postback?: { data?: string }; source?: { type?: string; userId?: string }; replyToken?: string };
        if (event.type !== 'postback' || event.source?.type !== 'user' || !event.source.userId) continue;
        const match = /^attendance:([a-zA-Z0-9_-]{1,100}):(attend|carpool|absent)$/.exec(event.postback?.data ?? '');
        if (!match) continue;
        const [, practiceId, key] = match;
        const action = actions[key as keyof typeof actions];
        const practice = (await sheets.getPractices()).find(p => p.id === practiceId);
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        let message: string;
        if (!practice || practice.status !== '開催' || practice.date < today) {
          message = 'この練習は登録できません。Webアプリで開催状況をご確認ください。';
        } else {
          const member = (await sheets.getMembers()).find(m => m.lineUserId === event.source!.userId);
          if (!member) {
            message = 'メンバー登録が必要です。Webアプリで名前を登録してから操作してください。';
          } else {
            await sheets.upsertAttendance({ practiceId, lineUserId: event.source.userId, displayName: member.displayName, status: action.status, carpool: action.carpool });
            message = `${practice.title}：${action.label}で登録しました。`;
          }
        }
        if (event.replyToken && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
          const response = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ replyToken: event.replyToken, messages: [{ type: 'text', text: message }] }),
          });
          if (!response.ok) throw new Error('LINE reply failed');
        }
      }
      res.sendStatus(200);
    } catch { res.sendStatus(500); }
  });
  return router;
}
