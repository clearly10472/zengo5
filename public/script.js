// ZenMood フロントエンドスクリプト
document.addEventListener('DOMContentLoaded', function() {
  // 要素の取得
  const moodForm = document.getElementById('mood-form');
  const moodInput = document.getElementById('mood-input');
  const submitBtn = document.getElementById('submit-btn');
  const resultSection = document.getElementById('result-section');
  const loading = document.getElementById('loading');
  const resultContent = document.getElementById('result-content');

  // フォーム送信イベントの処理
  moodForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const mood = moodInput.value.trim();
    if (!mood) {
      alert('気分を入力してください');
      return;
    }

    // 送信ボタンを無効化
    submitBtn.disabled = true;
    submitBtn.textContent = '処理中...';
    
    // 結果セクションを表示し、ローディングを表示
    resultSection.style.display = 'block';
    resultSection.classList.add('visible');
    loading.classList.add('visible');
    resultContent.classList.remove('visible');
    resultContent.style.display = 'none';
    
    try {
      // APIリクエストの送信
      const response = await fetch('/api/zen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mood })
      });

      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }

      const data = await response.json();
      
      // ローディングを非表示
      loading.classList.remove('visible');
      
      // 結果の表示
      displayResult(data.response);
      
    } catch (error) {
      console.error('エラーが発生しました:', error);
      
      // ローディングを非表示
      loading.classList.remove('visible');
      
      // エラーメッセージの表示
      resultContent.innerHTML = `
        <div class="error-message">
          <p>申し訳ありません。エラーが発生しました。</p>
          <p>しばらく経ってからもう一度お試しください。</p>
        </div>
      `;
      resultContent.style.display = 'block';
      resultContent.classList.add('visible');
      
    } finally {
      // 送信ボタンを再度有効化
      submitBtn.disabled = false;
      submitBtn.textContent = '禅語を探す';
    }
  });

  // 結果の表示関数
  function displayResult(response) {
    // 禅語の抽出
    const lines = response.split('\n');
    let zenWord = '';
    let zenReading = '';
    let zenMeaning = '';
    let zenReason = '';
    
    for (const line of lines) {
      if (line.startsWith('禅語：')) {
        zenWord = line.replace('禅語：', '').trim();
      } else if (line.startsWith('よみ：')) {
        zenReading = line.replace('よみ：', '').trim();
      } else if (line.startsWith('意味：')) {
        zenMeaning = line.replace('意味：', '').trim();
      } else if (line.startsWith('理由：')) {
        zenReason = line.replace('理由：', '').trim();
      }
    }
    
    // 結果のHTMLを構築
    resultContent.innerHTML = `
      <div class="zen-result">
        <div class="zen-word">${zenWord}</div>
        <div class="zen-reading">${zenReading}</div>
        <div class="zen-meaning"><strong>意味：</strong>${zenMeaning}</div>
        <div class="zen-reason"><strong>理由：</strong>${zenReason}</div>
      </div>
    `;
    
    // 結果を表示
    resultContent.style.display = 'block';
    resultContent.classList.add('visible');
    
    // スムーズスクロール
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }
});
