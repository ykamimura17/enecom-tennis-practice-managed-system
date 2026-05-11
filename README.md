# LINE 練習管理アプリ

LINE LIFF + Google Sheets で練習案内・参加可否を管理するアプリです。

## 構成

```
line-practice-manager/
├── backend/      Node.js + Express + TypeScript
└── frontend/     React + Vite + LIFF SDK
```

---

## セットアップ

### 1. LINE Developer Console

1. [LINE Developers](https://developers.line.biz/) でプロバイダーを作成
2. **Messaging API チャネル** を作成 → チャネルアクセストークン（長期）を発行
3. **LINE Login チャネル** を作成 → LIFF アプリを追加
   - エンドポイント URL: `https://your-frontend-url.com`（本番デプロイ後に設定）
   - LIFF ID を控えておく

### 2. Google Cloud / Sheets

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. **Google Sheets API** を有効化
3. **サービスアカウント** を作成し JSON キーをダウンロード
4. Google Spreadsheet を新規作成し、以下の2シートを作成：
   - `practices`
   - `attendance`
5. スプレッドシートをサービスアカウントのメールアドレスと共有（編集者権限）

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集して各値を入力：

| 変数 | 説明 |
|------|------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | サービスアカウント JSON の中身をそのまま1行で |
| `GOOGLE_SPREADSHEET_ID` | スプレッドシートのURL中の `...spreadsheets/d/{ここ}/edit` |
| `LINE_CHANNEL_ACCESS_TOKEN` | Messaging API のチャネルアクセストークン |
| `LINE_GROUP_ID` | 案内を送るLINEグループのID（Webhookログで確認） |
| `ADMIN_LINE_USER_IDS` | 管理者のLINE UserID（カンマ区切り）|
| `VITE_LIFF_ID` | LIFF アプリのID |
| `VITE_API_BASE_URL` | バックエンドのURL |

> **LINEグループIDの確認方法**: Messaging API の Webhook URLにサーバーを立ち上げた状態でグループにBotを招待してメッセージを送ると、Webhook のログで `source.groupId` が確認できます。

> **管理者UserIDの確認方法**: LINEログインしたユーザーのプロフィール取得APIで `userId` が確認できます。

---

## 起動

```bash
# devcontainer を開いた後
cd backend && npm run dev   # :3000
cd frontend && npm run dev  # :5173
```

---

## データフロー

```
メンバー
  └── LIFF を開く → 練習一覧表示 → 参加/不参加をタップ
        └── POST /api/attendance → Google Sheets に記録

管理者
  └── 管理タブ → 練習を追加 → POST /api/practices → Sheets に記録
  └── 「LINEグループに案内を送る」 → POST /api/practices/:id/announce
        └── LINE Flex Message でグループに送信（LIFF リンク付き）
```

---

## デプロイ

- **Backend**: Railway / Render / Cloud Run など
- **Frontend**: Vercel / Netlify（Vite ビルド成果物）
- デプロイ後、LIFF アプリのエンドポイント URL を本番URLに更新してください
