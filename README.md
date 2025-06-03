# ZenMood - 今日の気分に応じた禅語提案サービス

ZenMoodは、ユーザーの気分に合わせて最適な禅語を提案するウェブアプリケーションです。禅の知恵を通じて、日々の感情に対する新しい視点を提供します。

## 機能

- ユーザーの気分に基づいた禅語の提案
- 禅語の読み方、意味、背景の説明
- なぜその禅語が今の気分に適しているかの解説

## セットアップ方法

### 前提条件

- Node.js (バージョン14以上)
- Google Gemini API キー

### インストール手順

1. リポジトリをクローンするか、ファイルをダウンロードします
2. 依存関係をインストールします：

```bash
npm install
```

3. `.env`ファイルを編集し、Gemini APIキーを設定します：

```
GEMINI_API_KEY=your_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
```

4. アプリケーションを起動します：

```bash
npm start
```

5. ブラウザで `http://localhost:3000` にアクセスします

## 使用方法

1. 「今日の気分を入力してください」フィールドに現在の気分や感情を入力します
2. 「禅語を探す」ボタンをクリックします
3. アプリケーションがあなたの気分に最適な禅語を提案します

## 技術スタック

- フロントエンド: HTML, CSS, JavaScript
- バックエンド: Node.js, Express
- API: Google Gemini API

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

© 2025 ZenMood - 禅の知恵で心を整える
