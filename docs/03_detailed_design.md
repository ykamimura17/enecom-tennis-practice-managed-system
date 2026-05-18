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
│   │       ├── practices.ts          # 練習 CRUD + 案内送信 + 開催ステータス変更
│   │       └── attendance.ts         # 出欠登録・取得
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # エントリーポイント
│   │   ├── App.tsx                   # ルートコンポーネント（タブ・通知ベル）
│   │   ├── types/
│   │   │   └── index.ts              # フロントエンド側型定義
│   │   ├── hooks/
│   │   │   └── useLiff.ts            # LIFF初期化 + ユーザー情報取得
│   │   ├── api/
│   │   │   └── client.ts             # バックエンドAPIラッパー（モック対応）
│   │   ├── mocks/
│   │   │   └── data.ts               # ローカル開発用モックデータ
│   │   ├── pages/
│   │   │   ├── MemberPage.tsx        # メンバー向けページ
│   │   │   └── AdminPage.tsx         # 管理者向けページ
│   │   └── components/
│   │       ├── PracticeCard.tsx       # 練習カード（出欠ボタン・読み取り専用対応）
│   │       ├── CreatePracticeForm.tsx # 練習作成フォーム
│   │       ├── AttendanceSummary.tsx  # 出欠集計表示（中止管理UI含む）
│   │       └── NotificationPanel.tsx  # 通知パネル（新着練習一覧）
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
export type PracticeStatus = '開催' | '雨天中止' | '中止';

