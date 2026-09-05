# 마일스톤

| 항목 | 내용 |
|---|---|
| 문서 번호 | 05 |
| 문서명 | 마일스톤 |
| 프로젝트명 | Cosmic Watch & Explorer |
| 작성자 | 사공민규 |
| 버전 | v1.6 |
| 최종 수정일 | 2026-09-05 |
| Tier | 1 (매 세션 / 매 마일스톤 갱신) |

**변경 이력**

| 버전 | 일자 | 내용 |
|---|---|---|
| v1.0 | 2026-08-24 | 최초 작성. M0~M6 구간 및 완료 기준 확정. 소요 기간은 잠정 추정치 |
| v1.1 | 2026-08-30 | M1 범위 표 "모델 9개" → "모델 8개" 정정 (설계 문서 작성 시 auth_user를 잘못 포함해 계산한 오류) |
| v1.2 | 2026-08-31 | M1 완료 처리 — 완료 기준 7개 전부 충족, 상태 🔄→✅. 147줄 "테이블 9개" 오기 정정 (v1.1에서 누락됐던 부분) |
| v1.3 | 2026-09-01 | M2 NEO API 착수분 반영 — `GET /api/neo/`, 달 거리(LD) 환산 로직 완료 체크 |
| v1.4 | 2026-09-02 | M2 NEO 상세 수집 서비스(`fetch_neo_detail`, NASA Lookup API) 반영 — 계획에 없던 작업 체크박스 신설 |
| v1.5 | 2026-09-04 | M2 `GET /api/neo/{nasa_id}/`, `GET /api/neo/{nasa_id}/approaches/` 완료 체크. 404 응답 형식 완료 기준 충족 |
| v1.6 | 2026-09-05 | M2 Exoplanet API(`filters.py`, 목록/상세/메타) 완료 체크. 파섹 → 광년 변환 체크박스 신설(계획에 없던 작업). N+1 완료 기준 문구 정정. NEO 캐시 완료 기준 2건 체크 |

---

## 1. 이 문서의 사용법

### 1.1 소요 기간은 잠정치다

아직 코드를 한 줄도 작성하지 않은 시점에 쓴 문서다. **여기 적힌 기간은 전부 추정이며 근거가 없다.** Django ORM 필터링이 30분 걸릴지 3시간 걸릴지는 실제로 해보기 전에는 알 수 없다.

따라서 이 문서의 기간은 **DEVLOG의 실측 기록으로 계속 보정한다.**

```text
M0 착수 → 실제 소요일 DEVLOG에 기록
              ↓
M0 완료 시점에 M1~M6 추정치 재조정
              ↓
이 문서 변경 이력에 "M0 실측 기반 재조정" 남김
```

밀렸다는 사실 자체는 문제가 아니다. **밀린 것을 모르는 채로 진행하는 것**이 문제다.

### 1.2 상태 표기

| 기호 | 의미 |
|---|---|
| ⬜ | 착수 전 |
| 🔄 | 진행 중 |
| ✅ | 완료 (완료 기준 전부 충족) |

> 하위 체크박스가 일부만 채워진 상태에서 상위 마일스톤을 ✅로 바꾸지 않는다. 완료 기준이 **전부** 충족돼야 한다.

### 1.3 완료 기준은 "속을 수 없는 형태"로 쓴다

"동작함", "구현 완료" 같은 표현은 쓰지 않는다. **판정 가능한 문장**만 쓴다.

| ❌ 이렇게 쓰지 않는다 | ⭕ 이렇게 쓴다 |
|---|---|
| Watchlist가 동작한다 | 계정 2개로 각각 저장한 뒤 교차 로그인하면 서로의 항목이 보이지 않는다 |
| NASA 수집이 된다 | `close_approach` 행 수가 NASA 응답의 `element_count`와 일치한다 |
| 검색이 잘 된다 | 조건 3개를 동시에 걸었을 때 SQL 로그에 쿼리가 1회만 찍힌다 |

---

## 2. 전체 구간 및 상태

