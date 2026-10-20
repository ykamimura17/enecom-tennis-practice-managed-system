# テスト設計書: LINE 練習参加管理システム

## 1. 目的と対象

### 1.1 目的

Pull Requestの作成・更新時にGitHub Actionsで品質・セキュリティ検査を自動実行し、OWASP Top 10:2025に関連する不備を早期に発見する。実装と仕様を同時に検証し、不合格PRの `master` へのマージを制御する。

### 1.2 前提・実施状況

- Publicリポジトリ、GitHub-hostedのUbuntu標準Runner、対象ブランチ `master` を使用する。
- 現行コードにVitest/Supertestのテストは存在するが、ここで定義するCI全体は**導入計画**であり、実行済みを意味しない。
- 一般ユーザー向け出欠閲覧変更はPR #2で提案中。仕様・テストはPR #2を含めて確認する。
- LINE認証のトークン検証は未実装。トークン検証テストは改修と同時に導入する。
- 本番Google Sheets、実際のLINE送信、本番環境への侵襲的な診断はCIでは実行しない。

### 1.3 参照文書

- [セキュリティ設計書](05_security_design.md)
- [基本設計書](02_basic_design.md)、[詳細設計書](03_detailed_design.md)

## 2. テストレベルとツール

| テスト | ツール | 目的 | 実行契機 |
|---|---|---|---|
| ビルド・型検査 | TypeScript、Vite | コンパイルとビルド検証 | 毎PR |
| 単体・API | Vitest、Supertest | 認証・認可、業務ルール、異常系 | 毎PR |
| OpenAPI Lint | 無料のRedocly CLI | OpenAPI記法、認証要件、入力制約 | 毎PR |
| SAST | CodeQL、Semgrep OSS | ソースコードの危険な処理 | 毎PR |
| SCA | `npm audit` | 既知の脆弱な依存関係 | 毎PR |
| Secret検出 | Gitleaks OSS | 秘密鍵・トークンの混入 | 毎PR |
| DAST | OWASP ZAP Baseline/API Scan | 実行中のアプリの設定・動作 | 当初は手動・定期 |
| 定期更新 | Dependabot | 依存パッケージ更新PR | 定期 |

OpenAPI Lintは**仕様書の検査**であり、API認可の実効性を保証しない。CodeQL等も全脆弱性を検出できるわけではなく、権限テストと人手レビューを組み合わせる。

## 3. GitHub Actions設計

### 3.1 トリガーとRunner

- `pull_request`: `master` 向けPRの `opened`、`synchronize`、`reopened`（必要に応じ `ready_for_review`）。
- `push`: `master` 反映後の再検査。
- `workflow_dispatch`: 管理者が手動実行。
- `schedule`: 依存関係・DASTの週次確認（別ジョブ）。
- Runner: `ubuntu-latest`。Node.jsはプロジェクト互換性を検証してLTSの特定メジャーに固定する。
- CIは `permissions: contents: read` を既定とし、Code Scanningアップロード等が必要なジョブのみ個別に権限を追加。
- 未信頼PRのコードを実行するジョブで `pull_request_target` を使わず、デプロイSecretを渡さない。

### 3.2 ワークフロー構成（予定）

```text
.github/
├── workflows/
│   ├── ci.yml                 # frontend/backendビルド・テスト
│   ├── security.yml           # SAST/SCA/Secretスキャン
│   ├── openapi-lint.yml       # Redocly CLI
│   └── zap.yml                # 隔離環境へのDAST
├── dependabot.yml
└── security/
    ├── semgrep.yml
    └── zap-rules.tsv
docs/
└── openapi.yaml
redocly.yaml
backend/src/__tests__/security/
    ├── authentication.test.ts
    ├── authorization.test.ts
    ├── injection.test.ts
    └── error-handling.test.ts
```

### 3.3 ジョブ定義

| ジョブ | 入力・処理 | 合格条件 |
|---|---|---|
| frontend-build | `frontend/package-lock.json` → `npm ci`、`npm run build` | 終了コード0 |
| backend-test | `backend/package-lock.json` → `npm ci`、`npm run build`、`npm test` | 終了コード0 |
| openapi-lint | `docs/openapi.yaml` → Redocly CLI lint | errorが0件 |
| codeql / semgrep | TypeScript/JavaScriptの静的解析 | 運用で定めた重大度以上の新規検出がない |
| dependency-audit | frontend/backendで `npm audit --audit-level=high` | High/Criticalを解消または期限付き例外管理 |
| secret-scan | コミット差分にGitleaks | 検出0件 |
| zap | モック・隔離環境のURL | 重大な検出なし、偽陽性は根拠付き管理 |

すべてのJobに適切なtimeoutを設定し、依存バージョンやGitHub Actionsを検証済みバージョン/コミットSHAに固定する。生成したレポートは機密情報を含まないよう加工してArtifactとして保存する。

## 4. 権限・セキュリティテストケース

