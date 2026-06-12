---
marp: true
theme: default
paginate: true
size: 16:9
style: |
  section {
    font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif;
  }
  section.lead h1 {
    font-size: 2.5em;
  }
  section.lead {
    text-align: center;
  }
  section.invert {
    background-color: #06C755;
    color: white;
  }
  section.invert h1,
  section.invert h2 {
    color: white;
  }
  table {
    font-size: 0.8em;
    margin: 0 auto;
  }
  pre {
    font-size: 0.75em;
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

<br>

<!-- 📸 ここにあおむけでスマホをいじっている人の画像を配置 -->
<!-- ![w:500](./images/lying-down-smartphone.png) -->

<div style="text-align: center; font-size: 1.5em; padding: 40px; background: #f5f5f5; border-radius: 16px;">
🛏️ 🤳 💤
</div>

<br>

<div style="text-align: center; font-size: 1.3em;">

**ベッドの上で、スマホ1台。これだけです。**

</div>

---

<!-- _class: lead -->

# 🤳 スマホがあれば
# アプリは作れる

<br>

**Claude Code** × **GitHub** 連携で
コーディングからデプロイまで **PC不要**

---

# Claude Code (Web) とは

<br>

ブラウザだけで動く **AI ペアプログラミング環境**

<br>

- 💬 会話で指示 → コードを自動生成・編集
- 📁 ファイル作成・ディレクトリ構成もお任せ
- 🖥️ ターミナル操作（npm install, テスト実行）も Web で完結
- 🔗 GitHub 連携でそのままコミット＆プッシュ

<br>

> スマホのブラウザから **claude.ai/code** にアクセスするだけ

---

# スマホ開発ワークフロー

<br>

```
📱 Claude Code (Web)     コードを書く・修正する
        │
        ▼
📱 GitHub (自動連携)      コミット＆プッシュ
        │
        ▼
🔄 Vercel / Render       push で自動デプロイ
        │
        ▼
📱 LINE アプリ            実機で動作確認
```

<br>

<div style="text-align: center; font-size: 1.2em;">

**CLI もターミナルも不要！** 全ステップがブラウザで完結

</div>

---

# こんな課題があった

<br>

テニスサークルの出欠管理...

<br>

- 😩 LINEグループで「参加の人スタンプ押して〜」
- 📋 誰が回答したか **数えるのが大変**
- 🤯 メンバーが増えると **管理が破綻** する

<br>

→ もっと楽にしたい。でも PC で開発するのは面倒...

---

<!-- _class: invert -->

# 作ったもの：LINE 出欠管理アプリ

<br>

## LINE の中で動く Web アプリ（LIFF）

<br>

- 📣 練習案内を **LINE グループにワンタップ送信**
- ✅ メンバーは **参加 / 不参加をタップするだけ**
- 📊 管理者は出欠を **リアルタイムに集計・確認**

---

# 技術スタック

<br>

すべて **「ブラウザで完結」** するものを選択 🔑

<br>

| レイヤー | 技術 | 選んだ理由 |
|---------|------|-----------|
| フロントエンド | React + TypeScript + Vite | Vercel が自動ビルド |
| バックエンド | Node.js + Express | Render が自動デプロイ |
| データ | **Google Sheets** | DB 不要、設定はブラウザで |
| 認証 | LINE LIFF SDK | LINE 内で自動ログイン |
| 通知 | liff.shareTargetPicker() | Bot / Webhook 不要 |

---

# アーキテクチャ

<br>

```
┌──────────┐      ┌─────────────────┐      ┌─────────────────┐
│ LINE App │─────▶│  React (Vercel) │─────▶│ Express (Render) │
│   LIFF   │      │  フロントエンド    │      │  バックエンド      │
└──────────┘      └─────────────────┘      └────────┬────────┘
                                                    │
                                           ┌────────▼────────┐
                                           │  Google Sheets   │
                                           │   データストア     │
                                           └─────────────────┘
```

<br>

<div style="text-align: center; font-size: 1.1em;">

✅ DB 不要　　✅ Bot 不要　　✅ サーバー管理不要

</div>

---

<!-- _class: lead -->

# 運用コスト

<br>

# 💰 ¥0 /月

<br>

| サービス | 費用 |
|---------|------|
| Vercel (フロントエンド) | 無料枠 |
| Render (バックエンド) | 無料枠 |
| Google Sheets API | 無料 |
| LINE LIFF | 無料 |

---

<!-- _class: lead -->

# まとめ

<br>

## ものぐさでもアプリは作れる

<br>

1. 🛠 **Claude Code Web** でスマホからコーディング
2. 🚀 **GitHub + Vercel / Render** で自動デプロイ
3. 📱 **LINE LIFF** でユーザー体験もモバイル完結

<br>

ご清聴ありがとうございました 🙏
