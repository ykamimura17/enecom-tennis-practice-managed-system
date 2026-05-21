import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createPracticesRouter } from '../../routes/practices';
import type { SheetsService } from '../../services/sheets';
import type { Practice } from '../../types';

const ADMIN_ID = 'Uadmin0001';

// モック関数を個別に保持することで型付きアクセスを可能にする
const getPractices       = vi.fn();
const createPractice     = vi.fn();
const updatePracticeStatus = vi.fn();
const init               = vi.fn();

const mockSheets = { getPractices, createPractice, updatePracticeStatus, init } as unknown as SheetsService;

const app = express();
app.use(express.json());
app.use('/api/practices', createPracticesRouter(mockSheets));

const samplePractice: Practice = {
  id: 'p-001',
  title: 'テスト練習',
  date: '2024-06-15',
  time: '10:00',
  location: '公園',
  description: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  status: '開催',
};

const newPracticeBody = {
  title: '新規練習',
  date: '2024-07-01',
  time: '14:00',
  location: '体育館',
  description: '',
};

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_LINE_USER_IDS = ADMIN_ID;
  process.env.VITE_LIFF_ID = 'liff-test-id';
});

// ─────────────────────────────────────────────────────────────
// GET /api/practices
// ─────────────────────────────────────────────────────────────
describe('GET /api/practices', () => {
  it('練習一覧を返す（200）', async () => {
    getPractices.mockResolvedValue([samplePractice]);
    const res = await request(app).get('/api/practices');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([samplePractice]);
    expect(getPractices).toHaveBeenCalledOnce();
  });

  it('Sheets エラー時に 500 を返す', async () => {
    getPractices.mockRejectedValue(new Error('Sheets error'));
    const res = await request(app).get('/api/practices');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/practices
// ─────────────────────────────────────────────────────────────
describe('POST /api/practices', () => {
  it('管理者は練習を作成できる（201）', async () => {
    createPractice.mockResolvedValue(samplePractice);
    const res = await request(app)
      .post('/api/practices')
      .set('x-line-user-id', ADMIN_ID)
      .send(newPracticeBody);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(samplePractice.id);
  });

  it('非管理者は 403 を返す', async () => {
    const res = await request(app)
      .post('/api/practices')
      .set('x-line-user-id', 'Uother')
      .send(newPracticeBody);
    expect(res.status).toBe(403);
    expect(createPractice).not.toHaveBeenCalled();
  });

  it('title が欠けている場合は 400 を返す', async () => {
    const res = await request(app)
      .post('/api/practices')
      .set('x-line-user-id', ADMIN_ID)
      .send({ date: '2024-07-01', time: '14:00', location: '体育館' });
    expect(res.status).toBe(400);
  });

  it('date が欠けている場合は 400 を返す', async () => {
    const res = await request(app)
      .post('/api/practices')
      .set('x-line-user-id', ADMIN_ID)
      .send({ title: '練習', time: '14:00', location: '体育館' });
    expect(res.status).toBe(400);
  });

  it('Sheets エラー時に 500 を返す', async () => {
    createPractice.mockRejectedValue(new Error('Sheets error'));
    const res = await request(app)
      .post('/api/practices')
      .set('x-line-user-id', ADMIN_ID)
      .send(newPracticeBody);
    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/practices/:id/status
// ─────────────────────────────────────────────────────────────
describe('PATCH /api/practices/:id/status', () => {
  it('管理者は開催に変更できる（200）', async () => {
    updatePracticeStatus.mockResolvedValue({ ...samplePractice, status: '開催' });
    const res = await request(app)
      .patch('/api/practices/p-001/status')
      .set('x-line-user-id', ADMIN_ID)
      .send({ status: '開催' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('開催');
  });

  it('管理者は雨天中止に変更できる（200）', async () => {
    updatePracticeStatus.mockResolvedValue({ ...samplePractice, status: '雨天中止' });
    const res = await request(app)
      .patch('/api/practices/p-001/status')
      .set('x-line-user-id', ADMIN_ID)
      .send({ status: '雨天中止' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('雨天中止');
  });

  it('管理者は中止に変更できる（200）', async () => {
    updatePracticeStatus.mockResolvedValue({ ...samplePractice, status: '中止' });
    const res = await request(app)
      .patch('/api/practices/p-001/status')
      .set('x-line-user-id', ADMIN_ID)
      .send({ status: '中止' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('中止');
  });

  it('非管理者は 403 を返す', async () => {
    const res = await request(app)
      .patch('/api/practices/p-001/status')
      .set('x-line-user-id', 'Uother')
      .send({ status: '中止' });
    expect(res.status).toBe(403);
    expect(updatePracticeStatus).not.toHaveBeenCalled();
  });

  it('不正なステータスは 400 を返す', async () => {
    const res = await request(app)
      .patch('/api/practices/p-001/status')
      .set('x-line-user-id', ADMIN_ID)
      .send({ status: '不明なステータス' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('開催');
  });

  it('存在しない練習は 404 を返す', async () => {
    updatePracticeStatus.mockRejectedValue(new Error('練習が見つかりません'));
    const res = await request(app)
      .patch('/api/practices/nonexistent/status')
      .set('x-line-user-id', ADMIN_ID)
      .send({ status: '中止' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/practices/:id/announce
// ─────────────────────────────────────────────────────────────
describe('POST /api/practices/:id/announce', () => {
  it('管理者は Flex Message を取得できる（200）', async () => {
    getPractices.mockResolvedValue([samplePractice]);
    const res = await request(app)
      .post('/api/practices/p-001/announce')
      .set('x-line-user-id', ADMIN_ID);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
    expect(res.body.message.type).toBe('flex');
  });

  it('返された message に LIFF URL が含まれる', async () => {
    getPractices.mockResolvedValue([samplePractice]);
    const res = await request(app)
      .post('/api/practices/p-001/announce')
      .set('x-line-user-id', ADMIN_ID);
    expect(res.status).toBe(200);
    const uri = JSON.stringify(res.body.message);
    expect(uri).toContain('liff-test-id');
    expect(uri).toContain('p-001');
  });

  it('非管理者は 403 を返す', async () => {
    const res = await request(app)
      .post('/api/practices/p-001/announce')
      .set('x-line-user-id', 'Uother');
    expect(res.status).toBe(403);
    expect(getPractices).not.toHaveBeenCalled();
  });

  it('存在しない練習 ID は 404 を返す', async () => {
    getPractices.mockResolvedValue([samplePractice]);
    const res = await request(app)
      .post('/api/practices/nonexistent/announce')
      .set('x-line-user-id', ADMIN_ID);
    expect(res.status).toBe(404);
  });

  it('Sheets エラー時に 500 を返す', async () => {
    getPractices.mockRejectedValue(new Error('Sheets error'));
    const res = await request(app)
      .post('/api/practices/p-001/announce')
      .set('x-line-user-id', ADMIN_ID);
    expect(res.status).toBe(500);
  });
});
