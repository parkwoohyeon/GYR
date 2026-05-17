/*
=======================================================================
  WorkBridge Korea v3 — js/app.js
  앱 핵심 로직 (페이지 전환 / 공고 렌더 / 교육 / 인증 / 임금계산기 / 이력서)
=======================================================================

  이 파일에 포함된 기능:
  ──────────────────────────────────────────────────────────────────────
  showPage()        → 화면 전환 (SPA 라우터)
  renderJobCards()  → 구인공고 카드 그리기 (data/jobs.js 의 JOBS 사용)
  renderEduCards()  → 안전교육 카드 그리기 (data/courses.js 의 COURSES 사용)
  doSignup()        → 회원가입 처리
  doLogin()         → 로그인 처리
  calcSalary()      → 임금 계산기
  generateResume()  → 이력서 생성
  switchLaborTab()  → 노무 서비스 서브탭 전환
  toggleCheck()     → 근로계약서 체크리스트
  showToast()       → 알림 팝업

  ★ 수정 가이드
  ──────────────────────────────────────────────────────────────────────
  최저임금 변경     → checkMinWage() 안의 10030 을 새 금액으로 수정
  4대보험 공제율    → calcSalary() 안의 0.094 를 변경 (기본 9.4%)
  FAQ 챗봇 답변     → FAQ_DB 객체 안의 텍스트 수정

  ⚠️ 절대 바꾸면 안 되는 것
  ──────────────────────────────────────────────────────────────────────
  localStorage 키 목록 (이 키들을 바꾸면 저장 데이터가 사라집니다):
    wb_users    : 가입된 사용자 목록
    wb_session  : 현재 로그인된 사용자
    wb_applied  : 지원한 공고 id 목록
    wb_certs    : 수료한 교육 목록
    wb_resumes  : 저장한 이력서 (최대 3개)
    wb_lang     : 선택 언어
    wb_country  : 선택 국가
    wb_edu_cN   : 각 교육 과목 진행률

  id / data-i18n 속성값 → index.html과 정확히 일치해야 합니다.
  showPage() / applyLang() 함수 본체 → 수정 시 앱 전체가 깨집니다.
=======================================================================
*/



// ==============================
// 2. 페이지 전환 (SPA)
// ==============================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.bottom-tab').forEach(tb => tb.classList.remove('active'));
  const tab = document.getElementById('tab-' + page);
  if (tab) tab.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.getAttribute('onclick') && l.getAttribute('onclick').includes("'" + page + "'")) {
      l.classList.add('active');
    }
  });

  if (page === 'profile') updateProfilePage();
  if (page === 'labor') initChatbot();
  window.scrollTo(0, 0);
}

// ==============================
// 3. 구인공고 필터
// JOBS / SECTOR_ICON 데이터는 data/jobs.js에서 로드합니다.
// ==============================

function getFilteredJobs() {
  const sector  = document.getElementById('filter-sector')?.value || '';
  const region  = document.getElementById('filter-region')?.value || '';
  const keyword = (document.getElementById('filter-keyword')?.value || '').trim().toLowerCase();
  return JOBS.filter(j => {
    if (sector  && j.sector  !== sector)  return false;
    if (region  && j.region  !== region)  return false;
    if (keyword && !JSON.stringify(j).toLowerCase().includes(keyword)) return false;
    return true;
  });
}

function filterJobs() { renderJobCards(getFilteredJobs()); }

