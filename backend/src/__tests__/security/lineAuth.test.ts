import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireAuth } from '../../middleware/adminAuth';
import { createAttendanceRouter } from '../../routes/attendance';
import type { SheetsService } from '../../services/sheets';

const upsertAttendance = vi.fn();
const getAttendance = vi.fn();
const updateActual = vi.fn();
const getPractices = vi.fn();
const app = express();
app.use(express.json());
app.use('/api/attendance', requireAuth, createAttendanceRouter({ upsertAttendance, getAttendance, updateActual, getPractices } as unknown as SheetsService));
app.get('/api/identity', requireAuth, (_req, res) => res.json({ userId: res.locals.lineUserId }));

const validClaims = () => ({
  iss: 'https://access.line.me',
  aud: 'test-channel',
  sub: 'Uvalid',
  exp: Math.floor(Date.now() / 1000) + 3600,
});

beforeEach(() => {
  vi.resetAllMocks();
  getPractices.mockResolvedValue([{ id: 'p1', date: '2099-01-01', status: '開催' }]);
  process.env.LINE_CHANNEL_ID = 'test-channel';
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => validClaims() }));
});
afterEach(() => vi.unstubAllGlobals());

describe('LINE ID token authentication', () => {
  it('rejects missing token', async () => {
    const res = await request(app).get('/api/identity');
    expect(res.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects invalid token response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    expect((await request(app).get('/api/identity').set('Authorization', 'Bearer invalid')).status).toBe(401);
  });
  it('rejects mismatched audience', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ ...validClaims(), aud: 'other' }) } as Response);
    expect((await request(app).get('/api/identity').set('Authorization', 'Bearer x')).status).toBe(401);
  });
  it('rejects expired tokens', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ ...validClaims(), exp: 1 }) } as Response);
    expect((await request(app).get('/api/identity').set('Authorization', 'Bearer x')).status).toBe(401);
  });
  it('accepts LINE-verified user identity', async () => {
    const res = await request(app).get('/api/identity').set('Authorization', 'Bearer valid-token').set('x-line-user-id', 'Uspoofed');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('Uvalid');
  });
  it('rejects someone else attendance update without Sheets write', async () => {
    const res = await request(app).post('/api/attendance').set('Authorization', 'Bearer valid-token')
      .send({ practiceId: 'p1', lineUserId: 'Uvictim', displayName: 'Someone', status: '参加' });
    expect(res.status).toBe(403);
    expect(upsertAttendance).not.toHaveBeenCalled();
  });
  it('uses verified identity when writing own attendance', async () => {
    upsertAttendance.mockImplementation(async data => ({ id: 'a1', ...data }));
    const res = await request(app).post('/api/attendance').set('Authorization', 'Bearer valid-token')
      .send({ practiceId: 'p1', displayName: 'Me', status: '参加', carpool: '不要' });
    expect(res.status).toBe(200);
    expect(upsertAttendance).toHaveBeenCalledWith(expect.objectContaining({ lineUserId: 'Uvalid' }));
  });
});
