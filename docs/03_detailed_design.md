# 詳細設計書: LINE 練習参加管理システム

## 1. プロジェクト構成

```
line-practice-manager/
├── .devcontainer/
│   └── devcontainer.json
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Expressサーバー起点
│   │   ├── types/
│   │   │   └── index.ts              # Practice / Attendance 型定義
│   │   ├── services/
│   │   │   ├── sheets.ts             # Google Sheets CRUD
│   │   │   └── line.ts               # LINE Messaging API（Flex Message送信）
│   │   ├── middleware/
│   │   │   └── adminAuth.ts          # 管理者認証ミドルウェア
│   │   └── routes/
│   │       ├── practices.ts          # 練習 CRUD + 案内送信
│   │       └── attendance.ts         # 出欠登録・取得
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # エントリーポイント
│   │   ├── App.tsx                   # ルートコンポーネント（タブナビゲーション）
│   │   ├── types/
│   │   │   └── index.ts              # フロントエンド側型定義
│   │   ├── hooks/
│   │   │   └── useLiff.ts            # LIFF初期化 + プロフィール取得
│   │   ├── api/
│   │   │   └── client.ts             # バックエンドAPIラッパー
│   │   ├── pages/
│   │   │   ├── MemberPage.tsx        # メンバー向けページ
│   │   │   └── AdminPage.tsx         # 管理者向けページ
│   │   └── components/
│   │       ├── PracticeCard.tsx       # 練習カード（出欠ボタン付き）
│   │       ├── CreatePracticeForm.tsx # 練習作成フォーム
│   │       └── AttendanceSummary.tsx  # 出欠集計表示
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 2. バックエンド詳細設計

### 2.1 型定義 (backend/src/types/index.ts)

```typescript
export interface Practice {
  id: string;          // UUID v4
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  location: string;
  description: string;
  createdAt: string;   // ISO 8601
}

export type AttendanceStatus = '参加' | '不参加' | '未回答';

export interface Attendance {
  id: string;          // UUID v4
  practiceId: string;
  lineUserId: string;
  displayName: string;
  status: AttendanceStatus;
  updatedAt: string;   // ISO 8601
}
```

### 2.2 サーバー起動 (backend/src/index.ts)

処理フロー:
1. `dotenv.config()` で環境変数をロード
2. Express appを生成し、CORS・JSONパーサーをセットアップ
3. ルーティングを登録（`/api/practices`, `/api/attendance`, `/api/me`, `/health`）
4. `SheetsService.init()` でGoogle Sheetsのヘッダー行を初期化
5. `app.listen(PORT)` でサーバー起動

CORS設定:
```typescript
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
```

`/api/me` エンドポイント:
- リクエストヘッダー `x-line-user-id` を読み取り
- `isAdmin(userId)` で管理者判定して返却

### 2.3 SheetsService (backend/src/services/sheets.ts)

Google Sheets APIのCRUDを担当するクラス。

#### コンストラクタ
- `GOOGLE_SERVICE_ACCOUNT_JSON` 環境変数をJSONパースしてサービスアカウント認証
- スコープ: `https://www.googleapis.com/auth/spreadsheets`
- `GOOGLE_SPREADSHEET_ID` でスプレッドシートを特定

#### init()
- `practices` シートの A1:Z1 を読み取り、空ならヘッダー行 `['id', 'title', 'date', 'time', 'location', 'description', 'createdAt']` を書き込む
- `attendance` シートも同様に `['id', 'practiceId', 'lineUserId', 'displayName', 'status', 'updatedAt']`

#### getPractices(): Promise\<Practice[]\>
- `practices!A:G` の全行を取得
- 1行目（ヘッダー）をスキップし、`id`列が空でない行をフィルタ
- `date`列で昇順ソート

#### createPractice(data): Promise\<Practice\>
- UUID v4でIDを生成、`createdAt`に現在時刻（ISO 8601）を設定
- `practices!A:G` にappend

#### getAttendance(practiceId): Promise\<Attendance[]\>
- `attendance!A:F` の全行を取得
- `practiceId`列が引数と一致する行をフィルタ

#### upsertAttendance(data): Promise\<Attendance\>
- `attendance!A:F` の全行を取得
- `practiceId` + `lineUserId` が一致する行を検索
- 一致あり: 該当行をupdate（行番号はSheets API上で1-indexed、ヘッダー行=1）
- 一致なし: UUID v4でIDを生成してappend
- `updatedAt` は常に現在時刻で更新

### 2.4 LineService (backend/src/services/line.ts)

LINE Messaging APIの操作を担当するクラス。

#### コンストラクタ
- `@line/bot-sdk` の `MessagingApiClient` を `LINE_CHANNEL_ACCESS_TOKEN` で初期化