function renderJobCards(jobs) {
  const grid  = document.getElementById('jobs-grid');
  const empty = document.getElementById('jobs-empty');
  if (!grid) return;
  if (jobs.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = jobs.map(j => `
    <div class="job-card">
      <div class="job-card-header">
        <div>
          <div class="job-company">${j.company}</div>
          <div class="job-title">${j.role}</div>
        </div>
        <span class="badge badge-blue">${SECTOR_ICON[j.sector]||''} ${j.sector}</span>
      </div>
      <div class="job-meta">
        <div class="job-meta-row"><i class="fas fa-map-marker-alt"></i>${j.city}</div>
        <div class="job-meta-row"><i class="fas fa-won-sign"></i>월 ${j.salary}</div>
      </div>
      <div class="job-salary">월 ${j.salary}</div>
      <div class="job-badges">
        ${j.visa.map(v => `<span class="badge badge-green">${v} 가능</span>`).join('')}
        ${j.safetyReq ? `<span class="badge badge-orange">⚠️ 안전교육 필수</span>` : `<span class="badge badge-gray">안전교육 불필요</span>`}
      </div>
      <div class="job-card-footer">
        <button class="btn btn-primary btn-sm btn-full" onclick="viewJobDetail(${j.id})">
          ${t('view_details')}
        </button>
      </div>
    </div>
  `).join('');
}

// ==============================
// [신규] 공고 보기 — 로그인 유도 / 상세 모달
// ==============================
function viewJobDetail(id) {
  const job = JOBS.find(j => j.id === id);
  if (!job) return;
  const user = getCurrentUser();
  if (!user) {
    // 로그인 유도 모달
    document.getElementById('jm-company-preview').textContent =
      `${job.company} — ${job.role} | ${job.city} | 월 ${job.salary}`;
    document.getElementById('job-login-modal').classList.add('open');
  } else {
    // 공고 상세 모달
    openJobDetailModal(job, user);
  }
}

function openJobDetailModal(job, user) {
  const applied = JSON.parse(localStorage.getItem('wb_applied') || '[]').includes(job.id);
  const safetyDone = getCourseProgress('c1') >= 100 || getCourseProgress('c3') >= 100;
  const safetyWarn = job.safetyReq && !safetyDone;

  document.getElementById('job-detail-content').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <span class="badge badge-blue" style="font-size:13px;">${SECTOR_ICON[job.sector]||''} ${job.sector}</span>
      <div>
        <div style="font-size:17px;font-weight:800;">${job.company}</div>
        <div style="font-size:15px;font-weight:700;color:var(--primary);">${job.role}</div>
      </div>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">📍</span>
      <span class="job-detail-label">근무지</span>
      <span class="job-detail-value">${job.city}</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">💰</span>
      <span class="job-detail-label">월급여</span>
      <span class="job-detail-value">${job.salaryRange || job.salary}</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">📋</span>
      <span class="job-detail-label">고용형태</span>
      <span class="job-detail-value">${job.contractType}</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">⏰</span>
      <span class="job-detail-label">근무시간</span>
      <span class="job-detail-value">${job.workHours}</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">🏖️</span>
      <span class="job-detail-label">근무요일</span>
      <span class="job-detail-value">${job.workDays}</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">🛡️</span>
      <span class="job-detail-label">비자</span>
      <span class="job-detail-value">${job.visa.join(', ')} 가능</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">📞</span>
      <span class="job-detail-label">담당자</span>
      <span class="job-detail-value">${job.contact}</span>
    </div>
    <div class="job-detail-row">
      <span class="job-detail-icon">📧</span>
      <span class="job-detail-label">이메일</span>
      <span class="job-detail-value"><a href="mailto:${job.email}" style="color:var(--secondary);">${job.email}</a></span>
    </div>
    ${safetyWarn ? `
    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px;margin-top:14px;">
      <div style="font-weight:700;margin-bottom:8px;">⚠️ 이 공고는 안전교육 이수 후 지원 가능</div>
      <button class="btn btn-sm" style="background:#EA580C;color:#fff;" onclick="closeJobDetailModal();showPage('edu')">안전교육 바로 받기</button>
    </div>` : ''}
    <button class="apply-btn" id="apply-btn-${job.id}"
      onclick="applyJob(${job.id})"
      ${applied ? 'disabled' : ''}>
      ${applied ? '✅ 지원 완료!' : '지원하기'}
    </button>
  `;
  document.getElementById('job-detail-modal').classList.add('open');
}

function applyJob(id) {
  const applied = JSON.parse(localStorage.getItem('wb_applied') || '[]');
  if (!applied.includes(id)) {
    applied.push(id);
    localStorage.setItem('wb_applied', JSON.stringify(applied));
  }
  const btn = document.getElementById('apply-btn-' + id);
  if (btn) { btn.textContent = '✅ 지원 완료!'; btn.disabled = true; }
  showToast('🎉 지원서가 제출되었습니다!', 'success');
}

function closeJobModal() {
  document.getElementById('job-login-modal').classList.remove('open');
}
function closeJobDetailModal() {
  document.getElementById('job-detail-modal').classList.remove('open');
}

// ==============================
// 4. 안전교육 렌더링
// COURSES / 교육 진행률 헬퍼는 data/courses.js에서 로드합니다.
// ==============================

function renderEduCards() {
  const grid = document.getElementById('edu-grid');
  if (!grid) return;
  grid.innerHTML = COURSES.map(c => {
    const pct = getCourseProgress(c.id);
    const done = pct >= 100;
    let btnLabel, btnClass;
    if (done) { btnLabel = t('cert_issue'); btnClass = 'btn-success'; }
    else if (pct > 0) { btnLabel = t('resume_course'); btnClass = 'btn-secondary'; }
    else { btnLabel = t('start_course'); btnClass = 'btn-primary'; }
    return `
    <div class="edu-card">
      <div><div class="edu-card-title">${c.title}</div></div>
      <div class="edu-card-meta">
        <span><i class="fas fa-clock" style="margin-right:4px;"></i>${c.hours}</span>
        <span><i class="fas fa-industry" style="margin-right:4px;"></i>${c.sector}</span>
      </div>
      <div class="edu-card-langs">${c.langs}</div>
      <div class="progress-wrap">
        <div class="progress-label">
          <span style="font-size:12px;color:var(--text-muted);">진행률</span>
          <span style="font-size:12px;font-weight:700;color:var(--primary);">${pct}%</span>
        </div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <button class="btn ${btnClass} btn-sm btn-full" onclick="${done ? 'issueCert(\"'+c.id+'\",\"'+c.title+'\")' : 'startCourse(\"'+c.id+'\",\"'+c.title+'\")'}">
        ${done ? '🏆 ' : ''}${btnLabel}
      </button>
    </div>`;
  }).join('');
}

let currentCourseId = null;
let eduInterval = null;

function startCourse(id, title) {
  currentCourseId = id;
  const modal = document.getElementById('edu-modal');
  document.getElementById('edu-modal-title').textContent = title;
  document.getElementById('edu-modal-sub').textContent = '수강 중... 잠시 기다려주세요.';
  document.getElementById('edu-modal-pct').textContent = '0%';
  document.getElementById('edu-modal-bar').style.width = '0%';
  document.getElementById('edu-modal-close').disabled = true;
  modal.classList.add('open');
  let pct = getCourseProgress(id);
  const step = (100 - pct) / 50;
  eduInterval = setInterval(() => {
    pct = Math.min(pct + step, 100);
    const rounded = Math.round(pct);
    document.getElementById('edu-modal-pct').textContent = rounded + '%';
    document.getElementById('edu-modal-bar').style.width = rounded + '%';
    setCourseProgress(id, rounded);
    if (pct >= 100) {
      clearInterval(eduInterval);
      document.getElementById('edu-modal-sub').textContent = '🎉 수강 완료!';
      document.getElementById('edu-modal-close').disabled = false;
      showToast('🎉 수료 완료! 수료증이 발급되었습니다', 'success');
      const certs = JSON.parse(localStorage.getItem('wb_certs') || '[]');
      if (!certs.find(c => c.id === id)) {
        certs.push({ id, title: document.getElementById('edu-modal-title').textContent, date: new Date().toLocaleDateString('ko-KR') });
        localStorage.setItem('wb_certs', JSON.stringify(certs));
      }
    }
  }, 100);
}

function closeEduModal() {
  document.getElementById('edu-modal').classList.remove('open');
  clearInterval(eduInterval);
  renderEduCards();
  updateProfilePage();
}

function issueCert(id, title) {
  showToast('🏆 ' + title + ' 수료증이 발급되었습니다!', 'success');
}

// ==============================
// 5. 회원가입 / 로그인
// ==============================
function openAuthModal(tab) {
  document.getElementById('auth-modal').classList.add('open');
  switchAuthTab(tab);
}
function closeAuthModal() { document.getElementById('auth-modal').classList.remove('open'); }

function switchAuthTab(tab) {
  document.getElementById('login-form-wrap').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form-wrap').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('auth-tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('auth-tab-signup').classList.toggle('active', tab === 'signup');
}

function switchUserType(type) {
  document.getElementById('worker-form').style.display   = type === 'worker'   ? 'block' : 'none';
  document.getElementById('employer-form').style.display = type === 'employer' ? 'block' : 'none';
  document.getElementById('type-worker').classList.toggle('active',   type === 'worker');
  document.getElementById('type-employer').classList.toggle('active', type === 'employer');
}

function formatBizNo(el) {
  let v = el.value.replace(/[^0-9]/g,'');
  if (v.length > 3) v = v.slice(0,3) + '-' + v.slice(3);
  if (v.length > 6) v = v.slice(0,6) + '-' + v.slice(6);
  el.value = v.slice(0,12);
}

function getUsers() { return JSON.parse(localStorage.getItem('wb_users') || '[]'); }
function saveUsers(arr) { localStorage.setItem('wb_users', JSON.stringify(arr)); }

function doSignup(type) {
  const users = getUsers();
  let email, pw, name, extra = {};
  if (type === 'worker') {
    email = document.getElementById('w-email').value.trim();
    pw    = document.getElementById('w-pw').value;
    name  = document.getElementById('w-name').value.trim();
    extra = {
      nation: document.getElementById('w-nation').value,
      visa:   document.getElementById('w-visa').value,
      sector: document.getElementById('w-sector').value,
      region: document.getElementById('w-region').value,
    };
  } else {
    email = document.getElementById('e-email').value.trim();
    pw    = document.getElementById('e-pw').value;
    name  = document.getElementById('e-company').value.trim();
    extra = {
      bizno:   document.getElementById('e-bizno').value,
      sector:  document.getElementById('e-sector').value,
      region:  document.getElementById('e-region').value,
      manager: document.getElementById('e-manager').value.trim(),
    };
  }
  if (!email || !pw || !name) { showToast('필수 항목을 입력해주세요.', 'error'); return; }
  if (pw.length < 6) { showToast('비밀번호는 6자 이상이어야 합니다.', 'error'); return; }
  const errEl = document.getElementById(type === 'worker' ? 'w-email-error' : 'e-email-error');
  if (users.find(u => u.email === email)) { errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  const user = { email, pw, name, type, ...extra };
  users.push(user);
  saveUsers(users);
  // 국적에 따라 언어 자동 전환
  if (type === 'worker' && extra.nation) {
    const nationLangMap = {
      '베트남':'vi','필리핀':'tl','우즈베키스탄':'uz','캄보디아':'km',
      '인도네시아':'id','네팔':'ne','미얀마':'my','스리랑카':'si','태국':'th'
    };
    const autoLang = nationLangMap[extra.nation];
    if (autoLang) { currentLang = autoLang; localStorage.setItem('wb_lang', autoLang); }
  }
  loginUser(user);
  closeAuthModal();
  showToast('🎉 환영합니다, ' + name + '님!', 'success');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const users = getUsers();
  const user  = users.find(u => u.email === email && u.pw === pw);
  if (!user) { document.getElementById('login-error').style.display = 'block'; return; }
  document.getElementById('login-error').style.display = 'none';
  loginUser(user);
  closeAuthModal();
  showToast('👋 어서오세요, ' + user.name + '님!', 'success');
}

function loginUser(user) {
  localStorage.setItem('wb_session', JSON.stringify(user));
  updateAuthUI(user);
  applyLang();
}

function logout() {
  localStorage.removeItem('wb_session');
  updateAuthUI(null);
  showToast('로그아웃되었습니다.', 'success');
  updateProfilePage();
}

function getCurrentUser() {
  const s = localStorage.getItem('wb_session');
  return s ? JSON.parse(s) : null;
}

function updateAuthUI(user) {
  const loggedIn = !!user;
  document.getElementById('desktop-login-btn').style.display  = loggedIn ? 'none' : '';
  document.getElementById('desktop-signup-btn').style.display = loggedIn ? 'none' : '';
  document.getElementById('desktop-logout-btn').style.display = loggedIn ? '' : 'none';
  document.getElementById('mobile-login-btn').style.display   = loggedIn ? 'none' : '';
  document.getElementById('mobile-logout-btn').style.display  = loggedIn ? '' : 'none';
  const n1 = document.getElementById('desktop-user-name');
  const n2 = document.getElementById('mobile-user-name');
  if (user) {
    n1.textContent = user.name; n1.style.display = '';
    n2.textContent = user.name; n2.style.display = '';
  } else {
    n1.style.display = 'none';
    n2.style.display = 'none';
  }
}

function updateProfilePage() {
  const user = getCurrentUser();
  document.getElementById('not-logged-in').style.display      = user ? 'none'  : 'block';
  document.getElementById('logged-in-profile').style.display  = user ? 'block' : 'none';
  if (!user) return;
  document.getElementById('profile-name-disp').textContent  = user.name;
  document.getElementById('profile-email-disp').textContent = user.email;
  const badgesEl = document.getElementById('profile-badges-disp');
  badgesEl.innerHTML = '';
  if (user.visa)   badgesEl.innerHTML += `<span class="badge badge-green">${user.visa}</span>`;
  if (user.sector) badgesEl.innerHTML += `<span class="badge badge-blue">${user.sector}</span>`;
  if (user.region) badgesEl.innerHTML += `<span class="badge badge-gray">${user.region}</span>`;
  if (user.type === 'employer') badgesEl.innerHTML += `<span class="badge badge-orange">사업주</span>`;
  const certs = JSON.parse(localStorage.getItem('wb_certs') || '[]');
  const certEl = document.getElementById('cert-list');
  if (certs.length === 0) {
    certEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px;">${t('no_cert')}</div>`;
  } else {
    certEl.innerHTML = certs.map(c => `
      <div class="cert-item">
        <div class="cert-icon">🏆</div>
        <div><div class="cert-name">${c.title}</div><div class="cert-date">${c.date} 수료</div></div>
        <span class="badge badge-green" style="margin-left:auto;">수료완료</span>
      </div>`).join('');
  }
  // 저장된 이력서 표시
  renderSavedResumes();
}

