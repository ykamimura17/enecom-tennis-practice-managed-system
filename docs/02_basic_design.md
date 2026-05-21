# 基本設計書: LINE 練習参加管理システム

## 1. システム構成

### 1.1 技術スタック

| レイヤー | 技術 | 備考 |
|----------|------|------|
| フロントエンド | React 18 + Vite + TypeScript | LINE LIFF SDK でプロフィール取得 |
| バックエンド | Node.js + Express + TypeScript | REST API サーバー |
| データストア | Google Sheets | `googleapis` パッケージで操作 |
| メッセージング | LIFF shareTargetPicker | 管理者が送信先グループを選択してFlex Messageをシェア |
| フロントエンドホスティング | Vercel | 静的配信 + HTTPS自動 |
| バックエンドホスティング | Render | Node.jsサービス + HTTPS自動 |

### 1.2 コンポーネント構成

```
┌─────────────────────────────────────────────────────┐
│                    クライアント                       │
│  LINE App → LIFF Browser                            │
└──────────┬────────────────────┬─────────────────────┘
           │ HTTPS GET          │ HTTPS + CORS
           ▼                    ▼
┌──────────────────┐  ┌──────────────────────────────┐
│  Vercel CDN      │  │  Backend API (Render)        │
│  LIFF Frontend   │  │  Express + TypeScript         │
│  React + Vite    │  │                               │
└──────────────────┘  └──────┬──────────────┬─────────┘
                             │              │
                    Sheets API│     Messaging│API
                             ▼              ▼
                  ┌──────────────┐  ┌──────────────┐
                  │Google Sheets │  │LINE Platform │
                  │practices     │  │Group Push    │
                  │attendance    │  │Flex Message  │
                  └──────────────┘  └──────────────┘
```

### 1.3 通信プロトコル

| 接続元 → 接続先 | プロトコル | 認証方式 |
|-----------------|-----------|----------|
| LIFF Browser → Vercel | HTTPS (GET) | なし（公開静的配信） |
| LIFF Browser → Backend API | HTTPS (REST) | CORS Origin検証 + x-line-user-id ヘッダー |
| Backend API → Google Sheets | HTTPS | サービスアカウント JWT |
| Backend API → LINE Platform | HTTPS | Channel Access Token |

## 2. データ設計

### 2.1 Google Sheets構成

1つのスプレッドシートに2つのシートを使用する。

#### practicesシート

| 列 | カラム名 | 型 | 説明 |
|----|---------|-----|------|
| A | id | string (UUID v4) | 練習の一意識別子 |
| B | title | string | 練習タイトル |
| C | date | string (YYYY-MM-DD) | 練習日 |
| D | time | string (HH:MM) | 開始時刻 |
| E | location | string | 場所 |
| F | description | string | 備考（任意） |
| G | createdAt | string (ISO 8601) | 作成日時 |
| H | status | string | `開催` / `雨天中止` / `中止`（デフォルト: `開催`） |

#### attendanceシート

| 列 | カラム名 | 型 | 説明 |
|----|---------|-----|------|
| A | id | string (UUID v4) | 出欠レコードの一意識別子 |
| B | practiceId | string | 対象の練習ID |
| C | lineUserId | string | LINEのUserID |
| D | displayName | string | LINEの表示名 |
| E | status | string | `参加` / `不参加` / `未回答` |
| F | updatedAt | string (ISO 8601) | 最終更新日時 |

### 2.2 データの一意性制約

- practicesシート: `id`列が一意
- attendanceシート: `practiceId` + `lineUserId` の組み合わせが一意（upsertで管理）

## 3. API設計

### 3.1 エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /health | なし | ヘルスチェック |
| GET | /api/me | x-line-user-id | ユーザー情報と管理者フラグを返す |
| GET | /api/practices | なし | 練習一覧を取得（日付昇順） |
| POST | /api/practices | 管理者のみ | 練習を作成 |
| PATCH | /api/practices/:id/status | 管理者のみ | 練習の開催状態を変更 |
| POST | /api/practices/:id/announce | 管理者のみ | 練習案内をLINEグループに送信 |
| GET | /api/attendance/:practiceId | なし | 指定練習の出欠一覧を取得 |
| POST | /api/attendance | なし | 出欠を登録・更新（upsert） |

### 3.2 リクエスト・レスポンス定義

#### GET /api/me

リクエストヘッダー:
```
x-line-user-id: U1234567890abcdef
```

レスポンス（200）:
```json
{
  "userId": "U1234567890abcdef",
  "isAdmin": true
}
```

#### GET /api/practices