#### announceToGroup(practice, liffId): Promise\<void\>
- LIFFアプリURL: `https://liff.line.me/{liffId}?practiceId={practice.id}`
- 曜日の算出: `date` をパースして日本語曜日を取得
- Flex Message（Bubble型）を構築:
  - header: 緑背景 `#06C755`、白文字で「📣 練習案内」+ タイトル
  - body: horizontal boxで「📅 日時」「📍 場所」を行表示、descriptionがあれば追加
  - footer: 「参加・不参加を登録する」URIアクションボタン（緑、LIFFリンク）
- `client.pushMessage({ to: LINE_GROUP_ID, messages: [message] })` で送信

### 2.5 管理者認証ミドルウェア (backend/src/middleware/adminAuth.ts)

#### requireAdmin(req, res, next)
- `ADMIN_LINE_USER_IDS` 環境変数をカンマ区切りで分割し、Setに格納（モジュールロード時に1回）
- リクエストヘッダー `x-line-user-id` を取得
- Setに含まれなければ 403 を返却
- 含まれれば `next()` で処理を続行

#### isAdmin(userId): boolean
- UserIDがSet内に存在するかを返す

### 2.6 ルーティング (backend/src/routes/)

#### practices.ts
| ハンドラ | パス | ミドルウェア | 処理 |
|---------|------|------------|------|
| GET / | /api/practices | なし | `sheets.getPractices()` |
| POST / | /api/practices | requireAdmin | バリデーション → `sheets.createPractice()` |
| POST /:id/announce | /api/practices/:id/announce | requireAdmin | 練習ID検索 → `lineService.announceToGroup()` |

#### attendance.ts
| ハンドラ | パス | ミドルウェア | 処理 |
|---------|------|------------|------|
| GET /:practiceId | /api/attendance/:practiceId | なし | `sheets.getAttendance(practiceId)` |
| POST / | /api/attendance | なし | バリデーション → `sheets.upsertAttendance()` |

status バリデーション: `参加` / `不参加` / `未回答` のいずれかでなければ400。

## 3. フロントエンド詳細設計

### 3.1 型定義 (frontend/src/types/index.ts)

```typescript
export interface Practice {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  createdAt: string;
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

export interface UserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}
```

### 3.2 LIFF初期化フック (frontend/src/hooks/useLiff.ts)

カスタムフック `useLiff()` の仕様:

状態:
- `profile: UserProfile | null` — LINEプロフィール
- `isReady: boolean` — LIFF初期化完了フラグ
- `error: string | null` — エラーメッセージ

処理フロー:
1. `useEffect` 内で `liff.init({ liffId: import.meta.env.VITE_LIFF_ID })` を実行
2. 初期化成功後、`liff.isLoggedIn()` を確認
3. ログイン済み: `liff.getProfile()` でユーザー情報を取得しstateにセット
4. 未ログイン: `liff.login()` でLINEログインにリダイレクト
5. `isReady = true` をセット
6. エラー時: `error` にメッセージをセット

戻り値: `{ profile, isReady, error }`

### 3.3 APIクライアント (frontend/src/api/client.ts)

`VITE_API_BASE_URL` をベースURLとするfetchラッパー。

関数一覧:
- `fetchPractices(): Promise<Practice[]>` — GET /api/practices
- `createPractice(data, userId): Promise<Practice>` — POST /api/practices（x-line-user-idヘッダー付き）
- `announceToGroup(practiceId, userId): Promise<void>` — POST /api/practices/:id/announce
- `fetchAttendance(practiceId): Promise<Attendance[]>` — GET /api/attendance/:practiceId
- `submitAttendance(data): Promise<Attendance>` — POST /api/attendance
- `fetchMe(userId): Promise<{ userId: string; isAdmin: boolean }>` — GET /api/me

全関数で共通:
- Content-Type: application/json
- エラー時はレスポンスボディのerrorメッセージをthrow

### 3.4 App.tsx（ルートコンポーネント）

処理フロー:
1. `useLiff()` でLIFF初期化・プロフィール取得
2. プロフィール取得後、`fetchMe(userId)` で管理者フラグを取得
3. `isReady === false` の間はローディング表示
4. `error` がある場合はエラー表示
5. タブナビゲーション表示:
   - 「練習一覧」タブ（常時表示） → `MemberPage`
   - 「管理」タブ（`isAdmin === true` の場合のみ表示） → `AdminPage`

### 3.5 MemberPage.tsx

props: `profile: UserProfile`

状態:
- `practices: Practice[]`
- `attendanceMap: Map<string, Attendance>` — practiceIdをキーとする自分の出欠

処理フロー:
1. マウント時に`fetchPractices()`で練習一覧を取得
2. 各練習に対して`fetchAttendance(practiceId)`を実行し、自分のUserIDに一致するレコードを抽出
3. 練習ごとに`PracticeCard`コンポーネントをレンダリング

