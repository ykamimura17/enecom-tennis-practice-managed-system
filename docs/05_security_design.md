# セキュリティ設計書: LINE 練習参加管理システム

## 1. 目的と位置付け

### 1.1 目的

LINE LIFF、Express API、Google Sheetsからなる練習管理システムの情報資産、認証・認可、実装・運用上の防御要件を定義する。基準はOWASP Top 10:2025とし、具体的な検証観点にはOWASP ASVSを参照する。

### 1.2 対象範囲・状態

- 対象: `frontend/`、`backend/`、Google Sheets連携、LINE LIFF、Vercel、GitHub Actionsおよびソフトウェア依存関係
- 対象データ: LINE UserID、表示名、出欠、配車希望、来場実績、練習予定、サービスアカウント資格情報
- 本書は**目標設計**であり、記載された対策が導入済みであることを意味しない。
- 現行の設計根拠はソースコードと既存設計書。VercelやLINEの本番設定・稼働状況は別途確認する。
- 一般ユーザーへの出欠一覧公開と管理者操作の分離はPR #2で提案中。**masterへ反映済みと扱わない**。

### 1.3 参照文書

- [要件定義書](01_requirements.md)、[基本設計書](02_basic_design.md)、[詳細設計書](03_detailed_design.md)
- [テスト設計書](06_test_design.md)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)

## 2. 保護資産と信頼境界

| 対象 | 主なリスク | 保護方針 |
|---|---|---|
| LINE IDトークン / LINE UserID | なりすまし、別人の出欠変更 | サーバー側トークン検証、本人IDのみ信頼 |
| 管理者権限 | 練習変更・来場操作の不正実行 | API側の認可を必須化 |
| 出欠・配車・来場情報 | 不要な公開、改ざん | 認証済み部員への最小限の閲覧、書込権限の分離 |
| Google Sheets | データ消去、重複更新、式注入 | 入力検証、最小権限、同時更新対策 |
| サービスアカウント鍵 | 外部への漏えい | Gitへコミットしない、デプロイ環境のSecretとして保存 |
| デプロイ・CI | サプライチェーン侵害 | GitHub Actions権限最小化、PR保護、依存関係検査 |

信頼境界は「LIFFブラウザ → Express API → Google Sheets / LINE Platform」。フロントエンドの表示制限、CORS、UserIDヘッダーだけではAPIの認可にならない。

## 3. 認証・認可の目標設計

### 3.1 認証

1. LIFFで取得した有効なLINE IDトークンをAPIに `Authorization: Bearer <ID_TOKEN>` として送る。
2. バックエンドで署名、有効期限、発行元、チャネルのAudience等をLINEの仕様に従って検証する。検証済みの `sub` をユーザーIDとして採用する。
3. 無効・期限切れ・未提示トークンは401で拒否し、処理対象のSheetsデータを変更しない。
4. クライアント申告の `x-line-user-id` やリクエスト本文の `lineUserId` を本人確認に使用しない。
5. 本番トークン、サービスアカウント鍵、管理者一覧をログに出さない。

**既知の未対応事項:** 現行実装は `x-line-user-id` ヘッダーを自己申告させ、管理者チェックに使用している。出欠登録も本文のUserIDを信頼している。認証改修が完了するまで、これらを重大な残存リスクとして扱う。

### 3.2 役割別アクセス権

| 操作 | 一般ユーザー（認証済み） | 管理者（認証済み） |
|---|---|---|
| 練習一覧・自分の出欠登録変更 | 許可（自分のみ更新） | 許可 |
| 部員の出欠・配車希望の閲覧 | 許可（許可済みメンバー範囲） | 許可 |
| 来場実績の閲覧 | 禁止 | 許可 |
| 練習追加・編集・開催状態変更 | 禁止 | 許可 |
| LINE案内データ生成 | 禁止 | 許可 |
| 来場実績の変更 | 禁止 | 許可 |

- 管理権限はサーバーが検証済みUserIDと `ADMIN_LINE_USER_IDS` から判定する。
- API拒否は403（本人認証は成功しているが操作権限なし）。未認証は401。
- `GET /api/attendance/:practiceId` では一般ユーザーへの来場実績や不必要な識別子の露出を避ける。公開範囲・会員判定の要件を確定する。
- UIで非表示にするだけでなく、POST/PUT/PATCHをサーバー側で認可する。
- LINEへの実際のシェアはユーザー操作による `liff.shareTargetPicker`。サーバーAPIはメッセージ生成を管理者のみに許す。

## 4. API・入力データ・エラー処理

### 4.1 入力検証