レスポンス（200）:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "月例練習",
    "date": "2025-06-15",
    "time": "14:00",
    "location": "体育館A",
    "description": "シューズ持参",
    "createdAt": "2025-06-01T10:00:00.000Z",
    "status": "開催"
  }
]
```

#### POST /api/practices

リクエストヘッダー:
```
x-line-user-id: U1234567890abcdef（管理者のUserID）
```

リクエストボディ:
```json
{
  "title": "月例練習",
  "date": "2025-06-15",
  "time": "14:00",
  "location": "体育館A",
  "description": "シューズ持参"
}
```

バリデーション: `title`, `date`, `time`, `location` は必須。`description` は任意（デフォルト空文字列）。`status` は作成時に `開催` で固定。

レスポンス（201）:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "月例練習",
  "date": "2025-06-15",
  "time": "14:00",
  "location": "体育館A",
  "description": "シューズ持参",
  "createdAt": "2025-06-01T10:00:00.000Z",
  "status": "開催"
}
```

#### PATCH /api/practices/:id/status

リクエストヘッダー:
```
x-line-user-id: U1234567890abcdef（管理者のUserID）
```

リクエストボディ:
```json
{ "status": "雨天中止" }
```

バリデーション: `status` は `開催` / `雨天中止` / `中止` のいずれか。

レスポンス（200）: 更新後の Practice オブジェクト（GET /api/practices と同形式）

#### POST /api/practices/:id/announce

リクエストヘッダー:
```
x-line-user-id: U1234567890abcdef（管理者のUserID）
```

レスポンス（200）:
```json
{ "message": { "type": "flex", "altText": "...", "contents": { ... } } }
```

Flex Message の JSON を返す。フロントエンドが受け取り、`liff.shareTargetPicker([message])` でグループを選択して送信する。Messaging API チャネルは不要。

#### GET /api/attendance/:practiceId

レスポンス（200）:
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "practiceId": "550e8400-e29b-41d4-a716-446655440000",
    "lineUserId": "U9876543210abcdef",
    "displayName": "田中太郎",
    "status": "参加",
    "updatedAt": "2025-06-02T12:00:00.000Z"
  }
]
```

#### POST /api/attendance

リクエストボディ:
```json
{
  "practiceId": "550e8400-e29b-41d4-a716-446655440000",
  "lineUserId": "U9876543210abcdef",
  "displayName": "田中太郎",
  "status": "参加"
}
```

バリデーション: 全フィールド必須。`status` は `参加` / `不参加` / `未回答` のいずれか。

同一 `practiceId` + `lineUserId` の既存レコードがあればupdate、なければinsert。

レスポンス（200）:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "practiceId": "550e8400-e29b-41d4-a716-446655440000",
  "lineUserId": "U9876543210abcdef",
  "displayName": "田中太郎",
  "status": "参加",
  "updatedAt": "2025-06-02T12:00:00.000Z"
}
```

### 3.3 エラーレスポンス

全エラーは以下の形式:
```json
{ "error": "エラーメッセージ" }
```

| HTTPステータス | 用途 |
|---------------|------|
| 400 | バリデーションエラー（必須項目不足、不正なstatus値） |
| 403 | 管理者権限なし |
| 404 | 指定IDの練習が見つからない |
| 500 | サーバーエラー（Sheets API障害等） |

## 4. 画面設計

### 4.1 画面構成

LIFFアプリは1ページ構成で、タブで切り替える。ヘッダーには通知ベルアイコンを常時表示する。

| タブ | 表示条件 | 内容 |
|------|---------|------|
| 参加登録（メンバー向け） | 全ユーザー | 練習カード一覧 + 参加/不参加ボタン |
| 管理（管理者向け） | 管理者のみ表示 | 練習作成フォーム + 出欠集計 + LINE送信ボタン + 中止管理 |

### 4.2 メンバー画面

- 今後の練習を日付昇順でカード形式で表示
- 各カードに練習情報（タイトル、日時、場所、備考）を表示
- 中止（雨天中止・中止）の練習はバッジ表示し、参加/不参加ボタンを非表示にする
- 今後の練習の各カードに「参加」「不参加」ボタンを表示
- 現在の自分の回答状態をボタンのハイライトで表現
- ボタン押下でAPIコール → 即座にUI更新
- 過去の練習はセクションを分けて表示し、参加/不参加ボタンは非表示（回答状態のみ表示）
- 過去の練習は最初の10件を表示し、「もっと見る（残りN件）」ボタンで10件ずつ追加表示

### 4.3 管理画面

- 練習作成フォーム（タイトル、日付、時間、場所、備考）
- 作成済み練習の一覧（新しい順）
- 各練習の「LINE送信」ボタン（開催中のみ表示）
- 各練習の出欠集計（参加○人 / 不参加○人 / 未回答○人）
- 集計の詳細展開（メンバー名と回答状態の一覧）
- 各練習の中止管理:
  - 開催中 → 「中止にする」ボタンを押すと理由選択（「雨天中止」「その他の理由で中止」）がインライン展開
  - 中止中 → 中止種別バッジを表示し「開催に戻す」ボタンを表示

