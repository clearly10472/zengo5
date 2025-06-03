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
      console.error('API key not configured in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key not configured" })
      };
    }
    
    // APIキーの形式を確認（基本的な検証）
    if (apiKey.length < 10) {
      console.error('API key appears to be invalid (too short)');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API key appears to be invalid" })
      };
    }
    
    console.log('Using API key (first 4 chars):', apiKey.substring(0, 4) + '...');
    
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
    
    let response;
    try {
      const requestBody = {
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
      };
      
      console.log('Sending request to Gemini API:', JSON.stringify(requestBody));
      
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed with status ${response.status}: ${errorText}`);
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: `API request failed: ${response.statusText}` })
        };
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Error calling Gemini API: ${error.message}` })
      };
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data));
    
    // エラーチェック
    if (data.error) {
      console.error('API returned an error:', data.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `API error: ${data.error.message || 'Unknown error'}` })
      };
    }
    
    // レスポンス形式に応じて適切に処理
    let zenResponse = '';
    
    try {
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          zenResponse = candidate.content.parts[0].text;
        } else if (candidate.text) {
          zenResponse = candidate.text;
        } else if (candidate.content && typeof candidate.content === 'string') {
          zenResponse = candidate.content;
        }
      } else if (data.text) {
        zenResponse = data.text;
      } else if (data.content) {
        zenResponse = data.content;
      }
      
      if (!zenResponse) {
        console.error('Could not extract response from API result:', data);
        zenResponse = '申し訳ありません。禅語を生成できませんでした。別の気分で試してみてください。';
      }
    } catch (error) {
      console.error('Error parsing API response:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Error parsing API response: ${error.message}` })
      };
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
