import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// 環境変数の読み込み
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JSONボディの解析
app.use(express.json());
// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// 設定ファイルの読み込み
let config;
try {
  const configData = await fs.readFile(path.join(__dirname, 'config.json'), 'utf8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('設定ファイルの読み込みに失敗しました:', error);
  process.exit(1);
}

// APIキーの検証
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
  console.warn('警告: Gemini APIキーが設定されていません。.envファイルを確認してください。');
}

// APIリクエスト関数
async function generateZenResponse(mood) {
  try {
    const prompt = config.prompt.replace('{{気分}}', mood);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API応答エラー:', errorData);
      throw new Error(`API応答エラー: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('禅語生成中にエラーが発生しました:', error);
    throw error;
  }
}

// APIエンドポイント
app.post('/api/zen', async (req, res) => {
  try {
    const { mood } = req.body;
    
    if (!mood) {
      return res.status(400).json({ error: '気分が指定されていません' });
    }

    const zenResponse = await generateZenResponse(mood);
    res.json({ response: zenResponse });
  } catch (error) {
    console.error('APIリクエスト処理中にエラーが発生しました:', error);
    res.status(500).json({ error: '内部サーバーエラー' });
  }
});

// メインページの提供
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});