| # | 마일스톤 | 범위 | 잠정 소요 | 상태 |
|---|---|---|---|---|
| M0 | 개발 환경 구성 | Django + MariaDB + Git | 3~5일 (실측 1일) | ✅ |
| M1 | 데이터 계층 | 모델 8개 + NASA 수집 서비스 | 1.5~2주 (실측: 8/25~8/31, 약 6일) | ✅ |
| M2 | 백엔드 완성 | API 17개 + 인증 + Watchlist | 2~3주 | 🔄 |
| M3 | 프론트 기반 | React 연결 + NEO 화면 | 1.5~2주 | ⬜ |
| M4 | **v1.0 완성** | 외계행성 + 인증 + Watchlist + 크기비교 | 2~3주 | ⬜ |
| M5 | 완성도 | 상태 화면 + 반응형 + 접근성 | 1~1.5주 | ⬜ |
| M6 | 배포 및 정리 | 배포 + 포트폴리오 문서 | 1주 | ⬜ |

**합계 잠정 10~14주** · 착수 2026-08-24 기준 종료 예상 2026-11-02 ~ 2026-11-30

> 하이테크과정 종료(2026-12-18)까지 **2.5~5주의 여유**가 남는 계산이다. 이 여유는 일정 지연 흡수용으로 남겨둔다. 새 기능을 넣는 데 쓰지 않는다.

### 2.1 v1.0 경계

**M4 종료 시점이 v1.0이다.** 이 시점에 `01_requirements_and_features.md` 9장의 MVP 완료 기준이 **전부** 충족되어야 한다.

M5·M6는 v1.0을 다듬고 세상에 내놓는 구간이지, 기능을 추가하는 구간이 아니다.

### 2.2 백엔드를 M2에서 전부 끝내는 이유

Django와 React를 처음 다루므로, 두 스택을 섞어 진행하면 오류가 났을 때 **어느 쪽 문제인지 판별할 수 없다.**

M2가 끝나는 시점에는 브라우저에서 `http://localhost:8000/api/neo/` 를 직접 열어 JSON을 눈으로 확인할 수 있어야 한다. 이 상태가 되면 이후 프론트에서 문제가 생겼을 때 "백엔드는 확실히 정상"이라는 기준선을 갖고 디버깅할 수 있다.

---

## 3. M0 — 개발 환경 구성

**목표**: `python manage.py runserver`와 `npm run dev`가 각각 실행되고, Django가 MariaDB에 붙는다.

### 작업

- [x] Git 저장소 생성 및 `.gitignore` 작성 (`.env`, `venv/`, `node_modules/` 포함)
- [x] `backend/` Django 프로젝트 생성 (`config` 설정 모듈)
- [x] 가상환경 + `requirements.txt` (django, djangorestframework, mysqlclient, python-dotenv, requests, django-filter)
- [x] MariaDB `cosmic_watch` 데이터베이스 생성 (utf8mb4)
- [x] `.env` / `.env.example` 작성 — `SECRET_KEY`, DB 접속 정보, `NASA_API_KEY`
- [x] `settings.py` DB 설정 및 환경변수 로딩
- [x] `frontend/` Vite + React 프로젝트 생성
- [x] `vite.config.js` 프록시 설정 (`/api` → `localhost:8000`)
- [x] NASA API 키 발급 및 `.env` 등록
- [x] 문서 6종을 `docs/`에 배치하고 첫 커밋

### 완료 기준

- [x] `python manage.py migrate` 가 오류 없이 끝나고, HeidiSQL에 `django_migrations` 등 기본 테이블이 보인다
- [x] `python manage.py runserver` 후 브라우저에서 Django 기본 페이지가 뜬다
- [x] `npm run dev` 후 `localhost:5173` 에서 React 페이지가 뜬다
- [x] `git status` 에 `.env`가 나타나지 않는다
- [x] 원격 저장소에서 `.env` 파일이 조회되지 않는다

