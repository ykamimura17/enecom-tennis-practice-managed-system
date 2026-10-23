# Issue作成からdev向けPR作成までの自動化

## 動作

書き込み権限を持つ人がIssueを新規作成すると、GitHub ActionsがCodexを実行する。
`dev` のスナップショットから修正を生成し、別のクリーンなrunnerでbackendのビルド・テストとfrontendのビルドを実行する。
成功した変更のみ `automation/issue-<番号>` にpushし、`dev` 向けPRを作成する。
自動マージ・mainへのpush・本番デプロイは行わない。

## 初回セットアップ

1. `dev` を用意し、この変更をレビューする。
2. `.github/workflows/issue-autofix.yml` をGitHubの**デフォルトブランチにも反映する**。
   `issues` イベントはデフォルトブランチにworkflowがないと起動しない。
   現在は `master` がデフォルト。`main` 移行時はworkflowとGitHub設定を揃える。
   本番ブランチへの反映はVercelのリリースタイミングに合わせて行う。
3. Repository Settings → Secrets and variables → Actions に `OPENAI_API_KEY` を登録する。
   キーはチャットやIssueへ記載しない。OpenAI API利用料金とActions利用枠が必要。
   Codexのモデルは公式Actionの既定値を利用する。必要に応じworkflowのmodel入力で固定する。
4. Settings → Actions → General で「Allow GitHub Actions to create and approve pull requests」を有効にする。
   組織ポリシーがある場合はその設定も確認する。
5. Vercelで `dev`・`automation/*`・作業PRの不要なPreviewデプロイを止める。
   ブランチを分けるだけではPreviewデプロイを抑止できない。
6. 小さい修正Issueを作り、生成・検証・PR作成までを実機確認する。

## 制約と運用

- 公開Issueからの無制限な実行を防ぐため、投稿者の関連性と実際のwrite権限を確認する。
- Issue編集・コメント・再オープンでは開始しない。失敗時はActions画面から再実行できる。
- 生成段階のGitHub権限はreadのみ。APIキーは公式Actionにのみ渡し、push用資格情報をcheckoutに保存しない。
- PR作成は別runnerに分離し、生成コードやテストをwrite権限で実行しない。
- 自動修正対象は `backend/src/`・`frontend/src/`・`docs/` の通常ファイル。
  依存関係・workflow・設定・秘密情報を伴う変更は人が対応する。
- 修正なし・要件不明ではPRを作らず、結果をActionsのartifactに保存する。
  生成失敗・テスト失敗では実行ログを確認する。タイムアウトは生成30分・検証15分。
- 再実行時に既存ブランチと異なる修正が生成された場合、強制pushせず失敗する。
  既存PR・ブランチを確認してから手動で整理する。
- `dev` が進んだ場合はPRの最新CI・競合状況を確認し、人がレビューしてマージする。
- `GITHUB_TOKEN` で作ったPRでは通常CIに承認が必要になる場合がある。
  このworkflow内の検証はPR作成前に必ず実行する。通常CIが自動完了したとは扱わない。
- `dev` 統合後、リリース単位で `dev` → `main` のPRを作り、本番反映する。

参考: https://learn.chatgpt.com/docs/github-action
 / https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues
