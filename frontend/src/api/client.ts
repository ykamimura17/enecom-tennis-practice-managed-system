import { Practice, PracticeStatus, Attendance, AttendanceStatus, CarpoolStatus } from '../types';
import { MOCK_PRACTICES, MOCK_ATTENDANCES, MOCK_USER } from '../mocks/data';

const IS_MOCK = import.meta.env.VITE_MOCK_MODE === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { headers: extraHeaders, ...rest } = init;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchMe(userId: string): Promise<{ userId: string; isAdmin: boolean }> {
  if (IS_MOCK) return { userId: MOCK_USER.userId, isAdmin: MOCK_USER.isAdmin };
  return request('/api/me', { headers: { 'x-line-user-id': userId } });
}

// モック用のインメモリストア
let mockPractices = [...MOCK_PRACTICES];
let mockAttendances = [...MOCK_ATTENDANCES];

export const api = {
  getPractices(): Promise<Practice[]> {
    if (IS_MOCK) return Promise.resolve([...mockPractices].sort((a, b) => a.date.localeCompare(b.date)));
    return request('/api/practices');
  },

  getAttendance(practiceId: string): Promise<Attendance[]> {
    if (IS_MOCK) return Promise.resolve(mockAttendances.filter(a => a.practiceId === practiceId));
    return request(`/api/attendance/${practiceId}`);
  },

  upsertAttendance(
    lineUserId: string,
    displayName: string,
    practiceId: string,
    status: AttendanceStatus,
    carpool?: CarpoolStatus,
  ): Promise<Attendance> {
    // 配車（送迎）の要否は参加者のみ意味を持つ
    const effectiveCarpool = status === '参加' ? carpool : undefined;
    if (IS_MOCK) {
      const idx = mockAttendances.findIndex(a => a.practiceId === practiceId && a.lineUserId === lineUserId);
      const record: Attendance = {
        id: idx >= 0 ? mockAttendances[idx].id : `att-${Date.now()}`,
        practiceId, lineUserId, displayName, status,
        carpool: effectiveCarpool,
        updatedAt: new Date().toISOString(),
      };
      if (idx >= 0) mockAttendances[idx] = record;
      else mockAttendances = [...mockAttendances, record];
      return Promise.resolve(record);
    }
    return request('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ practiceId, lineUserId, displayName, status, carpool: effectiveCarpool }),
    });
  },

  createPractice(userId: string, data: Omit<Practice, 'id' | 'createdAt' | 'status'>): Promise<Practice> {
    if (IS_MOCK) {
      const practice: Practice = { id: `practice-${Date.now()}`, ...data, status: '開催', createdAt: new Date().toISOString() };
      mockPractices = [...mockPractices, practice];
      return Promise.resolve(practice);
    }
    return request('/api/practices', {
      method: 'POST',
      headers: { 'x-line-user-id': userId },
      body: JSON.stringify(data),
    });
  },

  updatePractice(userId: string, practiceId: string, data: Omit<Practice, 'id' | 'createdAt' | 'status'>): Promise<Practice> {
    if (IS_MOCK) {
      const idx = mockPractices.findIndex(p => p.id === practiceId);
      if (idx < 0) return Promise.reject(new Error('練習が見つかりません'));
      mockPractices[idx] = { ...mockPractices[idx], ...data };
      return Promise.resolve(mockPractices[idx]);
    }
    return request(`/api/practices/${practiceId}`, {
      method: 'PUT',
      headers: { 'x-line-user-id': userId },
      body: JSON.stringify(data),
    });
  },

  updatePracticeStatus(userId: string, practiceId: string, status: PracticeStatus): Promise<Practice> {
    if (IS_MOCK) {
      const idx = mockPractices.findIndex(p => p.id === practiceId);
      if (idx < 0) return Promise.reject(new Error('練習が見つかりません'));
      mockPractices[idx] = { ...mockPractices[idx], status };
      return Promise.resolve(mockPractices[idx]);
    }
    return request(`/api/practices/${practiceId}/status`, {
      method: 'PATCH',
      headers: { 'x-line-user-id': userId },
      body: JSON.stringify({ status }),
    });
  },

  updateActual(userId: string, attendanceId: string, actual: boolean): Promise<Attendance> {
    if (IS_MOCK) {
      const idx = mockAttendances.findIndex(a => a.id === attendanceId);
      if (idx < 0) return Promise.reject(new Error('出欠レコードが見つかりません'));
      mockAttendances[idx] = { ...mockAttendances[idx], actual: actual || undefined };
      return Promise.resolve(mockAttendances[idx]);
    }
    return request(`/api/attendance/${attendanceId}/actual`, {
      method: 'PATCH',
      headers: { 'x-line-user-id': userId },
      body: JSON.stringify({ actual }),
    });
  },

  announcePractice(userId: string, practiceId: string): Promise<{ message: Record<string, unknown> }> {
    if (IS_MOCK) {
      return Promise.resolve({ message: { type: 'flex', altText: '[モック]', contents: {} } });
    }
    return request(`/api/practices/${practiceId}/announce`, {
      method: 'POST',
      headers: { 'x-line-user-id': userId },
    });
  },
};