// ==============================
// 6. 토스트 메시지
// ==============================
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut .3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==============================
// [신규] 노무서비스 탭 전환
// ==============================
function switchLaborTab(tab, btn) {
  document.querySelectorAll('.labor-sub-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.labor-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('labor-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'chatbot') initChatbot();
}

// ==============================
// [신규] 체크리스트
// ==============================
function toggleCheck(item) {
  item.classList.toggle('checked');
  const cb = item.querySelector('.checklist-checkbox');
  cb.innerHTML = item.classList.contains('checked') ? '✓' : '';
  // 모두 체크 시 배너 표시
  const items = document.querySelectorAll('.checklist-item');
  const allChecked = Array.from(items).every(i => i.classList.contains('checked'));
  document.getElementById('checklist-done').style.display = allChecked ? 'block' : 'none';
}

// ==============================
// [신규] 임금 계산기
// ==============================
function checkMinWage() {
  const val = parseInt(document.getElementById('c-hourly').value) || 0;
  const warn = document.getElementById('calc-warn');
  warn.style.display = val > 0 && val < 10030 ? 'block' : 'none';
  if (val > 0 && val < 10030) {
    document.getElementById('c-hourly').classList.add('warn');
  } else {
    document.getElementById('c-hourly').classList.remove('warn');
  }
}

