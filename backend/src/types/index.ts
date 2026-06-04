export type PracticeStatus = '開催' | '雨天中止' | '中止';

export interface Practice {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  endTime?: string;    // HH:MM (任意)
  location: string;
  description: string;
  createdAt: string;   // ISO 8601
  status: PracticeStatus;
}

export type AttendanceStatus = '参加' | '不参加' | '未回答';

export type CarpoolStatus = '必要' | '不要';

export interface Attendance {
  id: string;
  practiceId: string;
  lineUserId: string;
  displayName: string;
  status: AttendanceStatus;
  carpool?: CarpoolStatus;  // 配車（送迎）の要否。参加者のみ意味を持つ
  updatedAt: string;   // ISO 8601
}
