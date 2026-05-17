/*
=======================================================================
  WorkBridge Korea v3 — data/jobs.js
  구인공고 데이터
=======================================================================

  ★ 공고 추가/수정/삭제 방법
  ──────────────────────────────────────────────────────────────
  JOBS 배열 안에 객체 하나 = 공고 하나입니다.
  아래 형식을 복사해서 배열 안에 추가하세요.

  {
    id: 9,                          ← 고유 번호 (기존 번호와 절대 겹치면 안 됨)
    company: '회사명',
    sector: '제조업',               ← '제조업' / '농·축산업' / '건설업' / '어업' / '음식·숙박'
                                       (index.html 필터 드롭다운 옵션과 일치해야 합니다)
    role: '직종명',
    region: '경기',                 ← '경기' / '충남' / '경남' / '전남' / '경북' / '서울'
                                       (index.html 필터 드롭다운 옵션과 일치해야 합니다)
    city: '경기도 수원시',
    salary: '230만원',
    salaryRange: '230~250만원',
    visa: ['E-9'],                  ← 가능한 비자 배열. ['E-9','H-2'] 처럼 여러 개 가능
    safetyReq: true,                ← 안전교육 필수 여부 (true / false)
    contact: '담당자명',
    email: 'recruit@example.com',
    workHours: '09:00~18:00',
    workDays: '주 5일',
    contractType: '계약직 (1년)',
  },

  ⚠️ 절대 바꾸면 안 되는 것
  ──────────────────────────────────────────────────────────────
  - 필드 이름(id, company, sector 등) → app.js의 renderJobCards()가 참조합니다.
  - id 값 중복 → 지원 내역 저장이 꼬입니다.
=======================================================================
*/

const JOBS = [
  { id:1, company:'㈜한국정밀제조', sector:'제조업', role:'선반 조작', region:'경기', city:'경기도 안산시 단원구', salary:'240만원', salaryRange:'240~260만원', visa:['E-9'], safetyReq:true,
    contact:'김철수 팀장', email:'recruit@hkmanufacture.kr', workHours:'09:00~18:00', workDays:'주 5일 (월~금)', contractType:'계약직 (1년, 연장가능)' },
  { id:2, company:'대명농업법인', sector:'농·축산업', role:'비닐하우스 작업', region:'충남', city:'충청남도 논산시', salary:'210만원', salaryRange:'210~230만원', visa:['E-9','H-2'], safetyReq:true,
    contact:'박민준 대리', email:'jobs@daemyung-farm.co.kr', workHours:'07:00~17:00', workDays:'주 5일 (계절조정)', contractType:'계약직 (6개월)' },
  { id:3, company:'블루오션수산', sector:'어업', role:'어획물 가공', region:'전남', city:'전라남도 여수시', salary:'250만원', salaryRange:'250~280만원', visa:['E-9'], safetyReq:true,
    contact:'이성호 과장', email:'hr@blueocean-fish.com', workHours:'06:00~15:00', workDays:'주 5일 (교대)', contractType:'계약직 (1년)' },
  { id:4, company:'㈜세원건설', sector:'건설업', role:'철근 조립 보조', region:'경기', city:'경기도 화성시', salary:'270만원', salaryRange:'270~300만원', visa:['E-9'], safetyReq:true,
    contact:'최준혁 소장', email:'recruit@sewon-const.kr', workHours:'08:00~17:00', workDays:'주 5~6일', contractType:'일용직 (현장별)' },
  { id:5, company:'참이슬식품', sector:'음식·숙박', role:'주방 보조', region:'서울', city:'서울 마포구', salary:'220만원', salaryRange:'220~240만원', visa:['H-2','F-4'], safetyReq:false,
    contact:'황소연 팀장', email:'jobs@champfood.kr', workHours:'10:00~22:00', workDays:'주 5일 (교대)', contractType:'정규직' },
  { id:6, company:'㈜코리아텍스', sector:'제조업', role:'봉제 작업', region:'경기', city:'경기도 의정부시', salary:'225만원', salaryRange:'225~245만원', visa:['E-9','H-2'], safetyReq:true,
    contact:'윤지훈 팀장', email:'hr@koreatex.co.kr', workHours:'09:00~18:00', workDays:'주 5일', contractType:'계약직 (1년)' },
  { id:7, company:'하나로농원', sector:'농·축산업', role:'과수 수확', region:'경북', city:'경상북도 안동시', salary:'200만원', salaryRange:'200~210만원', visa:['E-9'], safetyReq:false,
    contact:'강원철 대표', email:'hanaro@farm.co.kr', workHours:'07:00~16:00', workDays:'주 5일', contractType:'계절직 (4~11월)' },
  { id:8, company:'㈜동양기계', sector:'제조업', role:'프레스 보조', region:'경남', city:'경상남도 창원시', salary:'255만원', salaryRange:'255~275만원', visa:['E-9'], safetyReq:true,
    contact:'정태영 과장', email:'recruit@dongyang-mach.kr', workHours:'08:30~17:30', workDays:'주 5일', contractType:'계약직 (1년, 연장가능)' },
];

const SECTOR_ICON = { '제조업':'⚙️','농·축산업':'🌾','건설업':'🏗️','어업':'🐟','음식·숙박':'🍽️' };