function calcSalary() {
  const hourly  = parseInt(document.getElementById('c-hourly').value) || 0;
  const hours   = parseFloat(document.getElementById('c-hours').value) || 0;
  const days    = parseFloat(document.getElementById('c-days').value) || 0;
  const extra   = parseFloat(document.getElementById('c-extra').value) || 0;
  const night   = parseFloat(document.getElementById('c-night').value) || 0;
  const holiday = parseFloat(document.getElementById('c-holiday').value) || 0;

  const base       = hourly * hours * days;
  const extraPay   = hourly * extra * 1.5;
  const nightPay   = hourly * night * 0.5;
  const holidayPay = hourly * holiday * 1.5;
  // 주휴수당: 주당 근무 일수 기준 계산 (월 기준 4.33주)
  const weeklyHours = hours * (days / (days / 5));
  const weeklyPay = weeklyHours >= 15 ? (hourly * 8 * 4.33) : 0;
  const gross = base + extraPay + nightPay + holidayPay + weeklyPay;
  const deduct = gross * 0.094;
  const net = gross - deduct;

  const fmt = n => Math.round(n).toLocaleString('ko-KR') + '원';
  document.getElementById('r-base').textContent    = fmt(base);
  document.getElementById('r-extra').textContent   = fmt(extraPay);
  document.getElementById('r-night').textContent   = fmt(nightPay);
  document.getElementById('r-holiday').textContent = fmt(holidayPay);
  document.getElementById('r-weekly').textContent  = fmt(weeklyPay);
  document.getElementById('r-gross').textContent   = fmt(gross);
  document.getElementById('r-deduct').textContent  = '-' + fmt(deduct);
  document.getElementById('r-net').textContent     = fmt(net);
  document.getElementById('calc-result').style.display = 'block';
}

