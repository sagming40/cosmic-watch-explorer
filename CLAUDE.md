# CLAUDE.md — Cosmic Watch & Explorer

NASA 공개 데이터로 만드는 지구 근접 소행성(NEO) 모니터링 + 외계행성 탐색 포털. 1인 학습·포트폴리오 프로젝트.
Backend: Django 6.1 + DRF + MariaDB / Frontend: React 19 + TypeScript 6.0 + Vite + React Router + axios + Tailwind CSS v4 + shadcn/ui + Recharts.

> 이 파일은 **모든 기기(회사 PC / 집 PC / 노트북)의 로컬 Claude Code 세션**이 같은 규칙으로 작업하기 위한 지침이다.
> Claude의 메모리(`~/.claude/projects/.../memory/`)는 **기기마다 따로**라서 다른 기기로 넘어가지 않는다. 기기와 상관없이 지켜야 할 규칙은 전부 이 파일에 적는다.

---

## 1. 작업 규칙 (가장 중요)

### 1.1 브랜치: `main` 하나만 쓴다
- **모든 작업은 `main`에서 한다. 새 브랜치를 만들지 않는다.** (2026-10-27부터. M0~M3 중반까지는 마일스톤별 브랜치 + PR 방식이었다 — README "개발 워크플로우" 참고)
- PR도 만들지 않는다. 커밋을 `main`에 바로 push한다.
- force push, `reset --hard`, `rebase` 같은 히스토리 재작성은 사용자가 명시적으로 요청할 때만 한다. `main`은 공유 기록이다.

### 1.2 기본 모드: Claude가 직접 작업 → 커밋 → push까지 자동
- 기본값은 **Claude가 직접 코드를 작성·수정**하고, 검증한 뒤 **커밋하고 `git push`까지** 한다.
- **사용자가 "직접 타이핑할게"라고 요청한 경우에만** 코드를 코드블록으로 제시하고, 사용자가 타이핑한 뒤 "코드 검수!"로 보여주면 오타·버그를 리뷰한다. 이때는 Claude가 파일을 수정하지 않는다.
  - 수정 지시는 "파일 위치 + 현재 코드 + 바꿀 코드"로, 삽입 위치가 애매하면 전후 몇 줄을 같이 보여준다.
- 작업이 학습 포인트가 있는 새 기능이면, **시작 전에 "내가 바로 할까, 직접 타이핑할래?"를 물어봐도 된다.**
- "검수만" 요청이면 검수만 하고 다음 단계로 넘어가지 않는다.

#### 구현 전 사전 검증 (자동 작업일 때 필수)
코드를 실제로 쓰기 전에, **설계한 대로 구현했다고 가정하고 결과를 머릿속으로 끝까지 돌려본다.** 목적은 프로젝트 완성도를 높이는 것이다.
- 확인할 것:
  - **오류**: 실행 에러, 엣지 케이스(NULL·0건·범위 밖 값·빈 응답·비로그인), 기존 코드·API 응답 형태와의 불일치
  - **더 나은 방식**: 더 단순하거나 이 코드베이스 관례에 더 맞는 방법이 있는지
  - **보완할 점**: 문서(01~05) 스펙·완료 기준과 어긋나는 곳, 빠진 상태 처리(로딩/오류/빈 화면), 접근성, 설계 원칙 위반(3.3절)
- 문제를 찾으면 **설계를 바꿔도 된다.** 바뀐 설계로 다시 한 번 돌려본 뒤 구현한다.
- 사전 검증에서 무엇을 발견했고 설계를 어떻게 바꿨는지 작업 결과와 함께 짧게 알린다. 설계가 문서와 달라졌으면 1.4절대로 문서에 흔적을 남긴다.
- 사전 검증은 실제 검증(서버 실행·화면 확인)을 대신하지 않는다. 구현 후 실제 동작 확인은 그대로 한다.

### 1.3 커밋 규칙
- 형식: `type(M{n}): 한국어 제목` + 빈 줄 + 본문(bullet로 무엇을·왜·어떻게 검증했는지).
  - type: `feat` / `fix` / `refactor` / `docs` / `test` / `chore`. `{n}`은 현재 마일스톤 번호.