> **막힐 가능성이 가장 높은 지점**: `mysqlclient` 설치. Windows에서 빌드 도구가 없으면 실패한다. 대안으로 `PyMySQL`을 쓰는 방법이 있으니 30분 이상 붙잡지 말 것.

---

## 4. M1 — 데이터 계층

**목표**: NASA에서 데이터를 받아 MariaDB에 저장하는 경로를 뚫는다. **이 프로젝트의 심장이다.**

### 작업

#### 모델

- [x] `apps/astronomy/models.py` — `Neo`, `CloseApproach`, `OrbitalData`, `HostStar`, `Exoplanet`, `NeoFetchLog`
- [x] `apps/watchlist/models.py` — `NeoWatchlist`, `ExoplanetWatchlist`
- [x] `makemigrations` → 생성된 SQL 확인 (`sqlmigrate`)
- [x] `migrate` 실행
- [x] 마이그레이션 파일 커밋

#### NASA 수집 서비스

- [x] `services/nasa_neo.py` — `fetch_feed(date)` 구현
- [x] 숫자 문자열 → Decimal 형변환 처리
- [x] `"2026-Aug-21 03:16"` 형식 파싱
- [x] `NeoFetchLog` 기록
- [x] `services/exoplanet_archive.py` — TAP 쿼리로 필요한 컬럼만 SELECT
- [x] `manage.py fetch_exoplanets` 커스텀 커맨드
- [x] Django Admin 등록 (데이터 확인용)

### 완료 기준

- [x] HeidiSQL에서 테이블 **8개**(Django 기본 제외)가 모두 확인된다
- [x] `sqlmigrate`로 확인한 `CREATE TABLE` 문이 `02_database_design.md` 6장 DDL과 컬럼·제약 기준으로 일치한다
- [x] shell에서 `fetch_feed('2026-08-21')` 실행 후, `close_approach` 행 수가 NASA 응답의 `element_count`와 **일치한다**
- [x] 같은 날짜로 `fetch_feed`를 **두 번** 실행해도 `close_approach` 행 수가 늘어나지 않는다 (UNIQUE 제약 검증)
- [x] `fetch_exoplanets` 실행 후 `exoplanet` 행 수가 5,000건 이상이다
- [x] `exoplanet` 테이블에 `radius_earth IS NULL` 인 행이 **존재한다** (NULL을 0으로 바꾸지 않았음을 증명)
- [x] Django Admin에서 소행성 목록이 조회된다

> M1 완료 시점에 **React는 아직 한 줄도 건드리지 않은 상태**여야 한다.

---

## 5. M2 — 백엔드 완성

**목표**: `04_api_specification.md`의 엔드포인트 17개가 전부 동작한다. 브라우저에서 JSON으로 확인 가능.

### 작업

#### 공통

- [x] `config/exception_handler.py` — 공통 오류 응답 형식
- [x] 커스텀 페이지네이션 (`page`, `total_pages` 포함)
- [x] DRF 스로틀 설정 (NASA 호출 구간)

#### NEO API

- [x] `GET /api/neo/` — 캐시 판정 → NASA 호출 → 요약 계산 → 응답
- [x] 달 거리(LD) 환산 로직 (서버에서 계산)
- [x] `services/nasa_neo.py` — `fetch_neo_detail(nasa_id)` 구현 (NASA Lookup API 수집)
      - ⭐ 계획에 없던 작업 — Feed API로는 5.2/5.3에 필요한 궤도 정보·전체 접근 기록을 얻을 수 없음을 M2 진행 중 발견해 추가
- [x] `GET /api/neo/{nasa_id}/`
- [x] `GET /api/neo/{nasa_id}/approaches/`

#### Exoplanet API

- [x] `filters.py` — 다중 조건 검색
- [x] 광년 → 파섹 변환 (검색 조건 변환용, 반올림 없음)
- [x] 파섹 → 광년 변환
      - ⭐ 계획에 없던 작업 — 6.1/6.2 응답의 `distance_ly`, 6.3 `ranges.distance_ly`에 필요하다는 걸 구현 중 발견해 추가. 검색 조건용(ly→pc)과 반올림 정책이 다름 (표시용은 소수 2자리 반올림)
