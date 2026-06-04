# エネコムテニス練習管理システム - システム構成図

## 1. システム概要

LINE LIFF（LINE Front-end Framework）を活用したテニスサークルの練習出欠管理Webアプリケーション。
管理者が練習予定を作成・告知し、メンバーがLINE上で出欠を回答する仕組み。

## 2. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | React + TypeScript | React 18.2 / TS 5.2 |
| ビルドツール | Vite | 5.2 |
| LINE連携 | LIFF SDK | 2.22 |
| バックエンド | Node.js + Express | Express 4.18 / TS 5.4 |
| データストア | Google Sheets API | googleapis 140.0 |
| メッセージ | LINE Bot SDK（Flex Message生成） | 9.3 |
| テスト | Vitest + Supertest | — |
| 開発環境 | Docker (devcontainer) | Node 20 |

## 3. システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        LINE プラットフォーム                      │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │ LINE App │───▶│  LIFF SDK    │───▶│ shareTargetPicker()   │  │
│  │ (iOS/    │    │  認証・       │    │ グループへの告知送信    │  │
│  │  Android)│    │  プロフィル取得│    │ (Flex Message)        │  │
│  └──────────┘    └──────────────┘    └───────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     フロントエンド (React SPA)                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  App.tsx     │  │ MemberPage   │  │ AdminPage             │  │
│  │  タブ切替     │  │ 練習一覧      │  │ 練習管理               │  │
│  │  通知管理     │  │ 出欠回答      │  │ 出欠確認・LINE送信     │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
│  │ useLiff Hook     │  │ コンポーネント                        │  │
│  │ LIFF初期化・認証  │  │ PracticeCard / AttendanceSummary    │  │
│  │ プロフィル取得    │  │ CreatePracticeForm / Notification   │  │
│  └──────────────────┘  └──────────────────────────────────────┘  │
│                                                                 │
│  デプロイ先: Vercel (静的ホスティング)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (HTTPS)
                         │ Header: x-line-user-id
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   バックエンド (Express API)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ミドルウェア                                              │   │
│  │  ・CORS (FRONTEND_URL のみ許可)                           │   │
│  │  ・JSON パーサー                                          │   │
│  │  ・管理者認証 (adminAuth.ts)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────┐  ┌────────────────────────────────┐   │
│  │ Routes              │  │ Services                       │   │
│  │  /api/practices     │  │  SheetsService                 │   │
│  │  /api/attendance    │  │   - Google Sheets CRUD         │   │
│  │  /api/me            │  │  LineService                   │   │
│  │  /health            │  │   - Flex Message 生成          │   │
│  └─────────────────────┘  └────────────────────────────────┘   │
│                                                                 │
│  デプロイ先: Render / Railway / Cloud Run / Vercel Serverless   │
└────────────────────────┬────────────────────────────────────────┘
                         │ Google Sheets API
                         │ (JWT サービスアカウント認証)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Google Sheets (データストア)                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ practicesSheet (練習情報)                            │       │
│  │  id | title | date | time | location | description  │       │
│  │  createdAt | status | endTime                       │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ attendanceSheet (出欠情報)                          │       │
│  │  id | practiceId | lineUserId | displayName         │       │
│  │  status | updatedAt | carpool                       │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## 4. API エンドポイント一覧

### 認証・ユーザー情報

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/health` | 不要 | ヘルスチェック |
| GET | `/api/me` | ユーザー | ユーザー情報取得（管理者フラグ含む） |

### 練習管理

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/api/practices` | ユーザー | 練習一覧取得 |
| POST | `/api/practices` | 管理者 | 練習作成 |
| PUT | `/api/practices/:id` | 管理者 | 練習編集 |
| PATCH | `/api/practices/:id/status` | 管理者 | ステータス変更（開催/雨天中止/中止） |
| POST | `/api/practices/:id/announce` | 管理者 | LINE告知メッセージ生成 |