- **분리 기준: "따로 되돌리고 싶을 수 있는가"** — 성격이 다르면(feat/fix/docs) 커밋을 나눈다. 백엔드·프론트를 같이 고쳤으면 나눈다. 문서 커밋은 코드 커밋과 따로.
- 커밋 전에 실제로 동작을 확인한다(서버 실행, 화면/응답 확인, `npm run lint`/`python manage.py check` 등). 확인 못 한 것은 커밋 본문과 답변에 그렇게 적는다.
- 세션이 중간에 끊길 것 같으면 `wip:` 커밋으로 push해 둔다(다른 기기에서 이어가기 위해). 다음 세션에서 정식 커밋으로 정리할지는 사용자에게 묻는다(`main`이라 재작성은 force push가 필요하기 때문).

### 1.4 문서 갱신 규칙
- 세션(작업 단위) 종료 시: `docs/DEVLOG.md` → `docs/05_milestones.md` → 필요 시 01~04 문서 → `docs(M{n})` 커밋 → push.
- DEVLOG: 날짜 블록, **최신이 위**. 항목 형식은 `증상 / 원인 / 해결 / 배운 것`(막혔던 일), 블록 끝에 **`이번 세션 커밋`과 `다음에 할 일` 필수**. 맨 위 "현재 상태" 표도 갱신.
- 05_milestones: 체크박스 갱신, 계획에 없던 작업은 `— *계획에 없던 작업*` 표시. 문서 상단 **버전 = 변경 이력 마지막 줄 버전**.
- 완료 기준은 "속을 수 없는 형태"로만 체크한다(실측 증거가 있어야 ✅).
- 오기를 고칠 때는 다른 문서에도 같은 오기가 있는지 전부 검색한다.
- 설계를 구현 중에 바꿨으면(예: 명세와 다른 방식) 해당 문서 변경 이력 + DEVLOG `[설계]` 항목에 이유를 남긴다.

### 1.5 소통 방식
- 한국어, **반말**, 일상 비유를 섞어 설명. 비교는 표로. 근거는 문서 절 번호(예: "04 문서 5.1절")로 든다.
- 추천안을 명시하되 결정은 사용자가 한다. 사용자가 추천과 다르게 정하면 그대로 따르고 문서에 흔적을 남긴다.
- **추측으로 말하지 않는다.** 필드명·코드·상태는 실제 파일과 명령 결과를 확인한 뒤 말한다.
- 코드 주석은 사용자 스타일 유지: 한국어 + 비유, 섹션 배너(`─`, `═══`).

### 1.6 업로드 금지
- 이 프로젝트 내용은 **Artifact 게시, Claude Docs, 클라우드 세션, 원격 실행(예약 작업 등)에 올리지 않는다.** 결과물은 로컬 파일 또는 답변으로만 준다.
- 외부로 나가는 건 사용자 개인 GitHub 저장소(`sagming40/cosmic-watch-explorer`) push뿐이다.

---

## 2. 기기 간 이어서 작업하기

작업 기기: **회사 PC**(회사 Claude 계정) / **집 PC·노트북**(개인 Claude 계정). 전부 로컬 세션.
코드·문서·마이그레이션 파일은 Git으로 공유되지만, **아래는 기기마다 따로**다.

| 기기별로 따로인 것 | 이유 / 대처 |
|---|---|
| `backend/.env` | `.gitignore` 대상. 새 기기에서 직접 만들어야 한다 (2.2 참고) |
| `backend/venv/` | 기기마다 새로 만든다 |
| `frontend/node_modules/` | `npm ci`로 설치 |
| **MariaDB 데이터** | DB는 기기별 독립. `migrate` + 데이터 수집을 기기마다 해야 한다 |
| Claude 메모리 | 기기·계정마다 따로. 규칙은 이 파일에 |

### 2.1 세션 시작 체크리스트 (모든 기기, 매번)

Claude가 세션 시작 시 아래를 순서대로 확인한다.

```powershell
git status                 # 미커밋 변경이 있으면 먼저 사용자에게 알린다
git switch main            # main이 아니면 전환
git pull --ff-only         # 다른 기기에서 push한 커밋 받기 (실패하면 멈추고 원인 보고)
```

`git pull`로 받은 커밋에 따라:
- `frontend/package.json`·`package-lock.json`이 바뀌었으면 → `cd frontend; npm ci`
- `backend/requirements.txt`가 바뀌었으면 → venv 켜고 `pip install -r requirements.txt`
- `backend/apps/*/migrations/`가 바뀌었으면 → `python manage.py migrate`
- 확실하지 않으면 `python manage.py showmigrations`로 `[ ]`(미적용)가 있는지 본다.

