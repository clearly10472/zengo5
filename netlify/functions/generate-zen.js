// Netlify Function to generate Zen phrases using Gemini API
const fetch = require('node-fetch');

// 利用可能なモデルを確認する関数
async function listAvailableModels(apiKey) {
  try {
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(listModelsUrl);
    const data = await response.json();
    console.log('Available models:', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error listing models:', error);
    return { error: error.message };
  }
}

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Parse the incoming request body
    const { mood } = JSON.parse(event.body);
    
    if (!mood) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Mood is required" })
      };
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }
    
    // 利用可能なモデルを確認
    try {
      const models = await listAvailableModels(apiKey);
      console.log('Available models checked');
    } catch (error) {
      console.error('Error checking models:', error);
      // モデル確認に失敗しても処理を続行
    }

    // Construct the prompt
    const prompt = `あなたは、禅の思想に詳しい賢いAIです。

以下に与えられる「今日の気分」をもとに、それに最もふさわしい禅語を1つ選び、以下の情報を出力してください：

1. 禅語（漢字）
2. 読み方（ひらがな）
3. 意味・背景（簡潔に3行以内）
4. なぜこの気分にふさわしいのか（1〜2行）

例：
【気分】心がざわざわする、不安な気持ち

→ 出力形式：
---
禅語：喫茶去  
よみ：きっさこ  
意味：どんなときも一度お茶を飲んで落ち着こう、という意味。客人が誰であっても平等にもてなすという禅の精神が込められている。  
理由：不安で心がざわついているとき、まず一呼吸して心を静めることが大切だから。
---

【気分】：${mood}`;

    // Call the Gemini API with gemini-1.5-pro model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
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
          maxOutputTokens: 1024,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API response error:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API response error: ${response.status}` })
      };
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data));
    
    // レスポンス形式に応じて適切に処理
    let zenResponse;
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      zenResponse = data.candidates[0].content.parts[0].text;
    } else if (data.candidates && data.candidates[0] && data.candidates[0].text) {
      zenResponse = data.candidates[0].text;
    } else if (data.text) {
      zenResponse = data.text;
    } else {
      console.error('Unexpected API response format:', data);
      throw new Error('Unexpected API response format');
    }

    // Return the successful response
    return {
      statusCode: 200,
      body: JSON.stringify({ response: zenResponse })
    };
    
  } catch (error) {
    console.error('Error generating Zen response:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