export interface Practice {
  id: string;          // UUID v4
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  location: string;
  description: string;
  createdAt: string;   // ISO 8601
  status: PracticeStatus;
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
- `practices` シートの A1:Z1 を読み取り、空ならヘッダー行 `['id', 'title', 'date', 'time', 'location', 'description', 'createdAt', 'status']` を書き込む
- `attendance` シートも同様に `['id', 'practiceId', 'lineUserId', 'displayName', 'status', 'updatedAt']`

#### getPractices(): Promise\<Practice[]\>
- `practices!A:H` の全行を取得（H列 = status）
- 1行目（ヘッダー）をスキップし、`id`列が空でない行をフィルタ
- `row[7]`（H列）がない場合は `'開催'` をデフォルト値として使用
- `date`列で昇順ソート

#### createPractice(data): Promise\<Practice\>
- UUID v4でIDを生成、`createdAt`に現在時刻（ISO 8601）を設定
- `status` を `'開催'` で初期化
- `practices!A:H` にappend

#### getAttendance(practiceId): Promise\<Attendance[]\>
- `attendance!A:F` の全行を取得
- `practiceId`列が引数と一致する行をフィルタ

#### upsertAttendance(data): Promise\<Attendance\>
- `attendance!A:F` の全行を取得
- `practiceId` + `lineUserId` が一致する行を検索
- 一致あり: 該当行をupdate（行番号はSheets API上で1-indexed、ヘッダー行=1）
- 一致なし: UUID v4でIDを生成してappend
- `updatedAt` は常に現在時刻で更新

#### updatePracticeStatus(id, status): Promise\<Practice\>
- `practices!A:H` の全行を取得
- `id`列が引数と一致する行を検索
- 一致なし: `'練習が見つかりません'` をthrow
- 一致あり: 該当行の H列（status）のみを `practices!H{rowNumber}` で上書き
- 更新後のPracticeオブジェクトを返却

### 2.4 LineService (backend/src/services/line.ts)

LINE Messaging APIの操作を担当するクラス。

#### コンストラクタ
- `@line/bot-sdk` の `MessagingApiClient` を `LINE_CHANNEL_ACCESS_TOKEN` で初期化

#### announceToGroup(practice, liffId): Promise\<void\>
- LIFFアプリURL: `https://liff.line.me/{liffId}?practiceId={practice.id}`
- 曜日の算出: `date` をパースして日本語曜日を取得
- Flex Message（Bubble型）を構築:
  - header: 緑背景 `#06C755`、白文字でタイトルを表示
  - body: 日時・場所を行表示、descriptionがあれば追加
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
| PATCH /:id/status | /api/practices/:id/status | requireAdmin | バリデーション → `sheets.updatePracticeStatus()` |
| POST /:id/announce | /api/practices/:id/announce | requireAdmin | 練習ID検索 → `lineService.announceToGroup()` |

statusバリデーション（PATCH）: `'開催'` / `'雨天中止'` / `'中止'` のいずれかでなければ400。

#### attendance.ts
| ハンドラ | パス | ミドルウェア | 処理 |
|---------|------|------------|------|
| GET /:practiceId | /api/attendance/:practiceId | なし | `sheets.getAttendance(practiceId)` |
| POST / | /api/attendance | なし | バリデーション → `sheets.upsertAttendance()` |

statusバリデーション（POST）: `'参加'` / `'不参加'` / `'未回答'` のいずれかでなければ400。

## 3. フロントエンド詳細設計

### 3.1 型定義 (frontend/src/types/index.ts)

```typescript
export type PracticeStatus = '開催' | '雨天中止' | '中止';

export interface Practice {
  id: string;
  title: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  location: string;
  description: string;
  createdAt: string;   // ISO 8601
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
```

### 3.2 LIFF初期化フック (frontend/src/hooks/useLiff.ts)

カスタムフック `useLiff()` の仕様:

状態:
- `userInfo: UserInfo | null` — ユーザー情報（LINEプロフィール + 管理者フラグ）
- `loading: boolean` — 初期化中フラグ
- `error: string | null` — エラーメッセージ

処理フロー（通常モード、`VITE_MOCK_MODE !== 'true'`）:
1. `useEffect` 内で `liff.init({ liffId: import.meta.env.VITE_LIFF_ID })` を実行
2. 初期化成功後、`liff.isLoggedIn()` を確認
3. ログイン済み: `liff.getProfile()` でLINEプロフィールを取得
4. 未ログイン: `liff.login()` でLINEログインにリダイレクト
5. `fetchMe(userId)` をバックエンドに問い合わせ、`isAdmin` フラグを取得
6. `userInfo` にセット、`loading = false`
7. エラー時: `error` にメッセージをセット

処理フロー（モックモード、`VITE_MOCK_MODE === 'true'`）:
1. LIFF初期化をスキップ
2. `MOCK_USER`（`src/mocks/data.ts`に定義）を直接 `userInfo` にセット

戻り値: `{ userInfo, loading, error }`

### 3.3 APIクライアント (frontend/src/api/client.ts)

`VITE_API_BASE_URL` をベースURLとするfetchラッパー。
`VITE_MOCK_MODE === 'true'` の場合はモックデータ（`src/mocks/data.ts`）を使用し、実際のHTTPリクエストは発生しない。

#### モック用インメモリストア
- `let mockPractices: Practice[]` — `MOCK_PRACTICES` で初期化
- `let mockAttendances: Attendance[]` — `MOCK_ATTENDANCES` で初期化

#### エクスポート関数

`fetchMe(userId): Promise<{ userId: string; isAdmin: boolean }>`
- GET /api/me（x-line-user-idヘッダー付き）
- useLiff.ts から個別インポートして使用

`api` オブジェクト:

| 関数 | 説明 |
|------|------|
| `getPractices()` | GET /api/practices — 練習一覧取得 |
| `getAttendance(practiceId)` | GET /api/attendance/:practiceId — 出欠一覧取得 |
| `upsertAttendance(lineUserId, displayName, practiceId, status)` | POST /api/attendance — 出欠登録・更新 |
| `createPractice(userId, data)` | POST /api/practices（x-line-user-idヘッダー付き） |
| `updatePracticeStatus(userId, practiceId, status)` | PATCH /api/practices/:id/status（x-line-user-idヘッダー付き） |
| `announcePractice(userId, practiceId)` | POST /api/practices/:id/announce（x-line-user-idヘッダー付き） |

全関数で共通:
- Content-Type: application/json
- エラー時はレスポンスボディのerrorメッセージをthrow

### 3.4 App.tsx（ルートコンポーネント）

状態:
- `useLiff()` からの `{ userInfo, loading, error }`
- `practices: Practice[]` — 通知ベル用の練習一覧
- `seenIds: Set<string>` — 既読練習ID（localStorage `'seen_practice_ids'` に永続化）
- `showNotification: boolean` — 通知パネル開閉

処理フロー:
1. `useLiff()` でLIFF初期化・ユーザー情報取得
2. `userInfo` 取得後、`api.getPractices()` で練習一覧をロード（通知ベル用）
3. `loading === true` の間はローディング表示
4. `error` がある場合はエラー表示
5. ヘッダー右上に通知ベルを表示:
   - `hasUnread = practices.some(p => !seenIds.has(p.id))` で未読判定
   - 未読あり: ベルアイコン右上に赤い点（直径8px）を表示
   - ベルアイコンクリック: `showNotification` をトグル、開くときに全練習IDを既読としてseenIdsに追加しlocalStorageを更新
6. `showNotification === true` の場合、`NotificationPanel` を絶対配置で表示
7. タブナビゲーション表示:
   - 「練習一覧」タブ（常時表示） → `MemberPage`
   - 「管理」タブ（`userInfo.isAdmin === true` の場合のみ表示） → `AdminPage`

### 3.5 NotificationPanel.tsx

props:
- `practices: Practice[]` — 全練習一覧
- `seenIds: Set<string>` — 既読ID（表示時点ではすべて既読扱いだが、「いつ追加されたか」の視覚区別に使用）
- `onClose: () => void`

表示:
- `createdAt` 降順でソートした練習一覧
- 各項目: タイトル・日付・場所を表示
- パネル外クリック（mousedownイベント）で `onClose()` を呼び出して閉じる
- 絶対配置（`top: 52px, right: 8px`）でヘッダー直下に重ねて表示

### 3.6 MemberPage.tsx

props: `userInfo: UserInfo`

状態:
- `practices: Practice[]`
- `attendanceMap: Map<string, Attendance>` — practiceIdをキーとする自分の出欠
- `loading: boolean` — 出欠登録中フラグ
- `visiblePastCount: number` — 過去の練習の表示件数（初期値 10）

処理フロー:
1. マウント時に `api.getPractices()` で練習一覧を取得
2. 各練習に対して `api.getAttendance(practiceId)` を実行し、自分のUserIDに一致するレコードを抽出してattendanceMapを構築
3. 今後の練習（当日以降）と過去の練習（前日以前）を日付で分類

表示:
- **今後の練習**: 全件表示、`PracticeCard`（出欠ボタン付き）でレンダリング
- **過去の練習**: `past.slice(0, visiblePastCount)` の件数を表示、`PracticeCard`（readonlyモード）でレンダリング
- `visiblePastCount < past.length` のとき「もっと見る（残りN件）」ボタンを表示
- ボタン押下で `visiblePastCount` を10増加（`+= 10`）

出欠登録（今後の練習のみ）:
1. `onChangeStatus(practiceId, status)` → `api.upsertAttendance(...)` を実行
2. 成功時、attendanceMapを更新してUIに即反映

### 3.7 PracticeCard.tsx

props:
- `practice: Practice`
- `myAttendance: Attendance | undefined` — 自分の出欠レコード（未回答の場合はundefined）
- `onChangeStatus: (practiceId: string, status: AttendanceStatus) => void`
- `loading: boolean`
- `readonly?: boolean`（デフォルト: false）

表示ロジック:
- `isCancelled = practice.status !== '開催'`

| 状態 | カードスタイル | ボタン/ステータス |
|------|--------------|-----------------|
| `isCancelled` | グレー左ボーダー（`borderLeft: '3px solid #ccc'`）、背景 `#fafafa` | ボタン・ステータスなし |
| `readonly && !isCancelled` | 通常 | 現在の出欠状態をテキスト表示（未回答は薄いグレーで「未回答」） |
| 通常（編集可能） | 通常 | 「参加」「不参加」ボタン（選択中はアクティブカラーでハイライト） |

タイトル行: 中止の場合は `practice.status`（「雨天中止」「中止」）のバッジをタイトル横に表示

### 3.8 AdminPage.tsx

props: `userInfo: UserInfo`, `onPracticeCreated: () => void`

状態:
- `practices: Practice[]`

処理フロー:
1. マウント時 + `onPracticeCreated` コールバック呼び出し時に `api.getPractices()` を再取得
2. 練習を `date` 降順でソートして表示

表示:
1. `CreatePracticeForm` — 練習作成フォーム（`onSubmit` 後に `onPracticeCreated` を呼び出し）
2. 練習一覧: 各練習に `AttendanceSummary`

ステータス変更時:
- `handleStatusChange(practiceId, status)`: ローカルの `practices` stateを更新（リロード不要）

#### CreatePracticeForm.tsx

props: `onSubmit: (data: Omit<Practice, 'id' | 'createdAt' | 'status'>) => Promise<void>`

フォームフィールド:
- タイトル（テキスト、必須）
- 日付（date input、必須）
- 時間（time input、必須）
- 場所（テキスト、必須）
- 備考（テキストエリア、任意）

送信時:
1. バリデーション（必須項目チェック）
2. `onSubmit(data)` を実行（親が `api.createPractice()` を呼ぶ）
3. 成功時、フォームリセット

### 3.9 AttendanceSummary.tsx

props:
- `practice: Practice`
- `userId: string` — 管理者のLINE User ID（API呼び出し時のヘッダー用）
- `onAnnounce: (practiceId: string) => Promise<void>`
- `onStatusChange: (practiceId: string, status: PracticeStatus) => void`

状態:
- `attendances: Attendance[]`
- `expanded: boolean` — 詳細表示の開閉
- `announcing: boolean` — LINE送信中フラグ
- `selectingCancel: boolean` — 中止理由選択UIの開閉
- `updatingStatus: boolean` — ステータス変更中フラグ

中止オプション:
```typescript
const CANCEL_OPTIONS = [
  { value: '雨天中止', label: '雨天中止' },
  { value: '中止',    label: 'その他の理由で中止' },
];
```

表示ロジック:
- `isCancelled = practice.status !== '開催'`
- カードスタイル: 中止時はグレー左ボーダー（`borderLeft: '3px solid #ccc'`）

ヘッダーアクションボタン:
| 状態 | 表示ボタン |
|------|-----------|
| `!isCancelled` | 「中止にする」ボタン + 「LINE送信」ボタン |
| `selectingCancel` | 中止理由選択UIをインライン展開（雨天中止 / その他の理由で中止 / キャンセル） |
| `isCancelled` | 「開催に戻す」ボタンのみ |

中止理由選択後:
- `api.updatePracticeStatus(userId, practice.id, next)` を実行
- 成功時 `onStatusChange(practice.id, next)` で親stateを更新

出欠集計表示（クリックで展開/折りたたみ）:
- 集計行: 参加 ○人 / 不参加 ○人 / 未回答 ○人
- 展開時: メンバー名と回答状態の一覧表

## 4. モックモード (VITE_MOCK_MODE)

ローカル開発・UIレビュー用に、バックエンドなしで動作するモックモードを提供する。

有効化: `frontend/.env.local` に `VITE_MOCK_MODE=true` を設定

| 項目 | モックモード | 通常モード |
|------|------------|---------|
| LIFF初期化 | スキップ | `liff.init()` を実行 |
| ユーザー情報 | `MOCK_USER`（管理者フラグ付き）を直接セット | LINEプロフィール + `/api/me` から取得 |
| API呼び出し | インメモリストアで完結 | 実際のHTTPリクエスト |
| データ永続化 | なし（リロードでリセット） | Google Sheets |

モックデータ（`src/mocks/data.ts`）:
- `MOCK_USER`: 管理者ユーザー（`isAdmin: true`）
- `MOCK_PRACTICES`: 今後2件 + 過去20件（中止・雨天中止のサンプルを含む）
- `MOCK_ATTENDANCES`: 5件のサンプル出欠データ

## 5. 依存パッケージ

### 5.1 バックエンド (backend/package.json)

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

### 5.2 フロントエンド (frontend/package.json)

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| react | ^18.2.0 | UIフレームワーク |
| react-dom | ^18.2.0 | React DOM |
| @line/liff | ^2.22.3 | LIFF SDK |
| vite | ^5.2.0 | ビルドツール |
| @vitejs/plugin-react | ^4.2.1 | ViteのReactプラグイン |
| typescript | ^5.2.2 | コンパイラ |
| @types/react, @types/react-dom | 各最新 | 型定義 |

## 6. TypeScript設定

### 6.1 バックエンド (backend/tsconfig.json)

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

### 6.2 フロントエンド (frontend/tsconfig.json)

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
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`"types": ["vite/client"]` により `import.meta.env` の型解決を有効化。

## 7. Vite設定 (frontend/vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
});
```

`host: '0.0.0.0'` はdevcontainer環境でホストマシンからアクセス可能にするため。

## 8. devcontainer設定

### 8.1 docker-compose.yml

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

### 8.2 devcontainer.json

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
        "ms-vscode.vscode-typescript-next"
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

## 9. スタイリング方針

- フロントエンドはインラインCSSを使用（外部CSSファイル・Tailwind CSS未導入）
- モバイルファースト（LINE内蔵ブラウザのviewport幅を前提）
- LINEのブランドカラー `#06C755` をアクセントカラーとして使用
- ボタン・カードはモバイルタップを考慮し、十分なサイズを確保
- 絵文字はヘッダーバナー（⚽）のみ使用。他のUI要素（ボタン、バッジ、ラベル）には絵文字を使用しない

## 10. セキュリティに関する既知の課題と対応方針

| 優先度 | 課題 | 現状 | 対応方針 |
|--------|------|------|----------|
| 高 | 管理者APIの認証が自己申告（x-line-user-id） | ヘッダー値をそのまま信頼 | LIFF IDトークン検証に変更（本番前必須） |
| 高 | .envのGit混入リスク | .gitignoreに記載 | GitHub Secret Scanning有効化を推奨 |
| 中 | CORS未設定時にワイルドカード | 開発時の利便性優先 | 本番ではFRONTEND_URLを必ず設定 |
| 中 | Sheets共有設定 | サービスアカウントのみに限定 | 手動で「編集者」権限を確認 |
| 低 | レートリミットなし | Sheets APIクォータが自然上限 | 必要に応じてexpress-rate-limit導入 |
