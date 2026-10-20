import { Request, Response, NextFunction } from 'express';

export function isAdmin(userId: string): boolean {
  return (process.env.ADMIN_LINE_USER_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean).includes(userId);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'LINEログインが必要です' });
    return;
  }
  const clientId = process.env.LINE_CHANNEL_ID;
  if (!clientId) {
    res.status(503).json({ error: '認証設定がありません' });
    return;
  }
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: token, client_id: clientId }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      res.status(401).json({ error: 'LINE認証に失敗しました' });
      return;
    }
    const claims = await response.json() as { sub?: string; aud?: string; iss?: string; exp?: number };
    if (claims.iss !== 'https://access.line.me' || claims.aud !== clientId ||
        !claims.sub || typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000)) {
      res.status(401).json({ error: 'LINE認証に失敗しました' });
      return;
    }
    res.locals.lineUserId = claims.sub;
    next();
  } catch {
    res.status(503).json({ error: 'LINE認証サービスを利用できません' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const userId: string | undefined = res.locals.lineUserId;
  if (!userId || !isAdmin(userId)) {
    res.status(403).json({ error: '管理者権限が必要です' });
    return;
  }
  next();
}