- [x] `GET /api/exoplanets/`
- [x] `GET /api/exoplanets/{id}/`
- [x] `GET /api/exoplanets/meta/` (+ 1시간 캐싱)
      - ※ 캐싱 구현 방식이 명세와 다름 — `cache_page` 대신 직접 캐싱으로 변경 (`04_api_specification.md` v1.3 반영, 사유는 해당 문서 6.3절 참조)

#### 인증 · Watchlist

- [ ] `GET /api/auth/csrf/`, `/me/`, `POST /login/`, `/signup/`, `/logout/`
- [ ] Watchlist GET / POST / DELETE (NEO · Exoplanet)
- [ ] `is_watchlisted` 필드 (상세 응답에만)

### 완료 기준

- [x] 브라우저에서 `/api/neo/?date=2026-08-21` 접속 시 `summary`와 `results`가 함께 담긴 JSON이 보인다
- [x] 같은 날짜를 두 번째 조회할 때 `cache.is_cached`가 `true`이고, `NeoFetchLog` 행 수가 조회 전후로 그대로다
      - 원래 문구 "NASA 요청 로그가 찍히지 않는다"는 실측 불가능해 DB 행 수 비교로 교체 — `fetch_date`에 UNIQUE 제약이 있어 중복 호출 시 반드시 에러가 나므로 이 방식이 "속을 수 없다"
- [x] 존재하지 않는 `nasa_id` 조회 시 `04_api_specification.md` 1.4절 형식의 `404` 응답이 온다
- [x] 검색 조건 3개(`radius_min`, `radius_max`, `distance_max_ly`)를 동시에 걸었을 때 **host_star 추가 조회가 0회**다 (`select_related` 검증)
      - 원래 문구 "쿼리가 1회만"은 실측 불가능 — 페이지네이션의 COUNT 쿼리가 별도로 1회 더 나가 정상 구현도 2회가 나온다. "20건마다 host_star를 따로 조회하지 않는다"가 select_related 검증의 실제 목적이므로 문구를 이걸로 교체
- [ ] 계정 2개를 만들어 각각 다른 소행성을 Watchlist에 저장한 뒤, 교차 로그인하면 **서로의 항목이 보이지 않는다**
- [ ] 같은 소행성을 두 번 `POST` 하면 `409`가 반환된다
- [ ] 로그아웃 후 `GET /api/watchlist/neo/` 호출 시 `401`이 반환된다
- [ ] 로그인 실패 응답에 아이디 존재 여부가 드러나지 않는다

> **여기서 멈추고 확인할 것**: M2가 끝나면 이 프로젝트의 백엔드는 사실상 완성이다. 이후 문제는 대부분 프론트 문제라고 판단해도 된다.

---

## 6. M3 — 프론트 기반

**목표**: React가 Django API와 통신하고, NEO 대시보드와 상세 화면이 뜬다.

### 작업

- [ ] `src/api/client.js` — axios 인스턴스 (`withCredentials`, CSRF 헤더)
- [ ] 라우팅 설정 (React Router)
- [ ] 디자인 토큰 적용 (`03_user_scenarios_and_uiux.md` 2장 — 색·타이포·간격)
- [ ] `Header` 컴포넌트
- [ ] `DataField` 공통 컴포넌트 (수치 Mono 서체 자동 적용)
- [ ] **NEO 대시보드** — `DateNavigator`, `NeoSummary`, `NeoListItem`
- [ ] **`LunarDistanceBar`** — 시그니처 스케일 바 (로그 스케일, 1 LD 기준선)
- [ ] **NEO 상세** — `ApproachTable`, `OrbitPanel`, "더 보기" 페이징

### 완료 기준