function copyCalcResult() {
  const gross = document.getElementById('r-gross').textContent;
  const net   = document.getElementById('r-net').textContent;
  navigator.clipboard.writeText(`세전: ${gross}\n실수령: ${net}`).then(() => {
    showToast('📋 계산 결과가 복사되었습니다!', 'success');
  });
}

// ==============================
// [신규] 노무 챗봇
// ==============================
let chatbotInited = false;

const FAQ_DB = {
  ko: {
    '임금체불':  '임금 체불은 근로기준법 위반입니다. ① 사업주에게 서면 요청 ② 고용노동부 신고(☎ 1350) ③ 체당금 신청 순서로 진행하세요. 체당금은 최대 3개월치 임금을 정부가 대신 지급합니다.',
    '월급':      '임금 체불은 근로기준법 위반입니다. ① 사업주에게 서면 요청 ② 고용노동부 신고(☎ 1350) ③ 체당금 신청 순서로 진행하세요.',
    '부당해고':  '정당한 이유 없는 해고는 부당해고입니다. 해고 예고는 30일 전 통보가 원칙이며, 위반 시 30일분 임금을 청구할 수 있습니다. 노동위원회에 구제 신청하세요.',
    '갑자기 해고': '정당한 이유 없는 해고는 부당해고입니다. 해고 예고는 30일 전 통보가 원칙이며, 위반 시 30일분 임금을 청구할 수 있습니다.',
    '산재':      '산업재해 발생 시 ① 즉시 병원 치료 ② 사업주에게 산재 신고 요청 ③ 근로복지공단(☎ 1588-0075)에 산재 신청. 치료비·휴업급여를 받을 수 있습니다.',
    '다쳤':      '산업재해 발생 시 ① 즉시 병원 치료 ② 근로복지공단(☎ 1588-0075)에 산재 신청하세요. 치료비와 휴업급여를 받을 수 있습니다.',
    '초과근무':  '연장근로 수당은 기본 시급의 1.5배입니다. 1주 12시간 초과 연장은 불법입니다. 임금 계산기 탭에서 정확한 금액을 계산해보세요.',
    '야근':      '연장·야간근로 수당은 기본 시급의 1.5배(연장) 또는 0.5배 추가(야간)입니다. 임금 계산기 탭에서 정확한 금액을 확인하세요.',
    '계약해지':  '퇴직금은 1년 이상 근무 시 발생합니다. 퇴직 후 14일 이내 지급이 원칙입니다. E-9 비자는 퇴직 후 귀국 또는 비자 변경을 검토해야 합니다.',
    '퇴직':      '퇴직금은 1년 이상 근무 시 발생합니다. 퇴직 후 14일 이내 지급이 원칙이며, 미지급 시 노동부에 신고 가능합니다.',
    '비자':      '비자 관련 문의는 출입국·외국인청(☎ 1345)으로 연락하세요. E-9 비자 만료 전 고용주를 통해 연장 신청이 필요합니다.',
    '체류':      '비자 체류 기간 만료 전 출입국·외국인청(☎ 1345)에 연장 신청하세요. 기간 초과 체류는 강제 출국 사유가 됩니다.',
  },
  en: {
    '임금체불':  'Wage theft is a violation of the Labor Standards Act. ① Request in writing ② Report to Ministry of Employment (☎ 1350) ③ Apply for wage guarantee. The government can pay up to 3 months of unpaid wages.',
    '부당해고':  'Dismissal without just cause is unfair dismissal. Advance notice of 30 days is required. You can claim 30 days wages if violated. File a complaint with the Labor Relations Commission.',
    '산재':      'For industrial accidents: ① Immediate medical treatment ② Request accident report from employer ③ Apply to Korea Workers Compensation & Welfare Service (☎ 1588-0075).',
    '초과근무':  'Overtime allowance is 1.5x the base hourly rate. More than 12 hours per week of overtime is illegal. Use the wage calculator tab to calculate your pay.',
    '계약해지':  'Severance pay applies after 1 year of employment. Must be paid within 14 days of leaving. E-9 visa holders should review departure or visa change options.',
    '비자':      'For visa inquiries, contact the Immigration Office (☎ 1345). E-9 visa renewal must be done through your employer before expiry.',
  },
  vi: {
    '임금체불':  'Nợ lương là vi phạm Luật Lao động. ① Yêu cầu bằng văn bản ② Báo cáo với Bộ Lao động (☎ 1350) ③ Nộp đơn xin trợ cấp lương. Chính phủ có thể trả tối đa 3 tháng lương.',
    '부당해고':  'Sa thải không có lý do chính đáng là sa thải trái pháp luật. Cần thông báo trước 30 ngày. Nếu vi phạm, bạn có thể yêu cầu 30 ngày lương.',
    '산재':      'Khi tai nạn lao động xảy ra: ① Điều trị y tế ngay ② Yêu cầu chủ nợ báo cáo tai nạn ③ Nộp đơn lên Công ty Bồi thường NLĐ (☎ 1588-0075).',
    '초과근무':  'Phụ cấp làm thêm giờ là 1.5x lương cơ bản. Làm thêm hơn 12 giờ/tuần là bất hợp pháp. Sử dụng máy tính lương để tính toán.',
    '계약해지':  'Trợ cấp thôi việc áp dụng sau 1 năm làm việc. Phải được trả trong vòng 14 ngày. Người giữ visa E-9 cần xem xét về nước hoặc đổi visa.',
    '비자':      'Về thị thực, liên hệ Văn phòng Di trú (☎ 1345). Gia hạn visa E-9 phải thực hiện qua chủ sử dụng lao động trước khi hết hạn.',
  },
};

