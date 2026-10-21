import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { Practice, PracticeStatus, Attendance, AttendanceStatus, CarpoolStatus } from '../types';

const PRACTICES_SHEET = 'practices';
const ATTENDANCE_SHEET = 'attendance';
const MEMBERS_SHEET = 'members';

// ヘッダー行
const PRACTICES_HEADERS = ['id', 'title', 'date', 'time', 'location', 'description', 'createdAt', 'status', 'endTime'];
const MEMBERS_HEADERS = ['lineUserId', 'displayName', 'updatedAt'];
const ATTENDANCE_HEADERS = ['id', 'practiceId', 'lineUserId', 'displayName', 'status', 'updatedAt', 'carpool', 'actual'];

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
    const metadata=await this.sheets.spreadsheets.get({spreadsheetId:this.spreadsheetId,fields:'sheets.properties.title'});
    if(!(metadata.data.sheets??[]).some(sheet=>sheet.properties?.title===MEMBERS_SHEET)) {
      await this.sheets.spreadsheets.batchUpdate({spreadsheetId:this.spreadsheetId,requestBody:{requests:[{addSheet:{properties:{title:MEMBERS_SHEET}}}]}});
    }
    await this.ensureSheet(MEMBERS_SHEET, MEMBERS_HEADERS);
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
      range: `${PRACTICES_SHEET}!A:I`,
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
        endTime:     row[8] || undefined,
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
      range: `${PRACTICES_SHEET}!A:I`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          practice.id, practice.title, practice.date,
          practice.time, practice.location, practice.description,
          practice.createdAt, practice.status, practice.endTime ?? '',
        ]],
      },
    });
    return practice;
  }

  async updatePractice(id: string, data: Omit<Practice, 'id' | 'createdAt' | 'status'>): Promise<Practice> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${PRACTICES_SHEET}!A:I`,
    });
    const rows = res.data.values ?? [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
    if (rowIndex < 1) throw new Error('練習が見つかりません');

    const existing = rows[rowIndex];
    const updated: Practice = {
      id,
      ...data,
      createdAt: existing[6],
      status: (existing[7] as PracticeStatus) || '開催',
    };

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${PRACTICES_SHEET}!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          updated.id, updated.title, updated.date,
          updated.time, updated.location, updated.description,
          updated.createdAt, updated.status, updated.endTime ?? '',
        ]],
      },
    });

    return updated;
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


  // ───────────── Members ─────────────
  async getMembers(): Promise<{lineUserId:string;displayName:string}[]> {
    const res = await this.sheets.spreadsheets.values.get({spreadsheetId:this.spreadsheetId,range:`${MEMBERS_SHEET}!A:C`});
    return (res.data.values??[]).slice(1).filter(row=>row[0]).map(row=>({lineUserId:row[0],displayName:row[1]||'名前未設定'}));
  }

  async upsertMember(lineUserId:string,displayName:string):Promise<{lineUserId:string;displayName:string}> {
    const res=await this.sheets.spreadsheets.values.get({spreadsheetId:this.spreadsheetId,range:`${MEMBERS_SHEET}!A:C`});
    const rows=res.data.values??[];
    const index=rows.findIndex((row,i)=>i>0&&row[0]===lineUserId);
    const values=[[lineUserId,displayName,new Date().toISOString()]];
    if(index>=1){
      await this.sheets.spreadsheets.values.update({spreadsheetId:this.spreadsheetId,range:`${MEMBERS_SHEET}!A${index+1}:C${index+1}`,valueInputOption:'RAW',requestBody:{values}});
    }else{
      await this.sheets.spreadsheets.values.append({spreadsheetId:this.spreadsheetId,range:`${MEMBERS_SHEET}!A:C`,valueInputOption:'RAW',requestBody:{values}});
    }
    return {lineUserId,displayName};
  }

  async getPracticeRoster(practiceId:string):Promise<Attendance[]> {
    const [members,records]=await Promise.all([this.getMembers(),this.getAttendance(practiceId)]);
    const byUser=new Map(records.map(a=>[a.lineUserId,a]));
    const roster=members.map(member=>byUser.get(member.lineUserId)??{
      id:`unanswered:${practiceId}:${member.lineUserId}`,practiceId,lineUserId:member.lineUserId,
      displayName:member.displayName,status:'未回答' as AttendanceStatus,updatedAt:'',
    });
    const known=new Set(members.map(m=>m.lineUserId));
    return [...roster,...records.filter(a=>!known.has(a.lineUserId))];
  }

  // ───────────── Attendance ─────────────

  async getAttendance(practiceId: string): Promise<Attendance[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ATTENDANCE_SHEET}!A:H`,
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
        carpool:     (row[6] as CarpoolStatus) || undefined,
        actual:      row[7] === 'TRUE' ? true : undefined,
      }));
  }

  async upsertAttendance(data: Omit<Attendance, 'id' | 'updatedAt'>): Promise<Attendance> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ATTENDANCE_SHEET}!A:H`,
    });
    const rows = res.data.values ?? [];

    // 既存レコードの行番号を探す（1-indexed, ヘッダー行=1）
    const rowIndex = rows.findIndex(
      (row, i) => i > 0 && row[1] === data.practiceId && row[2] === data.lineUserId
    );

    // 配車（送迎）の要否は参加者のみ意味を持つため、参加以外は強制的に空にする
    const carpool = data.status === '参加' ? data.carpool : undefined;
    // 既存の actual 値を引き継ぐ（メンバー操作で actual は変更しない）
    const existingActual = rowIndex >= 1 && rows[rowIndex][7] === 'TRUE' ? true : undefined;
    const record: Attendance = {
      id: rowIndex >= 1 ? rows[rowIndex][0] : uuidv4(),
      ...data,
      carpool,
      actual: existingActual,
      updatedAt: new Date().toISOString(),
    };
    const values = [[
      record.id, record.practiceId, record.lineUserId,
      record.displayName, record.status, record.updatedAt,
      record.carpool ?? '', record.actual ? 'TRUE' : '',
    ]];

    if (rowIndex >= 1) {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${ATTENDANCE_SHEET}!A${rowIndex + 1}:H${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    } else {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${ATTENDANCE_SHEET}!A:H`,
        valueInputOption: 'RAW',
        requestBody: { values },
      });
    }
    return record;
  }

  async updateActual(id: string, actual: boolean): Promise<Attendance> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${ATTENDANCE_SHEET}!A:H`,
    });
    const rows = res.data.values ?? [];
    const rowIndex = rows.findIndex((row, i) => i > 0 && row[0] === id);
    if (rowIndex < 1) throw new Error('出欠レコードが見つかりません');

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${ATTENDANCE_SHEET}!H${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[actual ? 'TRUE' : '']] },
    });

    const row = rows[rowIndex];
    return {
      id:          row[0],
      practiceId:  row[1],
      lineUserId:  row[2],
      displayName: row[3],
      status:      row[4] as AttendanceStatus,
      updatedAt:   row[5],
      carpool:     (row[6] as CarpoolStatus) || undefined,
      actual:      actual || undefined,
    };
  }
}
