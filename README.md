# 🌉 WorkBridge Korea v3

외국인 근로자를 위한 취업·안전교육 플랫폼 (11개 언어 지원)

---

## 🌿 브랜치 운영 안내

팀 작업 시에는 `main`에 바로 작업하지 말고, 각자 담당 브랜치에서 작업한 뒤 `develop-team-integration`으로 Pull Request를 보내주세요.

| 브랜치 | 용도 |
|---|---|
| `main` | 배포용 안정 브랜치 |
| `develop-team-integration` | 팀 작업 통합 브랜치 |
| `feature/01-split-files-before-team-work` | 먼저 파일 구조 쪼개는 작업용 |
| `feature/02-login-signup-profile-resume` | 로그인, 회원가입, 내 정보, 이력서 |
| `feature/03-job-list-detail-apply-flow` | 구인공고, 필터, 공고 상세, 지원하기 |
| `feature/04-safety-education-certificates` | 안전교육, 수료증, 집체교육 |
| `feature/05-labor-wage-calculator-visa-chatbot` | 노무 서비스, 임금계산기, 챗봇, 비자 안내 |
| `feature/06-ui-mobile-responsive-polish` | CSS, 모바일 반응형, UI 정리 |

권장 흐름:

```bash
git checkout develop-team-integration
git pull
git checkout -b feature/03-job-list-detail-apply-flow
```

작업 완료 후에는 본인 기능 브랜치에서 `develop-team-integration`으로 PR을 만들고, 테스트 후 `main`에 합칩니다.

### 팀원 작업 방법

1. 처음 참여하는 팀원은 저장소를 복사합니다.

```bash
git clone https://github.com/parkwoohyeon/GYR.git
cd GYR
```

2. 최신 브랜치 목록을 받아옵니다.

```bash
git fetch --all
```

3. 본인 담당 브랜치로 이동합니다.

```bash
git checkout feature/03-job-list-detail-apply-flow
```

4. 작업 전에는 항상 최신 내용을 가져옵니다.

```bash
git pull
```

5. 파일을 수정한 뒤 커밋하고 GitHub에 올립니다.

```bash
git add .
git commit -m "작업 내용 요약"
git push
```

6. GitHub에서 Pull Request를 만듭니다.

- 기준 브랜치: `develop-team-integration`
- 비교 브랜치: 본인 담당 `feature/...` 브랜치
- PR 제목에는 어떤 기능을 수정했는지 짧게 적습니다.
- PR 설명에는 수정한 파일, 테스트한 내용, 남은 작업을 적습니다.

### 작업 규칙

- `main` 브랜치에는 직접 커밋하지 않습니다.
- 다른 팀원이 담당한 브랜치에서 작업하지 않습니다.
- 작업 시작 전 `git pull`을 먼저 실행합니다.
- 충돌이 나면 혼자 강제로 덮어쓰지 말고 팀원에게 먼저 공유합니다.
- 기능이 완성되면 바로 `main`이 아니라 `develop-team-integration`으로 PR을 보냅니다.
- `feature/01-split-files-before-team-work`가 먼저 정리되면, 다른 기능 브랜치는 그 변경 내용을 기준으로 맞춰 작업합니다.

---

## 📁 파일 구조

```
workbridge-v3/
├── index.html          ← 메인 HTML (화면 구조 전체)
├── README.md           ← 이 파일
├── css/
│   └── style.css       ← 디자인·레이아웃
├── js/
│   ├── i18n.js         ← 다국어 번역 딕셔너리 + 언어 전환
│   ├── app.js          ← 앱 핵심 로직
│   └── chatbot.js      ← AI 챗봇 (Claude API) ⚠️ 수정 금지
└── data/
    ├── jobs.js         ← 구인공고 데이터 ★ 자주 수정
    └── courses.js      ← 안전교육 과목 데이터
```

---

## ✏️ 자주 하는 수정

### 구인공고 추가/수정
→ `data/jobs.js` 파일의 `JOBS` 배열 수정

### 번역 텍스트 수정
→ `js/i18n.js` 파일에서 해당 언어 블록 찾아 값만 수정

### 색상 테마 변경
→ `css/style.css` 맨 위 `:root { }` 안의 `--primary`, `--secondary` 등 수정

### AI 챗봇 답변 범위 조정
→ `js/chatbot.js` 의 `SYSTEM_PROMPT` 텍스트 수정  
→ 최저임금 변경 시: SYSTEM_PROMPT 안 금액 + `app.js`의 `checkMinWage()` 안 `10030` 값 함께 수정

---

## ⚠️ 절대 건드리면 안 되는 것

| 항목 | 이유 |
|------|------|
| `js/chatbot.js` 의 `fetch()` 코드 | Claude API 서버 직접 통신. 수정 시 AI 챗봇 작동 안 함 |
| `localStorage` 키 이름 (`wb_lang`, `wb_session` 등) | 변경 시 저장된 사용자 데이터 사라짐 |
| `index.html` 의 `id="..."` 속성값 | JS 함수들이 이 id로 요소를 찾음 |
| `data-i18n="..."` 속성값 | 번역 키와 1:1 대응. 바꾸면 번역 안 됨 |
| `<script src="...">` 로딩 순서 | 파일 간 의존성 존재 |

---

## 🚀 실행 방법

GitHub Pages, Netlify, Vercel 등에 폴더 통째로 업로드하거나  
로컬에서는 VS Code의 Live Server 확장으로 실행하세요.

> ⚠️ `index.html`을 브라우저에서 직접 파일로 열면 (`file://`) JS 파일 로딩이 안 될 수 있습니다.  
> 반드시 웹 서버를 통해 실행하세요.

---

## 🌐 지원 언어

한국어 · 영어 · 베트남어 · 필리핀어 · 우즈베크어 · 크메르어 · 인도네시아어 · 네팔어 · 미얀마어 · 싱할라어 · 태국어