그다음 `docs/DEVLOG.md` 맨 위 **"현재 상태"** 와 가장 최근 날짜 블록의 **"다음에 할 일"** 을 읽고 이어서 진행한다.

### 2.2 새 기기 최초 세팅 (집 PC·노트북에서 폴더를 지웠다면 이것부터)

**사전 설치**: Git, Python 3.14(3.11 이상), Node.js 24(npm 11), MariaDB 10.6 이상(+ HeidiSQL 선택)

```powershell
# 1) 저장소 받기
git clone https://github.com/sagming40/cosmic-watch-explorer.git
cd cosmic-watch-explorer

# 2) 백엔드
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # 값 채우기 — 아래 참고

# 3) DB 생성 (HeidiSQL 또는 mysql 클라이언트에서)
#    CREATE DATABASE cosmic_watch DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;

python manage.py migrate
python manage.py fetch_exoplanets   # 외계행성 약 6,000건 수집 (1~2분)
python manage.py createsuperuser    # ⚠️ 이메일 반드시 입력 (auth_user.email UNIQUE — 빈 이메일 계정은 1개만 가능)

# 4) 프론트
cd ..\frontend
npm ci
```

**`.env` 값** (`.env.example` 참고, Git에 절대 올리지 않는다):
- `SECRET_KEY`: 기기마다 새로 만들어도 된다 → `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` (`-c` 빠뜨리지 말 것)
- `DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`: 그 기기의 MariaDB 설정
- `NASA_API_KEY`: 사용자 본인 키 (api.nasa.gov). Claude는 키 값을 대화·커밋·로그에 남기지 않는다.

**NEO(소행성) 데이터**는 미리 수집하지 않아도 된다. 대시보드에서 날짜를 조회하면 그때 NASA를 호출해 저장한다(첫 조회 1~2초, 이후 캐시).

### 2.3 실행

```powershell
# 터미널 1 — backend (venv 켠 상태)
python manage.py runserver          # http://localhost:8000

# 터미널 2 — frontend
npm run dev                         # http://localhost:5173
```
Claude가 화면을 확인할 때는 `.claude/launch.json`의 `frontend`/`backend` 설정으로 띄워서 브라우저 패널로 본다(5173이 사용 중이면 5174 등으로 자동 이동).
Vite 프록시가 `/api` → `localhost:8000`으로 넘겨서 CORS 설정이 필요 없다. 백엔드가 꺼져 있으면 프론트에는 `NETWORK_ERROR`가 아니라 `UNKNOWN_ERROR`(Vite가 만든 502)가 뜬다 — 정상.

**백엔드 테스트** (10-28~): `backend`에서 `python manage.py test` (46개, 약 20초). NASA는 가짜(mock)라 키·네트워크와 무관하다. 테스트 DB(`test_cosmic_watch`)를 자동으로 만들었다 지우므로 그 기기의 DB 계정에 CREATE 권한이 있어야 한다. 백엔드를 고치면 커밋 전에 반드시 돌린다.
**NASA 장애 실험**: `.env`는 건드리지 않고 서버를 띄울 때만 환경변수로 가짜 키를 준다(`load_dotenv()`는 이미 있는 환경변수를 덮어쓰지 않는다) → `NASA_API_KEY=INVALID_TEST_KEY python manage.py runserver`. NASA가 403을 준다.

### 2.4 세션 종료 시
- 작업 단위가 끝나면 커밋 + **push까지** 한다. push 안 하면 다른 기기에서 이어갈 수 없다(9/16 Recharts 작업이 이렇게 유실됐다).
- DEVLOG 맨 위 "현재 상태"와 최신 블록의 "다음에 할 일"을 다음 세션이 바로 시작할 수 있게 갱신한다.

