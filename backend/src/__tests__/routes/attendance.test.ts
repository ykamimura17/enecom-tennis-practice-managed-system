import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAttendanceRouter } from '../../routes/attendance';
import type { SheetsService } from '../../services/sheets';
import type { Attendance } from '../../types';

const getAttendance    = vi.fn();
const upsertAttendance = vi.fn();
const getPracticeRoster = vi.fn();
const getPractices = vi.fn();

const mockSheets = { getAttendance, upsertAttendance, getPractices, getPracticeRoster } as unknown as SheetsService;

const app = express();
app.use(express.json());
app.use((req, res, next) => { res.locals.lineUserId = req.headers['x-line-user-id'] || 'Uuser0001'; next(); });
app.use('/api/attendance', createAttendanceRouter(mockSheets));

const sampleAttendance: Attendance = {
  id: 'a-001',
  practiceId: 'p-001',
  lineUserId: 'Uuser0001',
  displayName: 'テストユーザー',
  status: '参加',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const validPostBody = {
  practiceId:  'p-001',
  lineUserId:  'Uuser0001',
  displayName: 'テストユーザー',
  status:      '参加',
  carpool:     '不要',
};

beforeEach(() => {
  vi.resetAllMocks();
  getPractices.mockResolvedValue([{ id: 'p-001', date: '2099-01-01', status: '開催' }]);
});

// ─────────────────────────────────────────────────────────────
// GET /api/attendance/:practiceId
// ─────────────────────────────────────────────────────────────
describe('GET /api/attendance/:practiceId', () => {
  it('出欠一覧を返す（200）', async () => {
    getAttendance.mockResolvedValue([sampleAttendance]);
    const res = await request(app).get('/api/attendance/p-001');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sampleAttendance]);
    expect(getAttendance).toHaveBeenCalledWith('p-001');
  });

  it('該当練習の出欠がない場合は空配列を返す', async () => {
    getAttendance.mockResolvedValue([]);
    const res = await request(app).get('/api/attendance/p-999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('Sheets エラー時に 500 を返す', async () => {
    getAttendance.mockRejectedValue(new Error('Sheets error'));
    const res = await request(app).get('/api/attendance/p-001');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/attendance/:practiceId/roster', () => {
  it('未回答の名簿メンバーも返す', async () => {
    getPracticeRoster.mockResolvedValue([{id:'unanswered:p-001:U2',practiceId:'p-001',lineUserId:'U2',displayName:'未回答者',status:'未回答',updatedAt:''}]);
    const res=await request(app).get('/api/attendance/p-001/roster');
    expect(res.status).toBe(200);
    expect(res.body[0].status).toBe('未回答');
  });
  it('存在しない練習は404', async () => {
    getPractices.mockResolvedValue([]);
    expect((await request(app).get('/api/attendance/unknown/roster')).status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/attendance
// ─────────────────────────────────────────────────────────────
describe('POST /api/attendance', () => {
  it('参加を登録できる（200）', async () => {
    upsertAttendance.mockResolvedValue(sampleAttendance);
    const res = await request(app).post('/api/attendance').send(validPostBody);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleAttendance);
    expect(upsertAttendance).toHaveBeenCalledOnce();
  });

  it('不参加を登録できる（200）', async () => {
    const absence = { ...sampleAttendance, status: '不参加' };
    upsertAttendance.mockResolvedValue(absence);
    const res = await request(app)
      .post('/api/attendance')
      .send({ ...validPostBody, status: '不参加' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('不参加');
  });

  it('未回答を登録できる（200）', async () => {
    const pending = { ...sampleAttendance, status: '未回答' };
    upsertAttendance.mockResolvedValue(pending);
    const res = await request(app)
      .post('/api/attendance')
      .send({ ...validPostBody, status: '未回答' });
    expect(res.status).toBe(200);
  });

  it('practiceId が欠けている場合は 400 を返す', async () => {
    const { practiceId: _, ...body } = validPostBody;
    const res = await request(app).post('/api/attendance').send(body);
    expect(res.status).toBe(400);
    expect(upsertAttendance).not.toHaveBeenCalled();
  });

  it('lineUserId が本文に無い場合も検証済み本人IDで登録する', async () => {
    const { lineUserId: _, ...body } = validPostBody;
    upsertAttendance.mockResolvedValue(sampleAttendance);
    const res = await request(app).post('/api/attendance').send(body);
    expect(res.status).toBe(200);
    expect(upsertAttendance).toHaveBeenCalledWith(expect.objectContaining({ lineUserId: 'Uuser0001' }));
  });

  it('displayName が欠けている場合は 400 を返す', async () => {
    const { displayName: _, ...body } = validPostBody;
    const res = await request(app).post('/api/attendance').send(body);
    expect(res.status).toBe(400);
  });

  it('不正なステータスは 400 を返す', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .send({ ...validPostBody, status: '未定' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('参加');
  });

  it('存在しない練習には登録できない（404）', async () => {
    getPractices.mockResolvedValue([]);
    const res = await request(app).post('/api/attendance').send(validPostBody);
    expect(res.status).toBe(404);
    expect(upsertAttendance).not.toHaveBeenCalled();
  });

  it('中止した練習には登録できない（409）', async () => {
    getPractices.mockResolvedValue([{ id: 'p-001', date: '2099-01-01', status: '中止' }]);
    const res = await request(app).post('/api/attendance').send(validPostBody);
    expect(res.status).toBe(409);
  });

  it('過去の練習には登録できない（409）', async () => {
    getPractices.mockResolvedValue([{ id: 'p-001', date: '2020-01-01', status: '開催' }]);
    const res = await request(app).post('/api/attendance').send(validPostBody);
    expect(res.status).toBe(409);
  });

  it('参加時に配車が未指定なら400', async () => {
    const { carpool: _, ...body } = validPostBody;
    const res = await request(app).post('/api/attendance').send(body);
    expect(res.status).toBe(400);
  });

  it('Sheets エラー時に 500 を返す', async () => {
    upsertAttendance.mockRejectedValue(new Error('Sheets error'));
    const res = await request(app).post('/api/attendance').send(validPostBody);
    expect(res.status).toBe(500);
  });
});
