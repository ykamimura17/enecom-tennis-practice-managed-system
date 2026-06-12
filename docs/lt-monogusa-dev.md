---
marp: true
theme: uncover
paginate: true
size: 16:9
style: |
  section {
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif;
    background-color: #1a1a2e;
    color: #e0e0e0;
  }
  section h1 {
    color: #ffffff;
  }
  section h2 {
    color: #a0a0b8;
    font-weight: 400;
  }
  section.lead {
    text-align: center;
    background-color: #1a1a2e;
  }
  section.lead h1 {
    font-size: 2.6em;
    color: #ffffff;
  }
  section.accent {
    background-color: #16213e;
  }
  section.green {
    background-color: #06C755;
    color: #ffffff;
  }
  section.green h1,
  section.green h2 {
    color: #ffffff;
  }
  table {
    font-size: 0.78em;
    margin: 0 auto;
    color: #e0e0e0;
    border-collapse: collapse;
  }
  table th {
    background-color: #16213e;
    color: #ffffff;
    padding: 8px 16px;
  }
  table td {
    padding: 8px 16px;
    border-bottom: 1px solid #2a2a4a;
  }
  pre {
    font-size: 0.72em;
    background-color: #0f0f23;
    border: 1px solid #2a2a4a;
    color: #c0c0d0;
  }
  blockquote {
    border-left: 4px solid #06C755;
    color: #a0a0b8;
    font-style: italic;
  }
  strong {
    color: #ffffff;
  }
  a {
    color: #06C755;
  }
---

<!-- _class: lead -->

# ものぐさ開発環境

## 寝ながらアプリを作る方法

<br>

名前 / 所属
2026年X月X日

---

# これが今の開発環境です

<!-- 下記パスに画像を配置してコメントを外してください -->
<!-- ![bg right:50% w:90%](./images/lying-down-smartphone.png) -->

<br><br><br>

ベッドの上で、スマホ1台。

**これだけです。**

---

<!-- _class: lead -->

# スマホがあれば
# アプリは作れる

<br>

**Claude Code** と **GitHub** の連携で
コーディングからデプロイまで PC 不要

---

<!-- _class: accent -->

# Claude Code (Web)

ブラウザだけで動く AI ペアプログラミング環境

<br>

- 会話で指示するだけでコードを自動生成・編集
- ファイル作成からディレクトリ構成までお任せ
- ターミナル操作も Web 上で完結
- GitHub 連携でそのままコミット & プッシュ

<br>

> スマホのブラウザから **claude.ai/code** にアクセスするだけ

---

# スマホ開発ワークフロー

<br>

```
Claude Code (Web)        コードを書く・修正する
        |
        v
GitHub (自動連携)         コミット & プッシュ
        |
        v
Vercel / Render          push で自動デプロイ
        |
        v
LINE アプリ              実機で動作確認
```

<br>

**CLI もターミナルも不要。** 全ステップがブラウザで完結する。

---

# 解決したかった課題

<br>

テニスサークルの出欠管理に、3つの非効率があった。

<br>

- **二重管理** — LINE と回覧の両方で出欠を取っていた
- **案内のタイミング問題** — 回覧は管理が煩雑なため月末にまとめて翌月分を配布。
  上旬の予定が直前まで届かず、予約後の即時案内もできなかった
- **手作業の予実管理** — 回覧の参加予定者と実際の出席者を
  別の Excel シートに手入力で突合していた

<br>

しかし PC を開いて開発する気力はない。

---

<!-- _class: green -->

# LINE 出欠管理アプリ

## LINE の中で動く Web アプリ（LIFF）を開発

<br>

- 練習案内を **LINE グループにワンタップ送信**
- メンバーは **参加 / 不参加をタップするだけ**
- 管理者は出欠を **リアルタイムに集計・確認**

---

<!-- _class: accent -->

# 技術スタック

すべて **ブラウザで完結する** ものを選択した。

<br>

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| フロントエンド | React + TypeScript + Vite | Vercel が自動ビルド |
| バックエンド | Node.js + Express | Render が自動デプロイ |
| データ | Google Sheets | DB 不要、設定はブラウザのみ |
| 認証 | LINE LIFF SDK | LINE 内で自動ログイン |
| 通知 | liff.shareTargetPicker() | Bot / Webhook 不要 |

---

# アーキテクチャ

<br>

```
┌──────────┐      ┌─────────────────┐      ┌──────────────────┐
│ LINE App │ ───> │  React (Vercel) │ ───> │ Express (Render) │
│   LIFF   │      │  フロントエンド    │      │  バックエンド       │
└──────────┘      └─────────────────┘      └────────┬─────────┘
                                                    │
                                           ┌────────v─────────┐
                                           │  Google Sheets    │
                                           │   データストア      │
                                           └──────────────────┘
```

<br>

**DB 不要 ・ Bot 不要 ・ サーバー管理不要**

---

<!-- _class: lead -->

# 運用コスト

<br>

# ¥0 / 月

<br>

| サービス | 費用 |
|---------|------|
| Vercel（フロントエンド）| 無料枠 |
| Render（バックエンド）| 無料枠 |
| Google Sheets API | 無料 |
| LINE LIFF | 無料 |

---

<!-- _class: lead -->

# まとめ

<br>

## ものぐさでもアプリは作れる時代になった

<br>

**Claude Code Web** でスマホからコーディング
**GitHub + Vercel / Render** で自動デプロイ
**LINE LIFF** でユーザー体験もモバイル完結

<br>

ご清聴ありがとうございました