#### PracticeCard.tsx

props:
- `practice: Practice`
- `currentStatus: AttendanceStatus | null`（自分の現在の回答状態）
- `onSubmit: (status: AttendanceStatus) => void`

表示:
- タイトル、日時（曜日付き）、場所、備考
- 「参加」「不参加」ボタン（現在の状態がハイライト）

ボタン押下時:
1. `onSubmit(status)` → `submitAttendance({ practiceId, lineUserId, displayName, status })` を実行
2. 成功時、attendanceMapを更新してUIに即反映

### 3.6 AdminPage.tsx

props: `profile: UserProfile`

状態:
- `practices: Practice[]`

表示内容:
1. `CreatePracticeForm` — 練習作成フォーム
2. 作成済み練習一覧（各練習に `AttendanceSummary` と「LINE送信」ボタン）

#### CreatePracticeForm.tsx

props: `userId: string`, `onCreated: () => void`

フォームフィールド:
- タイトル（テキスト、必須）
- 日付（date input、必須）
- 時間（time input、必須）
- 場所（テキスト、必須）
- 備考（テキストエリア、任意）

送信時:
1. バリデーション（必須項目チェック）
2. `createPractice(data, userId)` を実行
3. 成功時、フォームリセットして `onCreated()` で親に通知

#### AttendanceSummary.tsx

props: `practiceId: string`

状態:
- `attendances: Attendance[]`
- `expanded: boolean`（詳細表示の開閉）

表示:
- 集計行: 参加 ○人 / 不参加 ○人 / 未回答 ○人
- 展開時: メンバー名と回答状態の一覧表

## 4. 依存パッケージ

### 4.1 バックエンド (backend/package.json)

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| express | ^4.18.2 | HTTPサーバー |
| cors | ^2.8.5 | CORS設定 |
| dotenv | ^16.4.5 | 環境変数読み込み |
| googleapis | ^140.0.0 | Google Sheets API |
| @line/bot-sdk | ^9.3.0 | LINE Messaging API |
| uuid | ^9.0.0 | UUID v4生成 |
| tsx | ^4.7.3 | TypeScript実行（dev） |
| typescript | ^5.4.5 | コンパイラ |
| @types/express, @types/cors, @types/node, @types/uuid | 各最新 | 型定義 |

### 4.2 フロントエンド (frontend/package.json)

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| react | ^18.2.0 | UIフレームワーク |
| react-dom | ^18.2.0 | React DOM |
| @line/liff | ^2.22.3 | LIFF SDK |
| vite | ^5.2.0 | ビルドツール |
| @vitejs/plugin-react | ^4.2.1 | ViteのReactプラグイン |
| typescript | ^5.2.2 | コンパイラ |
| @types/react, @types/react-dom | 各最新 | 型定義 |

## 5. TypeScript設定

### 5.1 バックエンド (backend/tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.2 フロントエンド (frontend/tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

## 6. Vite設定 (frontend/vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
});
```

`host: '0.0.0.0'` はdevcontainer環境でホストマシンからアクセス可能にするため。

## 7. devcontainer設定

### 7.1 docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    image: node:20-bullseye
    volumes:
      - .:/workspace:cached
    working_dir: /workspace
    command: sleep infinity
    ports:
      - "3000:3000"
      - "5173:5173"
    env_file:
      - .env
```

### 7.2 devcontainer.json

```json
{
  "name": "LINE Practice Manager",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },
  "forwardPorts": [3000, 5173],
  "postCreateCommand": "cd /workspace/backend && npm install && cd /workspace/frontend && npm install"
}
```

## 8. スタイリング方針

- フロントエンドはインラインCSSまたはCSSファイルを使用（Tailwind CSSは未導入）
- モバイルファースト（LINE内蔵ブラウザのviewport幅を前提）
- LINEのブランドカラー `#06C755` をアクセントカラーとして使用
- ボタン・カードはモバイルタップを考慮し、十分なサイズ（最低44px）を確保

## 9. セキュリティに関する既知の課題と対応方針

| 優先度 | 課題 | 現状 | 対応方針 |
|--------|------|------|----------|
| 高 | 管理者APIの認証が自己申告（x-line-user-id） | ヘッダー値をそのまま信頼 | LIFF IDトークン検証に変更（本番前必須） |
| 高 | .envのGit混入リスク | .gitignoreに記載 | GitHub Secret Scanning有効化を推奨 |
| 中 | CORS未設定時にワイルドカード | 開発時の利便性優先 | 本番ではFRONTEND_URLを必ず設定 |
| 中 | Sheets共有設定 | サービスアカウントのみに限定 | 手動で「編集者」権限を確認 |
| 低 | レートリミットなし | Sheets APIクォータが自然上限 | 必要に応じてexpress-rate-limit導入 |