- `title`、`date`、`time`、`endTime`、`location`、`description`、`status`、`carpool`、`actual` を型・長さ・形式・列挙値で検証する。
- 追加・編集時は日付/時刻の存在や順序、空文字・過大ペイロードを拒否する。
- Google Sheetsに保存するユーザー入力は式として解釈されない形で書き込む。現行の `valueInputOption: 'RAW'` を保ち、将来の変更も検査対象とする。
- レスポンスの機微情報・スタックトレースを最小化し、内部例外は利用者向けに汎用エラーへ変換する。

### 4.2 データ整合性

- 出欠更新は検証済み本人のレコードに限定する。管理者の来場操作は別APIとする。
- 同時更新で `practiceId + lineUserId` の重複が生じないか検証する。Google Sheetsの読み取り→書き込みによる競合をリスクとして記録する。
- 中止済み練習や過去の練習の更新可否は業務ルールに従ってサーバー側でも判定する。

### 4.3 運用設定

- Vercelの本番環境変数に秘密情報を格納し、Preview/CIに本番秘密鍵を与えない。
- `FRONTEND_URL` を本番で明示しCORSのワイルドカードを避ける。ただしCORSは認証の代替ではない。
- HTTPSを前提にし、セキュリティヘッダー、依存関係、公開ファイル、ログ保持を定期確認する。
- GitHubの `GITHUB_TOKEN` はジョブ単位で必要最小権限とし、外部Actionsは検証済みSHAへ固定する。
- GitHub-hosted Ubuntu標準Runnerを用い、未信頼PRにデプロイ用Secretを渡さない。

## 5. OWASP Top 10:2025 対応表

| 分類 | 設計上の対策 | 主な検証 |
|---|---|---|
| A01 Broken Access Control | サーバー側ロール認可、所有者検証 | 一般/管理者のAPIテスト |
| A02 Security Misconfiguration | CORS、ヘッダー、秘密情報、最小権限 | 設定レビュー、ZAP |
| A03 Software Supply Chain Failures | lockfile、Dependabot、Actionsの固定 | npm audit、SCA |
| A04 Cryptographic Failures | HTTPS、トークンと鍵の安全な保管 | 設定確認、秘密情報検査 |
| A05 Injection | 入力検証、Sheets式注入対策 | CodeQL/Semgrep、悪意入力テスト |
| A06 Insecure Design | 権限境界、会員限定公開、競合設計 | 仕様レビュー、業務ルールテスト |
| A07 Authentication Failures | LINE IDトークンのサーバー検証 | 偽造・期限切れトークン試験 |
| A08 Software or Data Integrity Failures | 更新者検証、依存関係・CI保護 | 改ざん・整合性テスト |
| A09 Security Logging and Alerting Failures | 異常操作の安全な記録と通知 | ログ試験・運用確認 |
| A10 Mishandling of Exceptional Conditions | 安全な例外処理、外部障害対応 | 異常系・タイムアウト試験 |

Top 10はリスク分類であり、表のテストを実施しただけで完全な適合や脆弱性ゼロは証明されない。

## 6. リスク評価と対応順序

| ID | リスク（現状・要検証を含む） | 初期優先度 | 方針 |
|---|---|---|---|
| SEC-01 | 自己申告UserIDによる管理者なりすまし | Critical | LINE IDトークン検証へ移行 |
| SEC-02 | 他人の出欠情報を代理登録可能 | Critical | トークンの `sub` に更新者を固定 |
| SEC-03 | 出欠・配車情報の無認証公開可能性 | High | 認証・会員境界と応答フィールドを見直す |
| SEC-04 | CORS未設定時の `*` 許可 | Medium | 本番設定を検証 |
| SEC-05 | 同時更新による重複・上書き | Medium | 再現テストと更新方式の見直し |
| SEC-06 | 公開リポジトリ内の環境設定ファイル | High（内容確認要） | 公開値と秘密情報の棚卸し、漏えい時のローテーション |

優先度は初期評価であり、監査の証拠に基づいて更新する。重大な既知問題をCIの例外設定で恒久的に無視しない。

## 7. 導入計画と受入基準

1. Phase 1: GitHub Actionsでフロント・バックのビルドとVitestをPRごとに実行。
2. Phase 2: OpenAPI仕様書、無料のRedocly CLI、独自Rulesetで仕様検査。
3. Phase 3: CodeQL、Semgrep、npm audit、Gitleaks、認証・認可テストを導入。
4. Phase 4: 隔離テスト環境でOWASP ZAPを稼働。最初は定期・手動、安定後にPR必須化。
5. Phase 5: GitHub Rulesetに必須チェックを設定し、Dependabotと継続運用を開始。

受入条件: 管理者APIの401/403テスト、他人の出欠更新拒否、重大脆弱性の検出・修正、Secret非公開、PRチェックの実行実績を確認すること。設定制限や未解決事項は残存リスクとして記録する。詳細は[テスト設計書](06_test_design.md)を参照する。