- [ ] `localhost:5173` 접속 시 오늘 날짜 소행성 목록이 표시된다
- [ ] 브라우저 개발자도구 Network 탭에서 요청이 `localhost:5173/api/...` 로 나가고 **CORS 오류가 없다**
- [ ] 날짜를 어제로 바꾸면 목록이 갱신된다
- [ ] 스케일 바에서 1 LD 기준선 왼쪽 항목만 `--hazard` 색으로 표시된다
- [ ] 목록 항목 클릭 시 상세로 이동하고, 새로고침해도 같은 페이지가 유지된다
- [ ] 접근 기록이 5건 초과인 소행성에서만 "더 보기"가 나타난다
- [ ] 화면 어디에도 `384400`이라는 숫자가 프론트 코드에 하드코딩되어 있지 않다

---

## 7. M4 — v1.0 완성

**목표**: `01_requirements_and_features.md` 9장 MVP 완료 기준을 전부 충족한다.

### 작업

#### 외계행성

- [ ] `FilterPanel` — 9개 조건 입력
- [ ] `FilterChips` — 적용된 조건 표시 및 개별 해제
- [ ] 검색 조건을 URL 쿼리스트링에 반영
- [ ] 목록 + 페이징
- [ ] 외계행성 상세 + `HostStarPanel` + `sibling_planets`

#### 인증 · Watchlist

- [ ] 로그인 / 회원가입 화면
- [ ] `?next=` 리다이렉트 복귀 처리
- [ ] `WatchlistButton` (비로그인 시 리다이렉트 내장)
- [ ] 내 관심 천체 화면 (탭 구분, 삭제 + 실행 취소)

#### 시각화

- [ ] `SizeComparison` — 지구 고정 기준, 소행성 이중 원, 그룹 간 로그 스케일
- [ ] `NeoScatterChart` — Recharts 산점도 (거리 × 속도 × 크기 × 위험여부)

### 완료 기준

**MVP 완료 기준 대조** — `01_requirements_and_features.md` 9장의 22개 항목이 전부 체크되어야 한다.

- [ ] 반지름 `0.8~1.5` + 거리 `100광년 이하` 검색 시 결과가 나오고, 필터 칩 2개가 표시된다
- [ ] 검색 결과 URL을 복사해 새 탭에서 열면 **같은 결과가 재현된다**
- [ ] 값이 없는 항목이 `0`이 아니라 `—` 로 표시된다
- [ ] 비로그인 상태로 상세 페이지에서 저장 클릭 → 로그인 → **원래 상세 페이지로 복귀**한다
- [ ] 회원가입 직후 별도 로그인 없이 저장 버튼이 동작한다
- [ ] 크기 비교 화면에서 지구가 제거되지 않는다
- [ ] 소행성이 최소·최대 두 개의 원으로 그려진다
- [ ] 산점도에서 위험 소행성이 색으로 구분된다
- [ ] `01_requirements_and_features.md` 9장 체크박스 22개가 전부 체크되었다

> 이 시점이 **v1.0**이다. 여기서 태그를 남긴다: `git tag v1.0`

---

## 8. M5 — 완성도

**목표**: 예외 상황에서도 화면이 무너지지 않는다.

### 작업

- [ ] `EmptyState` — 날짜별 0건 / 검색 0건 / Watchlist 비어있음 (각각 다음 행동 버튼 포함)
- [ ] `Skeleton` — 목록 로딩 자리표시자
- [ ] 3초 초과 시 "NASA에서 데이터를 가져오는 중" 안내
- [ ] `ErrorState` — NASA 장애 / 한도 초과 / 재시도
- [ ] 반응형 (768px, 1024px 분기)
- [ ] 키보드 포커스 링 확인
- [ ] 색 대비 WCAG AA 검증
- [ ] 위험 표시를 색 + 아이콘 + 텍스트 3중으로
- [ ] `prefers-reduced-motion` 대응

### 완료 기준

