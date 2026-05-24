export type PracticeStatus = '開催' | '雨天中止' | '中止';

export interface Practice {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  description: string;
  createdAt: string;
  status: PracticeStatus;
}

export type AttendanceStatus = '参加' | '不参加' | '未回答';

export interface Attendance {
  id: string;
  practiceId: string;
  lineUserId: string;
  displayName: string;
  status: AttendanceStatus;
  updatedAt: string;
}

export interface UserInfo {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  isAdmin: boolean;
}