function getBotReply(msg) {
  const lang = currentLang in FAQ_DB ? currentLang : (currentLang in FAQ_DB ? currentLang : 'ko');
  const db = FAQ_DB[lang] || FAQ_DB['ko'];
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(db)) {
    if (lower.includes(key.toLowerCase())) return reply;
  }
  // 기본 응답
  const defaults = {
    ko: '질문을 이해했습니다. 더 구체적인 상담은 고용노동부 외국인 근로자 상담센터(☎ 1350, 다국어 지원)로 연락하시면 전문 상담원이 도와드립니다.',
    en: 'I understand your question. For more specific advice, please contact the Ministry of Employment\'s foreign worker counseling center (☎ 1350, multilingual support).',
    vi: 'Tôi hiểu câu hỏi của bạn. Để được tư vấn cụ thể hơn, hãy liên hệ trung tâm tư vấn NLĐ nước ngoài của Bộ Lao động (☎ 1350, hỗ trợ đa ngôn ngữ).',
  };
  return defaults[lang] || defaults['ko'];
}

function addChatMsg(type, text) {
  const wrap = document.getElementById('chat-messages');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'chat-msg ' + type;
  if (type === 'bot') {
    div.innerHTML = `<div class="chat-avatar">⚖️</div><div class="chat-bubble">${text}</div>`;
  } else {
    div.innerHTML = `<div class="chat-bubble">${text}</div>`;
  }
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  addChatMsg('user', msg);
  input.value = '';
  setTimeout(() => { addChatMsg('bot', getBotReply(msg)); }, 500);
}

function sendQuick(topic) {
  addChatMsg('user', topic);
  setTimeout(() => { addChatMsg('bot', getBotReply(topic)); }, 400);
}

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