### 2.5 검증용 데이터 (DB는 기기마다 따로 ─ 처음 열면 서버가 NASA에서 받아온다)
| 주소 | 확인할 수 있는 것 |
|---|---|
| `/?date=2029-04-13` | 1 LD 안쪽 접근(아포피스 0.10 LD) → 스케일 바 빨간 점·고리, 위험 분류 카드. **최근 날짜엔 1 LD 안쪽 접근이 거의 없다** (NASA 미래 예측은 궤도가 확정된 천체만) |
| `/neo/3841173` | 전체 접근 기록 정확히 5건 → "더 보기" 없음 (경계값) |
| `/neo/3463448` | 10건 → "더 보기" 있음 |
| `/neo/3831888` | 31건 → 20건 + 더 불러오기 → 31/31 |
| `/neo/2099942` | 아포피스 상세 (다음 접근 표에 1 LD 안쪽 빨간 값) |
| `/neo/9999999`, `/?date=2026-13-99` | 오류 화면 (NOT_FOUND / INVALID_DATE) |
| `/exoplanets?radius_min=0.8&radius_max=1.5&distance_max_ly=100` | M4 완료 기준 검색 → 53건, 칩 2개 (DB가 다른 기기면 건수는 수집 시점에 따라 다를 수 있다) |
| `/exoplanets?radius_min=abc&year_min=1.5` · `?radius_min=50&distance_max_ly=10` | 입력값 오류(칸 표시) · 0건 안내 |
| `/exoplanets/6400` · `/exoplanets/72` · `/exoplanets/4546` | 값 없음 `—`(프록시마 b) · 형제 행성 6개·거리 미측정(TRAPPIST-1 e) · 반지름 87배(축척 축소) ─ id는 기기 DB마다 다를 수 있으니 이름으로 검색해서 찾기 |
| `/login?next=%2F%2Fevil.com` | next 무시 → 안내 문구 없음, 로그인 후 `/` (오픈 리다이렉트 방지) |
| `/watchlist` (로그인 필요) | 탭 개수, 삭제 → 실행 취소 5초, 전부 지우면 빈 화면, `?tab=exo` 새로고침 유지. 테스트 계정은 확인 후 지울 것 |
| `/compare?exo=72,6400,4546&neo=2099942,9999999` | 지구 고정(자물쇠), 크기 미측정(프록시마 b), 축척 축소(87배), 이중 원(아포피스), 없는 id 칩, 로그 눈금 띠. 대상 없는 `/compare`도 확인 |

- **2.5절 주소는 전부 로그인해야 열린다(10-27~).** 테스트 계정은 화면에서 가입해 쓰고(비밀번호는 대화에 남기지 않는다), 확인 뒤 `manage.py shell`에서 지운다.
- NEO 상세는 처음 열 때 NASA Lookup을 부른다 → 스로틀 `neo_detail_fetch` 30회/시간. 반복 확인은 같은 ID로.
- Claude가 브라우저 패널로 확인할 때, 창이 가려져 있으면 **스크린샷이 예전 화면으로 찍힐 수 있다** → 색·개수 같은 판정은 `javascript_tool`로 계산값(`getComputedStyle`, DOM 개수)을 읽어서 한다.

---

## 3. 프로젝트 지도

### 3.1 문서 (`docs/`)
| 문서 | 내용 | 갱신 빈도 |
|---|---|---|
| `DEVLOG.md` | 현재 상태, 날짜별 작업·트러블슈팅 기록 | Tier 1 (매 세션) |
| `05_milestones.md` | M0~M6 작업 목록·완료 기준 | Tier 1 (매 세션) |
| `02_database_design.md` | ERD, 테이블 8개, DDL | Tier 2 (구현과 어긋날 때) |
| `04_api_specification.md` | 엔드포인트 17개, 오류 봉투, 페이징 | Tier 2 |
| `01_requirements_and_features.md` | 요구사항, MVP 범위, 우선순위 | Tier 3 (드물게) |
| `03_user_scenarios_and_uiux.md` | 화면 설계, 디자인 토큰, 컴포넌트 목록 | Tier 3 |

