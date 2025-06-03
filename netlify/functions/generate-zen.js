// Netlify Function to generate Zen phrases using Gemini API
const fetch = require('node-fetch');

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

    // Call the Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    
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
          maxOutputTokens: 1024
        }
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
    const zenResponse = data.candidates[0].content.parts[0].text;

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