**期待結果は目標仕様**であり、現行実装がすべて満たすとは限らない。認証改修前に失敗するケースは欠陥として可視化する。

| ID | 対象 | 入力・操作 | 期待結果 | OWASP |
|---|---|---|---|---|
| SEC-T01 | GET /api/attendance/:practiceId | 認証なし | 401、個人情報非公開 | A01/A07 |
| SEC-T02 | GET /api/attendance/:practiceId | 認証済み一般部員 | 許可した氏名・出欠・配車のみ返却、来場は非公開 | A01/A06 |
| SEC-T03 | POST /api/practices | 一般部員 | 403、Sheets書込なし | A01 |
| SEC-T04 | PUT /api/practices/:id | 一般部員 | 403、更新なし | A01 |
| SEC-T05 | PATCH /api/practices/:id/status | 一般部員 | 403、更新なし | A01 |
| SEC-T06 | POST /api/practices/:id/announce | 一般部員 | 403、案内生成なし | A01 |
| SEC-T07 | PATCH /api/attendance/:id/actual | 一般部員 | 403、来場更新なし | A01 |
| SEC-T08 | POST /api/attendance | 本文に別人のUserID | 403または本人IDへ強制、他人は更新なし | A01/A08 |
| SEC-T09 | 認証ミドルウェア | 偽造・期限切れLINE IDトークン | 401 | A07 |
| SEC-T10 | 管理者API | 正しい管理者トークン | 妥当入力なら成功 | A01/A07 |
| SEC-T11 | 練習作成・編集 | 必須値なし、長過ぎる値、不正日付 | 400、データ未変更 | A05/A10 |
| SEC-T12 | Sheets書込 | `=...` 等の数式型入力 | 式として実行されない | A05 |
| SEC-T13 | API例外処理 | Sheets APIタイムアウト/障害 | 定義済み5xx、内部情報非公開 | A10 |
| SEC-T14 | 出欠更新 | 同時に同一ユーザーの登録 | 一意性と最終状態の整合性維持 | A06/A08 |
| SEC-T15 | ログ | 認証失敗・認可拒否 | 監査可能でSecret非表示 | A09 |
| SEC-T16 | 管理画面UI | 一般部員ログイン | 出欠一覧と配車は見えるが編集/中止/LINE/来場操作は非表示 | A01 |
| SEC-T17 | 管理画面UI | 管理者ログイン | 管理操作を表示しAPIでも認可 | A01 |

## 5. テストデータ・モック方針

- モックLINEユーザー: 管理者、一般部員A、一般部員B、無効トークンの4種を用意し、実ユーザーIDを使用しない。
- Google Sheets APIはテストダブル化し、呼び出し回数と書込内容をアサートする。
- `ADMIN_LINE_USER_IDS` 等にはダミー値を用い、CIに本番サービスアカウント鍵を渡さない。
- APIテストでは許可時の200だけでなく、拒否時の401/403と「副作用なし」を確認する。
- ZAPはステージング相当の分離環境（ダミーGoogle Sheets / LINEモック）に限定する。Previewデプロイに本番シークレットを共有しない。
- マージ後も実環境への破壊的テストは実施しない。

## 6. 判定基準・例外管理

### 6.1 初期の必須チェック

- frontend-build、backend-test、openapi-lint、secret-scanを必須にする。
- CodeQL・Semgrep・npm auditは初回の検出を棚卸しして、High/Criticalの新規検出を必須ブロック対象へ移行する。
- ZAPは安定稼働まで参考ジョブとし、偽陽性・接続失敗への対応後に必須化する。
- GitHub Ruleset/Branch Protectionの可用性は利用プランとリポジトリ設定で確認し、必須Status Checksと管理者のバイパス制限を適用する。

### 6.2 例外管理

例外には「検出ID・理由・担当者・有効期限・代替策・承認記録」を残す。認証回避や他人のデータ改ざんなどの重大欠陥は、長期の無条件除外をしない。テスト未実施は合格とは扱わない。

## 7. フェーズ別の実装と完了条件

| Phase | 作業 | 完了条件 |
|---|---|---|
| 1 | GitHub Actionsで両アプリのビルド、Vitest/Supertest | PRで自動実行され合否が表示される |
| 2 | OpenAPI文書とRedocly CLI / Ruleset | API定義に意図的な違反を入れるとCIが失敗する |
| 3 | CodeQL、Semgrep、npm audit、Gitleaks、認証テスト | 重大違反が検出・ブロックされる |
| 4 | ZAP Baseline/API Scan | 隔離テスト環境で安定実行、結果保存 |
| 5 | GitHub Ruleset、Dependabot、定期実行 | 必須検査の失敗PRがマージ不可であると確認 |

## 8. レポートと保守

PRにはジョブ単位のPass/Failを表示し、必要に応じSARIF等を連携する。各検出にはファイル・位置・重要度・修正方法を残し、月次でルールの有効性と残存リスクをレビューする。導入時のテストケースと脆弱性分類は[セキュリティ設計書](05_security_design.md)に整合させる。