// ==============================
// [신규] 이력서 자동번역
// ==============================
const JOB_TRANS = {
  vi: {
    'vận hành máy tiện': '선반 조작', 'hàn': '용접', 'may mặc': '봉제 작업',
    'nông nghiệp': '농업 작업', 'đánh bắt cá': '어획물 가공', 'lái xe nâng': '지게차 운전',
    'xây dựng': '건설 보조', 'nhà bếp': '주방 보조', 'lắp ráp': '조립 작업',
    'chế biến thực phẩm': '식품 가공', 'trồng trọt': '작물 재배',
  },
  en: {
    'lathe operation': '선반 조작', 'welding': '용접', 'sewing': '봉제 작업',
    'farming': '농업 작업', 'fishery': '어획물 가공', 'forklift': '지게차 운전',
    'construction': '건설 보조', 'kitchen assistant': '주방 보조', 'assembly': '조립 작업',
    'food processing': '식품 가공', 'crop cultivation': '작물 재배',
  },
  id: {
    'operasi mesin bubut': '선반 조작', 'pengelasan': '용접', 'menjahit': '봉제 작업',
    'pertanian': '농업 작업', 'perikanan': '어획물 가공', 'forklift': '지게차 운전',
    'konstruksi': '건설 보조', 'asisten dapur': '주방 보조',
  },
};

function translateJob(text, lang) {
  const dict = JOB_TRANS[lang] || {};
  const lower = text.toLowerCase().trim();
  for (const [k, v] of Object.entries(dict)) {
    if (lower.includes(k.toLowerCase())) return { text: v, found: true };
  }
  return { text, found: false };
}

let careerCount = 1;
function addCareerBlock() {
  careerCount++;
  const div = document.createElement('div');
  div.className = 'career-block';
  div.innerHTML = `
    <div class="career-block-header">
      <span class="career-block-title">경력 ${careerCount}</span>
      <button class="remove-career-btn" onclick="this.closest('.career-block').remove()">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">회사명 (현지어)</label>
      <input type="text" class="form-input career-company" placeholder="회사명" />
    </div>
    <div class="form-group">
      <label class="form-label">직무</label>
      <input type="text" class="form-input career-role" placeholder="직무명 (현지어)" />
    </div>
    <div style="display:flex;gap:8px;">
      <div class="form-group" style="flex:1;"><label class="form-label">시작</label><input type="month" class="form-input career-from" /></div>
      <div class="form-group" style="flex:1;"><label class="form-label">종료</label><input type="month" class="form-input career-to" /></div>
    </div>
    <div class="form-group">
      <label class="form-label">주요 업무</label>
      <input type="text" class="form-input career-desc" placeholder="간단히 입력" />
    </div>`;
  document.getElementById('career-blocks').appendChild(div);
}

const certInputsList = [];
function addCertInput() {
  const v = document.getElementById('cert-input-new').value.trim();
  if (!v) return;
  certInputsList.push(v);
  document.getElementById('cert-input-new').value = '';
  renderCertInputs();
}
function renderCertInputs() {
  document.getElementById('cert-inputs').innerHTML = certInputsList.map((c, i) =>
    `<div style="display:flex;align-items:center;gap:8px;background:#F3F4F6;padding:7px 10px;border-radius:8px;">
      <span style="flex:1;font-size:13px;">📜 ${c}</span>
      <button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;" onclick="removeCert(${i})">✕</button>
    </div>`
  ).join('');
}
function removeCert(i) { certInputsList.splice(i, 1); renderCertInputs(); }

function calcDuration(from, to) {
  if (!from || !to) return '';
  const f = new Date(from + '-01'), t2 = new Date(to + '-01');
  const months = (t2.getFullYear() - f.getFullYear()) * 12 + (t2.getMonth() - f.getMonth());
  const y = Math.floor(months / 12), m = months % 12;
  return (y > 0 ? y + '년 ' : '') + (m > 0 ? m + '개월' : '');
}

