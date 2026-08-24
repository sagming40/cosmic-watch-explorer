# Cosmic Watch & Explorer

NASA 공개 데이터를 활용한 지구 근접 소행성(NEO) 모니터링 및 외계행성 탐색 포털.

접근하는 소행성이 얼마나 가까운지, 외계행성이 지구와 얼마나 비슷한지를 **숫자가 아니라 감각으로** 확인할 수 있게 만드는 것이 목표다.

> **개발 진행 중** — 현재 설계 문서 작성 완료, 구현 착수 단계.

---

## 이 프로젝트가 푸는 문제

NASA API는 소행성의 접근 거리를 `4,821,033 km` 같은 숫자로 준다. 이 숫자만으로는 가까운 건지 먼 건지 판단할 수 없다.

이 서비스는 모든 거리를 **달까지의 거리(384,400 km)를 기준으로 환산**해서 함께 보여준다. `12.5 LD`라고 하면 "달보다 12배 넘게 멀다"가 즉시 이해된다.

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Frontend | React, Vite, Recharts |
| Database | MariaDB |
| 인증 | Django 세션 인증 (httpOnly 쿠키) |
| 외부 데이터 | NASA NeoWs API, NASA Exoplanet Archive |

### 주요 기술 선택 근거

- **Django** — 외계행성 다중 조건 검색(9개 조건 조합)이 핵심 기능이라 ORM 표현력을 우선했다. Django Admin으로 관리자 페이지 개발 비용을 없앴다.
- **세션 인증** — 서버 1대 규모라 무상태(stateless)의 이점이 없고, 즉시 로그아웃과 `httpOnly` 쿠키의 XSS 방어가 더 중요하다고 판단했다.
- **Recharts** — React 컴포넌트 형태라 JSX 안에서 바로 쓸 수 있다. D3는 SVG를 직접 다뤄야 해 학습 비용이 크다.

---

## 주요 기능

### 구현 예정

- [ ] 날짜별 지구 근접 소행성 조회
- [ ] NASA API 데이터 수집 및 DB 캐싱
- [ ] 달 거리(LD) 기준 접근 거리 시각화
- [ ] 소행성 상세 정보 (궤도 요소, 접근 이력)
- [ ] 외계행성 다중 조건 검색 (9개 조건, 서버 페이징)
- [ ] 외계행성 상세 정보 및 모항성 정보
- [ ] 지구·소행성·외계행성 크기 비교
- [ ] 회원가입 / 로그인
- [ ] 관심 천체 Watchlist

### 범위에서 제외

실시간 천체 위치 추적, 3D 시뮬레이션, 자체 궤도 계산 엔진, 별도 관리자 페이지, 소셜 기능.

---

## 설계 문서

| 문서 | 내용 |
|---|---|
| [`01_requirements_and_features.md`](docs/01_requirements_and_features.md) | 요구사항, 기능 명세, MVP 범위, 우선순위 |
| [`02_database_design.md`](docs/02_database_design.md) | ERD, 테이블 9개 정의, DDL, 인덱스 전략, NASA 필드 매핑 |
| [`03_user_scenarios_and_uiux.md`](docs/03_user_scenarios_and_uiux.md) | 사용자 시나리오, 화면 설계, 디자인 토큰, 컴포넌트 목록 |
| [`04_api_specification.md`](docs/04_api_specification.md) | 엔드포인트 17개, 요청/응답 형식, 오류 규약 |
| [`DEVLOG.md`](DEVLOG.md) | 개발 기록 |

---

## 프로젝트 구조

```text
cosmic-watch-explorer/
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── exception_handler.py     # 공통 오류 응답 형식
│   ├── apps/
│   │   ├── accounts/                # 인증
│   │   ├── astronomy/               # NEO + Exoplanet
│   │   │   ├── models.py
│   │   │   ├── filters.py           # 다중 조건 검색
│   │   │   └── services/            # 외부 API 통신 격리
│   │   │       ├── nasa_neo.py
│   │   │       └── exoplanet_archive.py
│   │   └── watchlist/
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # axios 클라이언트
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── docs/
└── README.md
```