- [ ] 소행성이 0건인 날짜를 조회해도 빈 화면이 아니라 **다음 행동 버튼**이 보인다
- [ ] Django 서버를 끈 상태로 접속하면 오류 화면이 뜨고, 사과 문구 대신 **재시도 버튼**이 있다
- [ ] `NASA_API_KEY`를 일부러 틀리게 바꿔도 DB에 있는 데이터는 정상 표시된다
- [ ] 브라우저 폭 375px에서 가로 스크롤이 발생하지 않는다
- [ ] 마우스를 쓰지 않고 `Tab`만으로 대시보드 → 상세 → 저장까지 도달할 수 있다
- [ ] 화면을 흑백으로 변환해도 위험 소행성을 구분할 수 있다

---

## 9. M6 — 배포 및 정리

**목표**: URL 하나로 남에게 보여줄 수 있다.

### 작업

- [ ] `DEBUG=False` 환경 설정 분리
- [ ] `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS` 설정
- [ ] 정적 파일 처리 (`collectstatic`)
- [ ] React 프로덕션 빌드
- [ ] 배포 (플랫폼 미정 — M5 시점에 결정)
- [ ] 운영 DB 마이그레이션 및 외계행성 초기 적재
- [ ] README 갱신 (구현 완료 체크박스, 스크린샷, 배포 URL)
- [ ] DEVLOG 전체 정리 — 면접용 사례 3개 이상 선별

### 완료 기준

- [ ] 다른 기기(휴대폰)에서 배포 URL로 접속해 대시보드가 보인다
- [ ] 배포 환경에서 회원가입 → 로그인 → Watchlist 저장까지 동작한다
- [ ] 배포된 페이지의 개발자도구 어디에도 `NASA_API_KEY`가 노출되지 않는다
- [ ] `DEBUG=False` 상태에서 오류 페이지에 스택 트레이스가 노출되지 않는다
- [ ] README만 읽고 다른 사람이 로컬에서 실행할 수 있다
- [ ] DEVLOG에 "증상 → 원인 → 해결 → 배운 것" 형식의 기록이 5건 이상 있다

---

## 10. 범위 관리

### 10.1 새 기능이 떠올랐을 때

**구현하지 않는다.** `01_requirements_and_features.md` 3.2절(MVP 제외 범위)에 항목만 추가한다.

3개월 프로젝트에서 기능이 늘어나면 반드시 마지막에 무언가를 못 끝낸다. 그리고 못 끝낸 것은 대개 **핵심 기능**이다. 예쁜 것부터 만들고 싶어지기 때문이다.

### 10.2 일정이 밀렸을 때 자르는 순서

우선순위는 `01_requirements_and_features.md` 6장을 따른다.

```text
먼저 자른다  ←────────────────────────→  마지막까지 지킨다
  P2              P1                        P0
정렬 고도화    차트 · 크기비교          NEO 수집 · 검색 · 상세
```

- **P2를 먼저 자른다.** 산점도 차트는 없어도 서비스가 성립한다.
- **P0는 자르지 않는다.** NASA 수집과 다중 조건 검색이 빠지면 이 프로젝트는 존재 이유가 없다.
- 자른 항목은 지우지 말고 `01_requirements_and_features.md` 변경 이력에 **사유와 함께** 남긴다.

### 10.3 마일스톤 간 작업 이관

M3에 있던 작업을 M4에서 했다면, M3의 원래 위치에는 체크박스 대신 인용구 각주만 남긴다.

```markdown
> `NeoScatterChart`는 M4로 이관 (2026-10-12). 사유: Recharts 학습 시간 확보
```

완료 여부의 출처는 **항상 한 곳**이어야 한다. 두 군데 체크박스가 있으면 한쪽이 반드시 거짓말이 된다.

---

## 11. 관련 문서

| 문서 | 이 문서와의 관계 |
|---|---|
| `DEVLOG.md` | 실측 소요 시간의 출처. 이 문서의 추정치를 보정한다 |
| `01_requirements_and_features.md` | M4 완료 기준(9장)과 우선순위(6장)의 출처 |
| `02_database_design.md` | M1 완료 기준(DDL 대조)의 출처 |
| `03_user_scenarios_and_uiux.md` | M3~M5 화면 작업 범위의 출처 |
| `04_api_specification.md` | M2 완료 기준(엔드포인트 17개)의 출처 |
