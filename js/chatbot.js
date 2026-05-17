/*
=======================================================================
  WorkBridge Korea v3 — js/chatbot.js
  AI 챗봇 (Claude API 연동) + 안전교육 서브탭 전환
=======================================================================

  ⚠️⚠️⚠️ 이 파일의 sendChatMessage() 함수는 절대 수정하지 마세요 ⚠️⚠️⚠️
  ──────────────────────────────────────────────────────────────────────
  이 함수는 Anthropic의 Claude API 서버에 HTTP 요청을 보냅니다.
  잘못 수정하면 AI 챗봇이 완전히 작동하지 않습니다.

  건드리면 안 되는 것:
    - fetch() URL        → API 서버 주소 (절대 변경 금지)
    - method: 'POST'     → POST 방식으로 보내야 합니다
    - Content-Type       → application/json 고정
    - model 이름         → claude-sonnet-4-20250514 (바꾸면 오류)
    - messages 배열 구조 → { role: 'user'/'assistant', content: '...' }
    - data.content?.[0]?.text  → API 응답 파싱 방식

  ★ 수정해도 되는 것
  ──────────────────────────────────────────────────────────────────────
  - SYSTEM_PROMPT 안의 텍스트
    → AI가 어떤 역할을 할지, 어떤 범위로 답변할지 조정 가능
    → 단, 백틱(`) 문자나 ${} 를 추가할 때는 이스케이프 주의
  - max_tokens: 1000
    → 최대 응답 길이. 높일수록 긴 답변 (최대 4096)
    → 너무 높으면 느려지고 비용이 증가합니다
  - 최저임금 금액 (매년 1월 변경)
    → SYSTEM_PROMPT 안의 '10,030 KRW' 부분을 새 값으로 수정
    → app.js의 checkMinWage() 안의 10030도 함께 수정하세요

  API 키는 코드에 없어도 됩니다
  ──────────────────────────────────────────────────────────────────────
  Anthropic 프록시 서버가 자동으로 API 키를 처리합니다.
  코드에 API 키를 직접 넣으면 보안 문제가 발생합니다. 절대 넣지 마세요.
=======================================================================
*/

// ⚠️ 대화 히스토리 배열 — API에 이전 대화 맥락을 넘길 때 사용
//    최대 20개까지 유지 (메모리 절약). 직접 수정하지 마세요.
let chatHistory = [];

function initChatbot() {
  // 언어 힌트 업데이트
  const hint = document.getElementById('chatbot-lang-hint');
  const langNames = {
    ko:'한국어', vi:'Tiếng Việt', tl:'Filipino', uz:"O'zbek",
    km:'ខ្មែរ', id:'Bahasa Indonesia', ne:'नेपाली', my:'မြန်မာ', si:'සිංහල', th:'ภาษาไทย', en:'English'
  };
  if (hint) hint.textContent = '🌐 ' + (langNames[currentLang] || 'Korean') + ' 모드';
  // 웰컴 메시지 번역 업데이트
  const welcomeEl = document.querySelector('#chatbot-messages .chatbot-bubble[data-i18n="chatbot_welcome"]');
  if (welcomeEl) welcomeEl.textContent = t('chatbot_welcome');
  // 인풋 placeholder 업데이트
  const inputEl = document.getElementById('chatbot-input');
  if (inputEl) inputEl.placeholder = t('chatbot_placeholder');
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatbot-input');
  const text = input.value.trim();
  if (!text) return;

  appendChatMsg('user', text);
  input.value = '';
  chatHistory.push({ role: 'user', content: text });

  const btn = document.getElementById('chatbot-send-btn');
  btn.disabled = true;

  const loadingId = 'loading-' + Date.now();
  appendChatMsg('bot', t('chatbot_loading'), loadingId, true);

  const SYSTEM_PROMPT = `You are a Korean labor law expert assistant for foreign workers in Korea.
Always respond in the EXACT SAME LANGUAGE the user writes in.
If the user writes in Vietnamese → respond fully in Vietnamese.
If the user writes in Uzbek → respond fully in Uzbek.
If the user writes in Korean → respond in Korean.
If the user writes in Filipino/Tagalog → respond in Filipino.
If the user writes in Khmer → respond in Khmer.
If the user writes in Burmese → respond in Burmese.
If the user writes in Sinhala → respond in Sinhala.
If the user writes in Thai → respond in Thai.
If the user writes in Indonesian → respond in Indonesian.
If the user writes in Nepali → respond in Nepali.
Focus topics: minimum wage, working hours, overtime, annual leave, industrial accident insurance, employment contract, work visa rights, payroll deductions.
Be concise (under 300 words), practical. Cite Korean law when relevant (e.g., 근로기준법 제56조).
For complex legal matters, recommend: Ministry of Employment and Labor hotline 1350 (고용노동부).
Current 2025 minimum wage: 10,030 KRW/hour (월 2,096,270원 based on 209 hours).`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: chatHistory,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || t('chatbot_error');

    document.getElementById(loadingId)?.remove();
    appendChatMsg('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });

    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  } catch (err) {
    document.getElementById(loadingId)?.remove();
    appendChatMsg('bot', t('chatbot_error'));
  }

  btn.disabled = false;
  const msgs = document.getElementById('chatbot-messages');
  if (msgs) msgs.scrollTop = 99999;
}

function appendChatMsg(role, text, id, isLoading) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chatbot-msg ' + role;
  if (id) div.id = id;
  div.innerHTML = `<div class="chatbot-bubble${isLoading ? ' loading' : ''}">${text}</div>`;
  container.appendChild(div);
  container.scrollTop = 99999;
}

function clearChatbot() {
  chatHistory = [];
  const container = document.getElementById('chatbot-messages');
  if (container) {
    container.innerHTML = `<div class="chatbot-msg bot"><div class="chatbot-bubble" data-i18n="chatbot_welcome">${t('chatbot_welcome')}</div></div>`;
  }
}

// ==============================
// [v3 신규] edu 서브탭 전환
// ==============================
function switchEduTab(tab, btn) {
  document.querySelectorAll('.edu-sub-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.edu-panel').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('edu-' + tab);
  if (panel) panel.classList.add('active');
}
