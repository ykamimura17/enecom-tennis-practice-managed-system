import { Practice, Attendance } from '../types';

export const MOCK_USER = {
  userId: 'U_mock_admin',
  displayName: 'テストユーザー（管理者）',
  pictureUrl: undefined,
  isAdmin: true,
};

export const MOCK_PRACTICES: Practice[] = [
  // 今後の練習
  {
    id: 'practice-f1',
    title: '6月定例練習',
    date: '2026-06-15',
    time: '14:00',
    location: '体育館A',
    description: 'シューズ持参',
    createdAt: '2026-05-01T10:00:00.000Z',
    status: '開催',
  },
  {
    id: 'practice-f2',
    title: '7月強化練習',
    date: '2026-07-20',
    time: '10:00',
    location: '第2グラウンド',
    description: '',
    createdAt: '2026-05-10T09:00:00.000Z',
    status: '開催',
  },
  // 過去の練習 20件
  { id: 'practice-p01', title: '5月定例練習',  date: '2026-05-11', time: '14:00', location: '体育館A',     description: '',               createdAt: '2026-04-20T08:00:00.000Z', status: '開催' },
  { id: 'practice-p02', title: '4月強化練習',  date: '2026-04-27', time: '10:00', location: '第2グラウンド', description: '',              createdAt: '2026-04-01T08:00:00.000Z', status: '中止' },
  { id: 'practice-p03', title: '4月定例練習',  date: '2026-04-13', time: '13:00', location: '体育館B',     description: '',               createdAt: '2026-03-25T08:00:00.000Z', status: '開催' },
  { id: 'practice-p04', title: '3月強化練習',  date: '2026-03-29', time: '10:00', location: '第1グラウンド', description: '',               createdAt: '2026-03-10T08:00:00.000Z', status: '開催' },
  { id: 'practice-p05', title: '3月定例練習',  date: '2026-03-15', time: '14:00', location: '体育館A',     description: '',               createdAt: '2026-03-01T08:00:00.000Z', status: '開催' },
  { id: 'practice-p06', title: '2月強化練習',  date: '2026-02-22', time: '10:00', location: '体育館B',     description: 'ビブス持参',      createdAt: '2026-02-05T08:00:00.000Z', status: '開催' },
  { id: 'practice-p07', title: '2月定例練習',  date: '2026-02-08', time: '13:00', location: '第2グラウンド', description: '',               createdAt: '2026-01-25T08:00:00.000Z', status: '開催' },
  { id: 'practice-p08', title: '1月強化練習',  date: '2026-01-25', time: '10:00', location: '体育館A',     description: '',               createdAt: '2026-01-10T08:00:00.000Z', status: '開催' },
  { id: 'practice-p09', title: '1月初蹴り',   date: '2026-01-11', time: '10:00', location: '第1グラウンド', description: '新年会あり',      createdAt: '2025-12-20T08:00:00.000Z', status: '開催' },
  { id: 'practice-p10', title: '12月納め練習', date: '2025-12-21', time: '13:00', location: '体育館B',     description: '',               createdAt: '2025-12-05T08:00:00.000Z', status: '開催' },
  { id: 'practice-p11', title: '12月定例練習', date: '2025-12-07', time: '14:00', location: '体育館A',     description: '',               createdAt: '2025-11-20T08:00:00.000Z', status: '開催' },
  { id: 'practice-p12', title: '11月強化練習', date: '2025-11-23', time: '10:00', location: '第2グラウンド', description: '',               createdAt: '2025-11-05T08:00:00.000Z', status: '雨天中止' },
  { id: 'practice-p13', title: '11月定例練習', date: '2025-11-09', time: '13:00', location: '体育館A',     description: '',               createdAt: '2025-10-25T08:00:00.000Z', status: '開催' },
  { id: 'practice-p14', title: '10月強化練習', date: '2025-10-26', time: '10:00', location: '第1グラウンド', description: '',               createdAt: '2025-10-10T08:00:00.000Z', status: '開催' },
  { id: 'practice-p15', title: '10月定例練習', date: '2025-10-12', time: '14:00', location: '体育館B',     description: '',               createdAt: '2025-09-25T08:00:00.000Z', status: '開催' },
  { id: 'practice-p16', title: '9月強化練習',  date: '2025-09-28', time: '10:00', location: '体育館A',     description: '',               createdAt: '2025-09-10T08:00:00.000Z', status: '開催' },
  { id: 'practice-p17', title: '9月定例練習',  date: '2025-09-14', time: '13:00', location: '第2グラウンド', description: '',               createdAt: '2025-08-25T08:00:00.000Z', status: '開催' },
  { id: 'practice-p18', title: '8月強化練習',  date: '2025-08-24', time: '07:00', location: '第1グラウンド', description: '早朝練習・水分補給必須', createdAt: '2025-08-05T08:00:00.000Z', status: '開催' },
  { id: 'practice-p19', title: '8月定例練習',  date: '2025-08-10', time: '07:00', location: '体育館A',     description: '',               createdAt: '2025-07-25T08:00:00.000Z', status: '開催' },
  { id: 'practice-p20', title: '7月強化練習',  date: '2025-07-27', time: '10:00', location: '体育館B',     description: '',               createdAt: '2025-07-10T08:00:00.000Z', status: '開催' },
];

export const MOCK_ATTENDANCES: Attendance[] = [
  { id: 'att-1', practiceId: 'practice-f1',  lineUserId: 'U_mock_admin', displayName: 'テストユーザー（管理者）', status: '参加',   updatedAt: '2026-05-15T10:00:00.000Z' },
  { id: 'att-2', practiceId: 'practice-f1',  lineUserId: 'U_member_1',   displayName: '田中太郎',               status: '不参加', updatedAt: '2026-05-15T11:00:00.000Z' },
  { id: 'att-3', practiceId: 'practice-f1',  lineUserId: 'U_member_2',   displayName: '鈴木花子',               status: '参加',   updatedAt: '2026-05-15T12:00:00.000Z' },
  { id: 'att-4', practiceId: 'practice-p01', lineUserId: 'U_mock_admin', displayName: 'テストユーザー（管理者）', status: '参加',   updatedAt: '2026-05-11T15:00:00.000Z' },
  { id: 'att-5', practiceId: 'practice-p02', lineUserId: 'U_mock_admin', displayName: 'テストユーザー（管理者）', status: '不参加', updatedAt: '2026-04-27T12:00:00.000Z' },
];
