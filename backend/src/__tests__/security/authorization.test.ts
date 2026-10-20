import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createPracticesRouter } from '../../routes/practices';
import { createAttendanceRouter } from '../../routes/attendance';
import type { SheetsService } from '../../services/sheets';

const createPractice = vi.fn();
const updatePractice = vi.fn();
const updatePracticeStatus = vi.fn();
const getPractices = vi.fn();
const updateActual = vi.fn();
const sheets = {
  createPractice, updatePractice, updatePracticeStatus, getPractices, updateActual,
} as unknown as SheetsService;
const app = express();
app.use(express.json());
app.use('/api/practices', createPracticesRouter(sheets));
app.use('/api/attendance', createAttendanceRouter(sheets));

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_LINE_USER_IDS = 'UadminTest';
});

describe('SEC-T03..07: existing administrator API authorization', () => {
  const payload = { title: '練習', date: '2026-10-25', time: '10:00', location: '公園' };
  const checks: Array<[string, 'post' | 'put' | 'patch', string, unknown]> = [
    ['create', 'post', '/api/practices', payload],
    ['edit', 'put', '/api/practices/p1', payload],
    ['status', 'patch', '/api/practices/p1/status', { status: '中止' }],
    ['announce', 'post', '/api/practices/p1/announce', {}],
    ['actual', 'patch', '/api/attendance/a1/actual', { actual: true }],
  ];
  for (const [label, method, path, body] of checks) {
    it(`rejects nonadmin: ${label} with no writes`, async () => {
      const res = await request(app)[method](path).set('x-line-user-id', 'UordinaryTest').send(body);
      expect(res.status).toBe(403);
      expect(createPractice).not.toHaveBeenCalled();
      expect(updatePractice).not.toHaveBeenCalled();
      expect(updatePracticeStatus).not.toHaveBeenCalled();
      expect(updateActual).not.toHaveBeenCalled();
      expect(getPractices).not.toHaveBeenCalled();
    });
  }
  it('rejects missing header for all administrator routes', async () => {
    for (const [, method, path, body] of checks) {
      const response = await request(app)[method](path).send(body);
      expect(response.status).toBe(403);
    }
  });
});

// Important: These tests capture existing access rules only. UserID spoofing remains
// possible until server-side LINE ID token verification is implemented (SEC-01/02).