---

## 실행 방법

### 사전 요구사항

- Python 3.11 이상
- Node.js 20 이상
- MariaDB 10.6 이상
- NASA API 키 ([api.nasa.gov](https://api.nasa.gov)에서 무료 발급)

### 1. 데이터베이스 준비

```sql
CREATE DATABASE cosmic_watch
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

### 2. 백엔드

```bash
cd backend

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env              # 값을 채워 넣을 것

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

백엔드는 `http://localhost:8000` 에서 실행된다.

### 3. 프론트엔드

```bash
cd frontend

npm install
npm run dev
```

프론트엔드는 `http://localhost:5173` 에서 실행된다.

> Vite 프록시가 `/api` 요청을 `localhost:8000`으로 전달하므로, 브라우저 입장에서는 동일 출처가 된다. CORS 설정이 필요 없고 세션 쿠키가 정상 동작한다.

### 4. 초기 데이터 수집

외계행성 데이터는 한 번 수집해두면 자주 바뀌지 않는다.

```bash
python manage.py fetch_exoplanets
```

소행성 데이터는 사용자가 날짜를 조회할 때 자동으로 수집된다.

---

## 환경 변수

`backend/.env`

```ini
SECRET_KEY=your-django-secret-key
DEBUG=True

DB_NAME=cosmic_watch
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=127.0.0.1
DB_PORT=3306

NASA_API_KEY=your-nasa-api-key
```

> `.env`는 절대 커밋하지 않는다. `.gitignore`에 포함되어 있다.
> NASA API 키가 노출되면 [api.nasa.gov](https://api.nasa.gov)에서 재발급받을 것.

---

## API 요약

전체 명세는 [`04_api_specification.md`](docs/04_api_specification.md) 참조.

| Method | 경로 | 설명 |
|---|---|---|
| GET | `/api/neo/?date=` | 날짜별 소행성 목록 + 요약 |
| GET | `/api/neo/{nasa_id}/` | 소행성 상세 |
| GET | `/api/exoplanets/?...` | 외계행성 다중 조건 검색 |
| GET | `/api/exoplanets/{id}/` | 외계행성 상세 |
| GET | `/api/exoplanets/meta/` | 필터 선택지 및 값 범위 |
| POST | `/api/auth/login/` | 로그인 |
| GET/POST/DELETE | `/api/watchlist/neo/` | 관심 소행성 |

---

## 개발 워크플로우

마일스톤(M0~M6) 단위로 브랜치를 나눠 작업했다.

```text
main
  │
  ├── M0-환경구성 ──── PR #1 ──┐
  │                            │
  ├── M1-data-layer ── PR #2 ──┤──▶ main
  │                            │
  ├── M2-backend-api ─ PR #3 ──┘
  ...
```

각 마일스톤이 끝나면 PR을 올리고, PR 설명에 `docs/05_milestones.md`의 해당 마일스톤 완료 기준 체크리스트를 그대로 포함시켰다. 1인 프로젝트라 실질적인 코드 리뷰는 아니지만, **각 PR이 "무엇을 검증하고 병합했는지"의 기록**으로 남도록 하기 위함이다.

커밋 메시지는 `type(M{n}): 내용` 형식(`feat`, `fix`, `docs`, `refactor`, `test`, `chore`)을 따랐고, 백엔드와 프론트엔드를 같은 세션에서 수정했을 때는 커밋을 분리해 되돌리기 쉽도록 했다.

전체 진행 기록은 [`DEVLOG.md`](DEVLOG.md)에, 마일스톤별 계획과 완료 기준은 [`docs/05_milestones.md`](docs/05_milestones.md)에 있다.

---

## 데이터 출처

- [NASA NeoWs (Near Earth Object Web Service)](https://api.nasa.gov/)
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)

이 프로젝트는 NASA의 공개 데이터를 사용하며, NASA와 공식적인 제휴 관계가 없다.

---

## 작성자

사공민규 — 한국폴리텍II대학 인천캠퍼스 컴퓨터공학과 하이테크과정 (2026)
