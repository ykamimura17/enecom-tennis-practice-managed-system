import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { Practice, PracticeStatus, Attendance, AttendanceStatus } from '../types';

const PRACTICES_SHEET = 'practices';
const ATTENDANCE_SHEET = 'attendance';

// ヘッダー行
const PRACTICES_HEADERS = ['id', 'title', 'date', 'time', 'location', 'description', 'createdAt', 'status'];
const ATTENDANCE_HEADERS = ['id', 'practiceId', 'lineUserId', 'displayName', 'status', 'updatedAt'];

export class SheetsService {
  private sheets;
  private spreadsheetId: string;

  constructor() {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth });
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;
  }

  /** シートの初期化（ヘッダー行が存在しない場合に追加） */
  async init(): Promise<void> {
    await this.ensureSheet(PRACTICES_SHEET, PRACTICES_HEADERS);
    await this.ensureSheet(ATTENDANCE_SHEET, ATTENDANCE_HEADERS);
  }

  private async ensureSheet(sheetName: string, headers: string[]): Promise<void> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });
    if (!res.data.values || res.data.values.length === 0) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }
  }

  // ───────────── Practices ─────────────

  async getPractices(): Promise<Practice[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${PRACTICES_SHEET}!A:H`,
    });
    const rows = res.data.values ?? [];
    return rows.slice(1)
      .filter(row => row[0])
      .map(row => ({
        id:          row[0],
        title:       row[1],
        date:        row[2],
        time:        row[3],
        location:    row[4],
        description: row[5],
        createdAt:   row[6],
        status:      (row[7] as PracticeStatus) || '開催',
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async createPractice(data: Omit<Practice, 'id' | 'createdAt' | 'status'>): Promise<Practice> {
    const practice: Practice = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      status: '開催',
    };
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${PRACTICES_SHEET}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          practice.id, practice.title, practice.date,
          practice.time, practice.location, practice.description, practice.createdAt, practice.status,
        ]],
      },
    });
    return practice;
  }

  async updatePracticeStatus(id: string, status: PracticeStatus): Promise<Practice> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${PRACTICES_SHEET}!A:H`,
    });
    const rows = res.data.values ?? [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
    if (rowIndex < 1) throw new Error('練習が見つかりません');

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${PRACTICES_SHEET}!H${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] },
    });

    const row = rows[rowIndex];
    return {
      id: row[0], title: row[1], date: row[2], time: row[3],
      location: row[4], description: row[5], createdAt: row[6], status,
    };
  }

  // ───────────── Attendance ─────────────

  async getAttendance(practiceId: string): Promise<Attendance[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ATTENDANCE_SHEET}!A:F`,
    });
    const rows = res.data.values ?? [];
    return rows.slice(1)
      .filter(row => row[1] === practiceId)
      .map(row => ({
        id:          row[0],
        practiceId:  row[1],
        lineUserId:  row[2],
        displayName: row[3],
        status:      row[4] as AttendanceStatus,
        updatedAt:   row[5],
      }));
  }

  async upsertAttendance(data: Omit<Attendance, 'id' | 'updatedAt'>): Promise<Attendance> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ATTENDANCE_SHEET}!A:F`,
    });
    const rows = res.data.values ?? [];

    // 既存レコードの行番号を探す（1-indexed, ヘッダー行=1）
    const rowIndex = rows.findIndex(
      (row, i) => i > 0 && row[1] === data.practiceId && row[2] === data.lineUserId
    );

    const record: Attendance = {
      id: rowIndex >= 1 ? rows[rowIndex][0] : uuidv4(),
      ...data,
      updatedAt: new Date().toISOString(),
    };
    const values = [[
      record.id, record.practiceId, record.lineUserId,
      record.displayName, record.status, record.updatedAt,
    ]];

    if (rowIndex >= 1) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${ATTENDANCE_SHEET}!A${rowIndex + 1}:F${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    } else {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${ATTENDANCE_SHEET}!A:F`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
    return record;
  }
}
