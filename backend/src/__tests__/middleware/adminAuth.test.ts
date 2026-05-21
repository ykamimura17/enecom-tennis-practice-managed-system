import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { isAdmin, requireAdmin } from '../../middleware/adminAuth';

const ADMIN_ID_1 = 'Uadmin0001';
const ADMIN_ID_2 = 'Uadmin0002';
const OTHER_ID   = 'Uother9999';

beforeEach(() => {
  process.env.ADMIN_LINE_USER_IDS = `${ADMIN_ID_1},${ADMIN_ID_2}`;
});

// requireAdmin の動作確認用アプリ（モジュールロード後に env が変わっても
// getAdminIds() がリクエスト時に再評価されることを確認する）
const app = express();
app.get('/test', requireAdmin, (_req, res) => res.json({ ok: true }));

describe('isAdmin', () => {
  it('1番目の管理者IDに true を返す', () => {
    expect(isAdmin(ADMIN_ID_1)).toBe(true);
  });

  it('2番目の管理者IDにも true を返す', () => {
    expect(isAdmin(ADMIN_ID_2)).toBe(true);
  });

  it('未登録IDに false を返す', () => {
    expect(isAdmin(OTHER_ID)).toBe(false);
  });

  it('空文字に false を返す', () => {
    expect(isAdmin('')).toBe(false);
  });
});

describe('requireAdmin middleware', () => {
  it('管理者はリクエストを通過する', async () => {
    const res = await request(app).get('/test').set('x-line-user-id', ADMIN_ID_1);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('非管理者は 403 を返す', async () => {
    const res = await request(app).get('/test').set('x-line-user-id', OTHER_ID);
    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it('x-line-user-id ヘッダーがない場合は 403 を返す', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(403);
  });

  it('環境変数変更後もリクエスト時に再評価される', async () => {
    // 別のIDを管理者として追加
    process.env.ADMIN_LINE_USER_IDS = 'Unewadmin';
    const res = await request(app).get('/test').set('x-line-user-id', 'Unewadmin');
    expect(res.status).toBe(200);
  });
});