### 3.2 코드 구조
```text
backend/
  config/            settings.py, urls.py, exception_handler.py(오류 봉투·커스텀 예외),
                     pagination.py(CommonPagination), permissions.py(IsAuthenticatedOr401)
  apps/astronomy/    models(Neo, CloseApproach, OrbitalData, HostStar, Exoplanet, NeoFetchLog),
                     views, serializers, filters.py(외계행성 다중 조건 검색), units.py(LD·광년 환산 — 384400은 여기만),
                     services/(nasa_neo.py ─ NasaUnavailable·재시도 Session·_save_atomic, exoplanet_archive.py — 외부 API 격리),
                     management/commands/fetch_exoplanets.py
  config/test_utils.py 테스트 공용(BaseAPITestCase·데이터 생성·가짜 NASA 응답). 각 앱 tests.py가 쓴다
  apps/accounts/     인증 API 5종 (세션 쿠키 + CSRF), 로그인 10/분·가입 10/시간 제한
  apps/watchlist/    NeoWatchlist, ExoplanetWatchlist + API 4종
frontend/src/
  api/client.ts      axios 인스턴스 (withCredentials, CSRF, 오류 봉투 → AppError {code, message, fields, status})
  auth/              AuthProvider(앱 시작 시 CSRF + /me/ → status·user·login/signup/logout), useAuth(),
                     next.ts(safeNext ─ ?next=는 앱 내부 주소만, loginPath, nextLabel)
  types/api.ts       백엔드 응답 타입 전부 (04 문서 + serializers.py 기준) — API 호출은 api.get<타입>()으로
  components/ui/     shadcn/ui가 생성한 원본 부품 (Button …) — 직접 고치지 말고 감싸서 쓴다
  lib/utils.ts       cn() — className 합치기 (shadcn 공용)
  components/common/ Panel·PanelTitle(카드 틀), StatCard(요약 칸), Field(라벨+수치), HazardBadge(위험 3중 표시),
                     StateViews(로딩 스켈레톤·오류 화면), WatchlistButton(저장/해제, 401이면 /login?next=), Pagination
  components/compare/ SizeGroups(행성·소행성 그림, 그룹마다 실제 비율), LogScaleStrip(한 자 로그 눈금), AddTargetPanel(외계행성 검색·오늘의 소행성),
                     TargetChip(지구 = 자물쇠), CompareTable, types.ts
  components/watchlist/ NeoWatchItem·ExoWatchItem(관심 천체 한 줄), RemoveButton, UndoToast(실행 취소 5초), WatchlistEmpty
  components/auth/   AuthLayout(로그인·가입 틀 + next 안내), AuthFields(입력칸·비밀번호 보기·FormAlert), ProtectedRoute(로그인·가입 외 전체 화면의 문지기)
  components/layout/ Header(알약 메뉴 + 로그인 상태), Layout(배경 + Outlet)
  components/neo/    대시보드: DateNavigator, NeoSummary, LunarDistanceBar, NeoScatterChart, NeoListItem, NeoFaq
                     상세: OrbitPanel(궤도 모식도), NeoSizePanel, ObservationPanel, ApproachTable
                     공용: chart.ts(눈금 범위·점 변환), ChartTooltip
  components/exoplanet/ FilterPanel(9개 조건), FilterChips, ExoplanetListItem, HostStarPanel, PlanetSizePanel, SiblingPlanets
  utils/compareQuery.ts 비교 대상 ↔ 주소(?exo=&neo=), 그룹당 최대 4개, 지구 반지름 상수(6371 ─ NASA 값 환산용이 아닌 고정 기준)
  utils/exoplanetQuery.ts 검색 조건 ↔ 주소 변환, 칩 문구, 정렬 목록 (파라미터 이름 = API 이름)
  utils/format.ts    표시 포맷 (null → "—", KST 날짜, "약 N년 뒤") — 단위 환산은 하지 않는다
  pages/             라우트별 화면 9개 전부 구현: NeoDashboard·NeoDetail(M3), ExoplanetList·ExoplanetDetail·Login·Signup·Watchlist·Compare(M4), NotFound
  utils/date.ts      날짜 ↔ 문자열 (로컬 시간 기준)
  index.css          Tailwind import + 디자인 토큰(:root) + 테마 연결(@theme) + 기존 섹션별 스타일(@layer)
```