function generateResume() {
  const lang = document.getElementById('resume-lang').value;
  const name = document.getElementById('resume-name').value.trim() || '(미입력)';
  const addr = document.getElementById('resume-addr').value.trim() || '(미입력)';
  const user = getCurrentUser();

  // 정보 테이블
  document.getElementById('resume-info-table').innerHTML = `
    <tr><td>성 명</td><td>${name}</td><td>국 적</td><td>${user?.nation || '—'}</td></tr>
    <tr><td>비 자</td><td>${user?.visa || 'E-9'}</td><td>연락처</td><td>—</td></tr>
    <tr><td>주 소</td><td colspan="3">${addr}</td></tr>`;

  // 경력
  const blocks = document.querySelectorAll('.career-block');
  document.getElementById('resume-career-list').innerHTML = Array.from(blocks).map(b => {
    const company = b.querySelector('.career-company')?.value || '';
    const roleRaw = b.querySelector('.career-role')?.value || '';
    const from = b.querySelector('.career-from')?.value || '';
    const to   = b.querySelector('.career-to')?.value || '';
    const desc = b.querySelector('.career-desc')?.value || '';
    const translated = translateJob(roleRaw, lang);
    const dur = calcDuration(from, to);
    return `<div class="resume-career-item">
      <div class="resume-career-company">${company || '(회사명 미입력)'}</div>
      <div class="resume-career-meta">
        직무: ${translated.text}${!translated.found ? ' <span class="unverified">(번역 미확인)</span>' : ''}
        &nbsp;·&nbsp; ${from || '?'} ~ ${to || '?'}${dur ? ' (' + dur + ')' : ''}
      </div>
      ${desc ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">담당: ${desc}</div>` : ''}
    </div>`;
  }).join('') || '<div style="padding:10px;color:var(--text-muted);font-size:13px;">경력 없음</div>';

  // 기술
  const skills = Array.from(document.querySelectorAll('.skill-cb:checked')).map(cb => cb.value);
  document.getElementById('resume-skills').textContent = skills.length ? skills.join(' / ') : '—';

  // 자격증
  document.getElementById('resume-certs-out').textContent = certInputsList.length ? certInputsList.join(', ') : '—';

  // 푸터
  document.getElementById('resume-footer').textContent =
    `본 이력서는 WorkBridge Korea를 통해 자동 생성되었습니다. (생성일: ${new Date().toLocaleDateString('ko-KR')})`;

  document.getElementById('resume-preview-wrap').style.display = 'block';
  document.getElementById('resume-preview-wrap').scrollIntoView({ behavior: 'smooth' });
}

function copyResume() {
  const text = document.getElementById('resume-print-area').innerText;
  navigator.clipboard.writeText(text).then(() => showToast('📋 이력서가 복사되었습니다!', 'success'));
}

function saveResume() {
  const resumes = JSON.parse(localStorage.getItem('wb_resumes') || '[]');
  const data = {
    id: Date.now(),
    date: new Date().toLocaleDateString('ko-KR'),
    name: document.getElementById('resume-name').value.trim(),
    html: document.getElementById('resume-print-area').innerHTML,
  };
  resumes.unshift(data);
  if (resumes.length > 3) resumes.pop();
  localStorage.setItem('wb_resumes', JSON.stringify(resumes));
  showToast('💾 이력서가 저장되었습니다!', 'success');
  renderSavedResumes();
}

function renderSavedResumes() {
  const resumes = JSON.parse(localStorage.getItem('wb_resumes') || '[]');
  let el = document.getElementById('saved-resumes-section');
  if (!el) {
    el = document.createElement('div');
    el.id = 'saved-resumes-section';
    el.style.marginTop = '16px';
    const wrap = document.getElementById('resume-preview-wrap');
    if (wrap) wrap.after(el);
  }
  if (resumes.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="section-title" style="margin-bottom:10px;">💾 저장된 이력서 (최대 3개)</div>` +
    resumes.map(r => `
      <div style="background:#fff;border-radius:10px;padding:12px 16px;box-shadow:var(--shadow);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:13px;">📄 ${r.name || '이름 미입력'} — ${r.date}</span>
        <button class="btn btn-outline btn-sm" onclick="loadResume(${r.id})">불러오기</button>
      </div>`).join('');
}

function loadResume(id) {
  const resumes = JSON.parse(localStorage.getItem('wb_resumes') || '[]');
  const r = resumes.find(rv => rv.id === id);
  if (!r) return;
  document.getElementById('resume-print-area').innerHTML = r.html;
  document.getElementById('resume-preview-wrap').style.display = 'block';
  document.getElementById('resume-preview-wrap').scrollIntoView({ behavior: 'smooth' });
  showToast('📄 이력서를 불러왔습니다.', 'success');
}

// ==============================
// 7. 초기화
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  // 언어 복원
  const supportedInSelect = ['ko','en','vi','tl','uz','km','id','ne','my','si','th'];
  const dlEl = document.getElementById('desktop-lang');
  const mlEl = document.getElementById('mobile-lang');
  if (dlEl && supportedInSelect.includes(currentLang)) dlEl.value = currentLang;
  if (mlEl && supportedInSelect.includes(currentLang)) mlEl.value = currentLang;

  // 세션 복원
  const user = getCurrentUser();
  if (user) updateAuthUI(user);

  // 국가 선택 복원
  restoreCountrySelection();

  // 데이터 렌더
  renderJobCards(JOBS);
  renderEduCards();
  applyLang();

  // 모달 바깥 클릭 닫기
  document.getElementById('job-login-modal').addEventListener('click', function(e) {
    if (e.target === this) closeJobModal();
  });
  document.getElementById('job-detail-modal').addEventListener('click', function(e) {
    if (e.target === this) closeJobDetailModal();
  });
});
