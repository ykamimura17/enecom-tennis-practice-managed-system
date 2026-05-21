import { Request, Response, NextFunction } from 'express';

function getAdminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_LINE_USER_IDS ?? '').split(',').filter(Boolean)
  );
}

export function isAdmin(userId: string): boolean {
  return getAdminIds().has(userId);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-line-user-id'] as string | undefined;
  if (!userId || !getAdminIds().has(userId)) {
    res.status(403).json({ error: '管理者権限が必要です' });
    return;
  }
  next();
}
