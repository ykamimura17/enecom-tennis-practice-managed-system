# セットアップ手順書: LINE 練習参加管理システム

## 1. Google Cloud セットアップ

### 1.1 プロジェクト作成（済）

Google Cloud Console（https://console.cloud.google.com）でプロジェクトを作成する。

### 1.2 Google Sheets API 有効化（済）

APIs & Services → Library → 「Google Sheets API」を検索して有効化する。

### 1.3 サービスアカウント作成

1. APIs & Services → Credentials → 「Create Credentials」→「Service Account」
2. サービスアカウント名を入力（例: `practice-manager`）
3. 作成後、サービスアカウントの詳細ページを開く
4. 「Keys」タブ → 「Add Key」→「Create new key」→ JSON形式でダウンロード
5. ダウンロードしたJSONファイルを1行に変換する:

```bash
cat ~/Downloads/key.json | tr -d '\n'
```

この出力値を `.env` の `GOOGLE_SERVICE_ACCOUNT_JSON` に設定する。

### 1.4 スプレッドシート作成

1. Google Sheets（https://sheets.google.com）で新規スプレッドシートを作成
2. デフォルトのシート名を `practices` に変更
3. 左下の「+」ボタンで2つ目のシートを追加し、名前を `attendance` にする
4. URLからスプレッドシートIDを取得する:

```
https://docs.google.com/spreadsheets/d/{この部分がID}/edit
```

このIDを `.env` の `GOOGLE_SPREADSHEET_ID` に設定する。

### 1.5 スプレッドシートの共有

1. スプレッドシートの「共有」ボタンをクリック
2. サービスアカウントのメールアドレスを入力（JSONファイル内の `client_email` の値）
3. 権限を「編集者」に設定して共有

## 2. LINE Developer Console セットアップ

### 2.1 プロバイダー作成

LINE Developers Console（https://developers.line.biz/console/）でプロバイダーを作成する（未作成の場合）。

### 2.2 LINE Loginチャネル作成 + LIFF追加

> **Messaging API チャネルは不要です。** 練習案内は `liff.shareTargetPicker()` で送信します。

1. 同じプロバイダー内で「Create a new channel」→「LINE Login」を選択
2. チャネル名・説明を入力して作成
3. 「LIFF」タブ → 「Add」ボタン
4. 設定:
   - Size: `Full`
   - Endpoint URL: フロントエンドのデプロイURL（Vercelデプロイ後に設定）
   - Scope: `profile` にチェック
5. 作成後に表示される「LIFF ID」を `.env` の `VITE_LIFF_ID` に設定

### 2.3 shareTargetPicker の有効化

LIFFアプリ設定画面で **「Share target picker」** をオンにする。  
これにより管理者がLINEアプリ内でグループを選んでFlex Messageを送信できるようになる。

### 2.4 管理者UserIDの取得

管理者のLINE UserIDはLIFF経由で取得できる:

1. LIFFアプリを管理者のLINEアカウントで開く
2. `liff.getProfile()` の結果に含まれる `userId` をコンソールログで確認
3. または、バックエンドの `/api/me` エンドポイントにアクセスして確認

取得した UserID を `.env` の `ADMIN_LINE_USER_IDS` に設定する（複数の場合はカンマ区切り）。

## 3. ローカル開発環境セットアップ

### 3.1 リポジトリクローン

```bash
git clone <リポジトリURL>
cd line-practice-manager
```

### 3.2 環境変数の設定

```bash
cp .env.example .env
# .env を編集して各値を設定
```

### 3.3 devcontainerで開く場合

VSCode で「Reopen in Container」を選択すると、docker-compose.yml に基づいてコンテナが起動し、`postCreateCommand` で `npm install` が自動実行される。

### 3.4 devcontainerを使わない場合

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3.5 起動

ターミナル1（バックエンド）:
```bash
cd backend
npm run dev
# → http://localhost:3000 で起動
```

ターミナル2（フロントエンド）:
```bash
cd frontend
npm run dev
# → http://localhost:5173 で起動
```

### 3.6 動作確認（バックエンド単体）

LIFF環境外でもAPIは直接叩ける:

```bash
# ヘルスチェック
curl http://localhost:3000/health

# 練習一覧取得
curl http://localhost:3000/api/practices

# 練習作成（管理者として）
curl -X POST http://localhost:3000/api/practices \
  -H "Content-Type: application/json" \
  -H "x-line-user-id: YOUR_ADMIN_USER_ID" \
  -d '{"title":"テスト練習","date":"2025-07-01","time":"14:00","location":"体育館"}'

# 出欠登録
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"practiceId":"PRACTICE_ID","lineUserId":"TEST_USER","displayName":"テスト太郎","status":"参加"}'
```

## 4. デプロイ手順

### 4.1 フロントエンド（Vercel）

1. Vercel（https://vercel.com）にGitHubリポジトリを接続
2. Root Directory を `frontend` に設定
3. 環境変数を設定:
   - `VITE_LIFF_ID`: LIFFアプリのID
   - `VITE_API_BASE_URL`: バックエンドのRender URL（後で設定、一旦ダミーでデプロイ）
4. デプロイ → URLが発行される（例: `https://your-app.vercel.app`）

### 4.2 バックエンド（Render）

1. Render（https://render.com）にGitHubリポジトリを接続
2. Service Type: Web Service
3. Root Directory: `backend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. 環境変数を全て設定（.env.exampleの内容）
7. `FRONTEND_URL` にVercelのURLを設定
8. デプロイ → URLが発行される（例: `https://your-api.onrender.com`）

### 4.3 フロントエンド再デプロイ

1. Vercelの環境変数 `VITE_API_BASE_URL` をRenderのURLに更新
2. 再デプロイ

### 4.4 LIFF エンドポイント設定

1. LINE Developer Console → LINE Loginチャネル → LIFFタブ
2. Endpoint URL を VercelのURL（例: `https://your-app.vercel.app`）に設定

### 4.5 動作確認

1. LINEアプリでLIFF URLを開く: `https://liff.line.me/{LIFF_ID}`
2. メンバー画面が表示されることを確認
3. 管理者アカウントで開いた場合、「管理」タブが表示されることを確認
4. 練習作成 → LINE送信 → メンバーが参加登録 の一連のフローを確認