### 出欠管理

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/api/attendance/:practiceId` | ユーザー | 出欠一覧取得 |
| POST | `/api/attendance` | ユーザー | 出欠登録・更新（upsert） |

## 5. 認証・認可フロー

```
1. ユーザーがLINEアプリ内でLIFFを開く
2. LIFF SDK が LINE 認証を実行
3. liff.getProfile() でプロフィール取得
4. フロントエンドが x-line-user-id ヘッダー付きで /api/me を呼出
5. バックエンドが ADMIN_LINE_USER_IDS 環境変数と照合
6. 管理者 or 一般メンバーとして応答
```

- **一般メンバー**: 練習一覧閲覧、出欠回答
- **管理者**: 上記 + 練習作成・編集・中止・LINE告知送信

## 6. データフロー

### メンバーの出欠回答フロー

```
LINE App → LIFF起動 → プロフィル取得 → 練習一覧表示
→ 出欠ボタンタップ → POST /api/attendance → Google Sheets 更新
```

### 管理者の告知フロー

```
LINE App → LIFF起動 → 管理者タブ → 練習作成/編集
→ POST /api/practices → Sheets保存
→ 「LINE送信」タップ → POST /api/practices/:id/announce
→ Flex Message JSON 取得 → liff.shareTargetPicker()
→ LINEグループ選択 → 告知メッセージ送信
```

## 7. ディレクトリ構成

```
enecom-tennis-practice-managed-system/
├── backend/
│   ├── src/
│   │   ├── index.ts              # エントリーポイント
│   │   ├── app.ts                # Express アプリ設定
│   │   ├── types/index.ts        # 型定義
│   │   ├── services/
│   │   │   ├── sheets.ts         # Google Sheets 操作
│   │   │   └── line.ts           # LINE Flex Message 生成
│   │   ├── routes/
│   │   │   ├── practices.ts      # 練習 API
│   │   │   └── attendance.ts     # 出欠 API
│   │   ├── middleware/
│   │   │   └── adminAuth.ts      # 管理者認証
│   │   └── __tests__/            # テスト
│   ├── api/
│   │   └── index.ts              # Vercel Serverless エクスポート
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # メインアプリ（タブナビゲーション）
│   │   ├── main.tsx              # React エントリー
│   │   ├── types/index.ts        # 型定義
│   │   ├── pages/
│   │   │   ├── MemberPage.tsx    # メンバー画面
│   │   │   └── AdminPage.tsx     # 管理者画面
│   │   ├── components/
│   │   │   ├── PracticeCard.tsx           # 練習カード
│   │   │   ├── AttendanceSummary.tsx      # 出欠サマリー
│   │   │   ├── CreatePracticeForm.tsx     # 練習作成フォーム
│   │   │   └── NotificationPanel.tsx     # 通知パネル
│   │   ├── hooks/
│   │   │   └── useLiff.ts        # LIFF 初期化・認証
│   │   ├── api/
│   │   │   └── client.ts         # API クライアント
│   │   └── mocks/
│   │       └── data.ts           # モックデータ
│   ├── package.json
│   └── vite.config.ts
├── docs/                         # ドキュメント
├── .devcontainer/                # 開発コンテナ設定
├── .env.example                  # 環境変数テンプレート
└── README.md
```

## 8. 環境変数

### バックエンド

| 変数名 | 説明 |
|--------|------|
| `PORT` | サーバーポート（デフォルト: 3000） |
| `FRONTEND_URL` | フロントエンドURL（CORS設定） |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google サービスアカウントJSON |
| `GOOGLE_SPREADSHEET_ID` | Google SpreadsheetのID |
| `ADMIN_LINE_USER_IDS` | 管理者のLINEユーザーID（カンマ区切り） |
| `LIFF_ID` | Flex Message内のURL生成用 |

### フロントエンド

| 変数名 | 説明 |
|--------|------|
| `VITE_LIFF_ID` | LIFF アプリケーションID |
| `VITE_API_BASE_URL` | バックエンドAPIのURL |
| `VITE_MOCK_MODE` | モックモード（true/false） |

## 9. 主な設計特徴

- **ステートレスAPI**: 全データをGoogle Sheetsに保存、DBサーバー不要
- **サーバーレス対応**: Vercel Serverless Functionsとしてエクスポート可能
- **モバイル最適化**: LIFF UI、iOS WebKit対応、safe-area対応
- **Bot/Webhook不要**: shareTargetPickerを活用し、Messaging APIのBot設定不要
- **フルTypeScript**: フロントエンド・バックエンド両方で型安全
- **低コスト運用**: 無料枠での運用が可能（Vercel, Google Sheets API, LIFF, Render）