### 4.4 通知パネル

- ヘッダーの通知ベルアイコンをタップで開閉
- 未確認の練習がある場合、ベルアイコンに赤点を表示
- パネルには全練習を新しい作成日順で一覧表示
- 未確認の練習は背景色と赤点で区別
- パネルを開いた時点で全件既読扱い（localStorageに保存）
- 練習が新規作成されると赤点が復活

## 5. LINE Flex Message設計

### 5.1 メッセージ構成

Bubble型のFlex Messageを使用する。

| セクション | 内容 |
|-----------|------|
| header | 緑背景(#06C755)に「📣 練習案内」+タイトル（白文字） |
| body | 📅 日時 / 📍 場所 / 備考テキスト |
| footer | 「参加・不参加を登録する」URIアクションボタン（緑、LIFFアプリへのリンク） |

### 5.2 LIFFリンク

`https://liff.line.me/{LIFF_ID}?practiceId={practiceId}`

practiceIdをクエリパラメータで渡すことで、該当練習へのスクロールや直接表示が可能（将来拡張）。

## 6. 認証・認可設計

### 6.1 管理者認証

- 環境変数`ADMIN_LINE_USER_IDS`にカンマ区切りでLINE UserIDを設定
- バックエンドのミドルウェアでリクエストヘッダー`x-line-user-id`の値をチェック
- 管理者専用エンドポイント（POST /api/practices, PATCH /api/practices/:id/status, POST /api/practices/:id/announce）にミドルウェアを適用

### 6.2 セキュリティ上の注意（既知の制限）

現在の実装では`x-line-user-id`ヘッダーはクライアントからの自己申告値であり、なりすましが可能。本番運用では以下の対応を推奨する:

- LIFFの`liff.getIDToken()`で取得したIDトークンをAuthorizationヘッダーで送信
- バックエンドでLINE APIを用いてIDトークンを検証
- 検証済みのUserIDを使用して認可判定

### 6.3 CORS設定

- `FRONTEND_URL`環境変数で許可するOriginを指定
- 未設定時はワイルドカード`*`（開発用）
- 本番では必ずフロントエンドのデプロイURL（例: `https://your-app.vercel.app`）を設定

## 7. 開発環境

### 7.1 devcontainer構成

- ベースイメージ: `node:20-bullseye`
- docker-compose.yml でサービス定義
- ポートフォワード: 3000（バックエンド）, 5173（フロントエンド）
- postCreateCommand で `npm install` を自動実行
- VSCode拡張: ESLint, Prettier, TypeScript, Tailwind CSS

### 7.2 環境変数

`.env.example`をコピーして`.env`を作成し、以下を設定する。

| 変数名 | 用途 | 例 |
|--------|------|-----|
| PORT | バックエンドポート | 3000 |
| FRONTEND_URL | CORS許可Origin | http://localhost:5173 |
| GOOGLE_SERVICE_ACCOUNT_JSON | サービスアカウントのJSON（1行） | {"type":"service_account",...} |
| GOOGLE_SPREADSHEET_ID | スプレッドシートのID | 1AbCdEfGhIjKlMnOpQrStUvWxYz |
| ADMIN_LINE_USER_IDS | 管理者のUserID（カンマ区切り） | U1234567890,Uabcdef123 |
| VITE_LIFF_ID | LIFFアプリのID | 1234567890-abcdefgh |
| VITE_API_BASE_URL | バックエンドのURL | http://localhost:3000 |

## 8. デプロイ設計

### 8.1 デプロイ順序

1. フロントエンドをVercelにデプロイ → URLが発行される
2. バックエンドの`.env`に`FRONTEND_URL`としてVercelのURLを設定
3. バックエンドをRenderにデプロイ → URLが発行される
4. フロントエンドの`.env`に`VITE_API_BASE_URL`としてRenderのURLを設定 → 再デプロイ
5. LINE Developer ConsoleのLIFFエンドポイントURLにVercelのURLを設定

### 8.2 URL対応表（本番）

| 設定箇所 | 値 |
|---------|-----|
| Vercel デプロイURL | https://your-app.vercel.app |
| Render デプロイURL | https://your-api.onrender.com |
| FRONTEND_URL（バックエンド.env） | https://your-app.vercel.app |
| VITE_API_BASE_URL（フロントエンド.env） | https://your-api.onrender.com |
| LIFF エンドポイントURL（LINE Console） | https://your-app.vercel.app |