### 3.3 지켜온 설계 원칙 (어기지 말 것)
- **NASA 원본 NULL을 0이나 빈 값으로 바꾸지 않는다.** 화면에서만 `—`로 표시.
- **도메인 계산은 서버에서.** LD 환산(`384400`)·광년↔파섹은 `backend/apps/astronomy/units.py`에만. 프론트에 `384400` 하드코딩 금지(M3 완료 기준).
- API 필드는 전 구간 `snake_case`. 오류는 `{"error": {code, message, fields?}}` 봉투.
- 리소스 없음 = 404(`ResourceNotFound`), 중복 = 409(`IntegrityError` → `AlreadyExists`), 비로그인 = 401(`IsAuthenticatedOr401`).
- **기본 잠금 (10-27~)**: 백엔드는 `DEFAULT_PERMISSION_CLASSES = [IsAuthenticatedOr401]`, 공개는 인증 API 4개(csrf·me·signup·login)만 `AllowAny`로 명시. 프론트는 `/login`·`/signup` 말고 전부 `ProtectedRoute` 아래. 새 API·화면은 따로 안 붙여도 잠긴다 ─ 공개가 필요하면 그때 명시적으로 연다.
- 401(세션 만료)은 화면마다 처리하지 않는다 ─ `AuthProvider`의 응답 감시가 로그인 상태를 지우면 `ProtectedRoute`가 `/login?next=지금 주소`로 보낸다.
- 스로틀은 NASA를 실제로 부르는 지점(캐시 미스)에서만 직접 검사한다(`get_throttles()`가 `[]` 반환).
- **NASA 실패 처리 (10-28~)**: 서비스가 통신 실패만 `NasaUnavailable`로 바꾸고, 뷰는 그것만 잡는다(`except Exception` 금지 ─ 우리 버그가 "NASA 장애"로 둔갑한다). DB에 보여줄 데이터가 있으면 실패해도 200(대시보드 갱신 실패·상세 `orbit_status`), 없을 때만 503.
- **로그에 NASA 키 금지**: 키가 URL(`?api_key=`)에 실려서 requests 오류 문구·트레이스백에 그대로 나온다 → NASA 오류는 `exc_info`·`str(원래 예외)`를 남기지 않고 `NasaUnavailable`의 종류 문구만. 요청 처리 중 `print` 금지(`logging`만 ─ 10-28 cp949 503 사례).
- NASA 데이터 저장은 `_save_atomic`(transaction + 충돌 1회 재시도) 안에서. 네트워크 호출은 그 밖에서.
- 백엔드 기능을 바꾸면 테스트도 같이 추가한다(`apps/*/tests.py`).
- `--hazard` 색(#D64545)은 위험 표시 전용. 버튼·링크에 쓰지 않는다.
- 범위 관리: 새 기능이 떠오르면 구현하지 않고 `01` 문서 3.2절(MVP 제외 범위)에 적는다. 확정된 "나중에" 항목: error boundary·커스텀 달력(M5).

### 3.4 스타일 규칙 (Tailwind CSS v4 + shadcn/ui, 2026-10-27 도입)
- **새 코드는 Tailwind 유틸리티로 쓴다.** 색·서체·크기는 토큰 이름 유틸리티만: `bg-ink`/`bg-panel`/`border-line`/`text-bone`/`text-dim`/`text-signal`/`text-hazard`, `font-sans`/`font-display`/`font-mono`, `text-display`/`text-h1`/`text-h2`/`text-body`/`text-label`. `bg-[#...]` 같은 임의 색 금지 — 색 값은 `index.css` `:root` 토큰 7개뿐(03 문서 2.5절).
- shadcn 역할 이름(`bg-primary`, `text-muted-foreground`, `border-border` …)도 토큰에 연결돼 있으니 써도 된다.
- **색은 C 그래파이트(10-27 확정)**: 무채색 + 신호색 `--signal`(라임, 옛 이름 `--sodium`) + 경고색 `--hazard`. 값은 03 문서 2.1절.
- **`--hazard`/`text-hazard`/`bg-hazard`는 위험 표시(PHA·1 LD 안쪽) 전용.** shadcn `destructive` 역할은 `--bone`(폼 오류용)이고, `variant="destructive"` 버튼은 금지. **폼 오류도 hazard 금지** → 아이콘 + `text-bone` + 테두리 강조, shadcn `destructive` 역할이 `--bone`에 연결돼 있어 입력칸 오류는 자동으로 흰색이 된다(10-27 확정).
- 위험은 색만으로 표시하지 않는다: 색 + 모양(고리·띠) + 아이콘·글자 (라임/빨강은 적록색약에서 헷갈림).
- 링크(`<a>`)는 `@layer base`에서 `--signal` 색이 기본이라, 이름·제목 링크에는 `text-bone`을 직접 붙인다.
- 화면에 보이는 날짜·시각은 전부 한국 시각(KST)으로 바꿔서 표시한다(NASA `approach_date`는 UTC 날짜라 하루 어긋날 수 있다).
- 그림자 없음(`--shadow-*` 제거됨). 모서리: 버튼·입력 `rounded-md`(8px) / 내부 박스 `rounded-lg`(12px) / 카드 `rounded-xl`(16px) / 메뉴·칩 `rounded-full`. 한글은 Pretendard(index.html에서 로드).
- `index.css`에 직접 CSS를 쓸 때는 반드시 `@layer base`(요소 선택자) 또는 `@layer components`(클래스) 안에. 레이어 밖 CSS는 유틸리티를 이겨서 클래스가 무시된다.
- 기존 컴포넌트의 클래스(`.neo-list-item` 등)는 화면을 손볼 때 Tailwind로 옮긴다(일괄 전환 안 함).
- **shadcn 컴포넌트 추가 절차** (`frontend` 폴더에서):
  1. `npx shadcn@latest add <이름> --dry-run` → Dependencies에 `cn`이 보이면 정상 아님(Windows에서 재현되는 CLI 버그)
  2. `npx shadcn@latest add <이름>` 실행 후, `npm uninstall cn` + 생성 파일의 `import { cn } from "cn"`을 `import { cn } from "@/lib/utils"`로 수정
  3. `package.json`에 낯선 패키지가 추가되지 않았는지 확인, `npm run build`·`npm run lint`

### 3.5 TypeScript 규칙 (2026-10-27 전환)
- 프론트는 전부 `.ts`/`.tsx`, `strict: true`. `npm run build`가 `tsc -b`(타입 검사)부터 돌리므로 타입 에러가 있으면 빌드가 실패한다.
- **API 응답 타입은 `src/types/api.ts` 한 곳에.** 백엔드 serializer를 바꾸면 이 파일도 같이 고친다. 호출은 `api.get<NeoDashboardResponse>(...)`처럼 타입을 붙인다.
- NASA 값은 `number | null`이 기본. `!`(non-null 단언)이나 `as`로 null을 지우지 말고 화면에서 처리한다(DataField가 `—` 표시). `any` 금지.
- catch에서 받는 오류는 `AppError`(`api/client.ts`) — `err.code`로 분기.
- props는 컴포넌트 위에 `interface 컴포넌트명Props`로 선언.
- **TypeScript 버전은 `~6.0.x` 고정.** 7.0이 나왔지만 `typescript-eslint`가 `<6.1`까지만 지원한다. 올릴 때는 `npm view typescript-eslint peerDependencies`부터 확인.
- 설정: `tsconfig.json`(참조) → `tsconfig.app.json`(src) / `tsconfig.node.json`(vite.config.ts). 경로 별칭 `@/*`는 `baseUrl` 없이 `paths`만(TS 6에서 `baseUrl` deprecated).

### 3.6 자주 빠지는 함정 (DEVLOG에서 반복된 것)
- `getattr(obj, "속성", 기본값)` 계열은 오타가 나도 에러 없이 기본값으로 넘어간다(`throttle_scope`, `is_custom_error` 사례). 반드시 실제 응답으로 검증.
- 역방향 OneToOne(`neo.orbital_data`)은 행이 없으면 예외 → `getattr(neo, "orbital_data", None)`.
- `manage.py shell`에서 코드 수정은 shell 재시작 전까지 반영 안 됨. `LocMemCache`는 프로세스별이라 shell에서 runserver 캐시가 안 보인다.
- `django.test.Client`는 Host가 `testserver` → `ALLOWED_HOSTS`에 없으면 `DisallowedHost`.
- 프론트 날짜: `toISOString()`·`new Date("YYYY-MM-DD")`는 UTC 기준이라 하루 어긋난다 → `utils/date.ts`만 사용.
- **로그인 후 쓰기(POST/DELETE)는 브라우저로 확인.** curl·`django.test.Client`는 Origin을 안 보내서 CSRF Origin 검사를 못 잡는다. Vite 프록시는 `changeOrigin: false`여야 한다(true면 Host=8000 ≠ Origin=5173 → 403). DRF는 비로그인 요청엔 CSRF를 안 봐서 로그인·가입만 되고 그 뒤가 막히는 식으로 나타난다.
- `auto_now_add` 필드는 `update_or_create`로 갱신되지 않는다(처음 만들 때만 찍힌다) → 갱신이 필요하면 defaults에 직접 넣는다(`NeoFetchLog.fetched_at` 사례).
- 반복 오타 주의 필드: `observations_used`, `data_arc_days`.
