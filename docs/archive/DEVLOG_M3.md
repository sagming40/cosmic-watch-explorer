# DEVLOG M3 — M3 프론트 기반 앞부분 (2026-09-10 ~ 09-14)

> **M3 기간의 날짜 블록을 줄 그대로 옮긴 문서다.** 고치지 않는다. 옛 문서 이름은 [대응표](README.md), 지금 기록은 [DEVLOG](../DEVLOG.md).

## 2026-09-12 ~ 14 (토 ~ 월) — M3: 디자인 토큰 · Header · DataField 완료

### [완료] React Router 라우팅 설정 + 페이지 스텁 9개

`react-router`(v7 통합 패키지, `-dom` 아님) 설치. `Layout.jsx`(Outlet 기반 공통 헤더 영역) + 페이지 스텁 9개(`NeoDashboard`/`NeoDetail`/`ExoplanetList`/`ExoplanetDetail`/`Compare`/`Login`/`Signup`/`Watchlist`/`NotFound`) 작성. `App.jsx`의 임시 `<h1>COSMIC WATCH</h1>`를 실제 라우터 구조로 교체. `03` 4장 표에 없던 404 캐치올(`*`) 라우트는 계획 외 작업으로 `05_milestones.md`에 반영.

**검증**: `/`, `/exoplanets`, `/neo/:id`(id 2개 값 교차 확인), `/asdf` 5개 주소 직접 입력으로 라우팅·`useParams`·404 동작 확인.

### [환경] 기기 이동(학교 PC → 집 노트북) 후 `Failed to resolve import "react-router"`

**증상**
`git pull` 후 `npm run dev` 실행하니 `Layout.jsx`의 `import { Outlet } from "react-router"`를 못 찾는다는 오류가 반복 발생.

**원인**
`node_modules`는 Git으로 공유되지 않는 폴더 — `package.json`엔 `react-router`가 이미 반영돼 있었지만, 노트북에서 그 시점 이후로 `npm install`을 한 번도 안 돌려서 실제 설치물이 없었음. DB가 기기별로 독립적인 것과 완전히 같은 원리.

**해결**
`git pull` → `npm install`로 부족한 패키지만 설치.

**배운 것**
`package.json`(장바구니 영수증)과 `node_modules`(실제 물건)는 별개다 — 기기를 옮기면 항상 `npm install`부터 확인할 것.

### [완료] 디자인 토큰 적용

`03_user_scenarios_and_uiux.md` 2장 값을 `index.css` `:root`에 CSS 변수로 등록(컬러 7종/타이포 3역할/타입 스케일/레이아웃). Google Fonts로 IBM Plex 3종(Sans/Sans Condensed/Mono) 로딩. `.content-container`(최대폭 1280px 중앙정렬) 클래스 추가.

**검증**: 배경/글씨색, `h1` Computed 탭에서 `font-family` 확인(대비 15.19), Network 탭에서 폰트 200 응답, `<main>` 요소 실측 폭 1280×42 확인.

### [완료] `Header` 컴포넌트

`NavLink` 기반 메뉴 3종(소행성/외계행성/크기비교) + 로그인 링크. `end` 옵션으로 홈(`/`) 경로가 하위 상세 페이지에서 오탐 활성화되는 버그 방지. 로그인 상태 분기(로그인↔Watchlist/로그아웃 전환)는 `05_milestones.md` 7장 확인 결과 인증 관련 작업이 전부 M4 소속이라 `AuthProvider` 도입 전까지 보류하기로 결정 — 지금은 항상 "로그인" 고정 표시.

**검증**: 메뉴 클릭 시 Network 탭에 새 요청 없음(SPA 전환 확인), 활성 메뉴 강조색 전환, NEO 상세 페이지에서 "소행성" 메뉴 비활성 확인.

### [Git] `wip:` 커밋을 사후에 정식 커밋으로 재정리 (M2와 동일 패턴 재발)

**증상**
학교 PC에서 Header 작업 중 세션이 끊겨 `git add -A` + `wip:` 커밋으로 push. 그 안에 `COSMIC WATCH` → `COSMIN WATCH` 오타도 그대로 섞여 들어감.

**해결**
집 노트북에서 `git reset --soft HEAD~1`로 커밋만 되감고, 오타 수정분까지 합쳐서 `feat(M3)` 정식 메시지로 재커밋 → `git push --force-with-lease`로 원격 덮어씀. Draft PR #3 미병합 상태라 안전하게 재작성 가능했음.

**배운 것**
M2 때 겪었던 `wip:` 재분리 패턴이 그대로 재발 — 세션 중단은 예외가 아니라 이 프로젝트의 상수 조건이니, "끊기면 이렇게 복구한다"는 절차 자체가 이제 체화된 루틴이 됨.

### [완료] `DataField` 공통 컴포넌트

라벨+값 쌍을 렌더링, 값은 항상 `--font-mono` 고정. `value`가 `null`/`undefined`/빈 문자열이면 화면엔 `—`로 표시(DB의 NULL 자체는 안 건드리고 표시 규칙만). `layout` prop으로 `stacked`(대시보드 요약)/`inline`(목록·상세) 두 배치 지원.

**검증**: `NeoDashboardPage`에 임시 렌더로 폰트·대비·`null`→`—` 변환·인라인 배치 확인 후 원상복구.

**이번 세션 커밋**
- `feat(M3): React Router 라우팅 설정 및 페이지 스텁 9개 추가`
- `feat(M3): 디자인 토큰 적용 (컬러·타이포·레이아웃) 및 Google Fonts 연동`
- `feat(M3): Header 컴포넌트 구현 (NavLink 기반 활성 메뉴 표시)`
- `feat(M3): DataField 공통 컴포넌트 구현`
- `docs(M3): DEVLOG 세션 기록 및 마일스톤 체크박스/버전 갱신`

**다음에 할 일**
- NEO 대시보드(`DateNavigator`/`NeoSummary`/`NeoListItem`) → `LunarDistanceBar` → NEO 상세 순 (`05_milestones.md` 6장 작업 목록 그대로)

---

## 2026-09-10 (목) — M3: 프론트 기반 착수 (client.js, Figma 목업, 유즈케이스 다이어그램, 최대 추정 직경 API)

### [완료] `src/api/client.js` — axios 인스턴스 + CSRF 인터셉터

`baseURL`/`withCredentials`/`xsrfCookieName`/`xsrfHeaderName` 설정, 응답 인터셉터로 `{ error: { code, message, fields } }` 봉투를 벗겨 컴포넌트에 `err.code`만 넘기도록 구현. `App.jsx`에 임시 `useEffect`로 `ensureCsrf()` 호출 후 Network 탭 + Application 탭 + 서버 온/오프 상태로 4개 항목 전부 검증 완료.

### [환경] Vite 프록시 뒤에서는 백엔드가 꺼져도 `NETWORK_ERROR`가 아니라 `UNKNOWN_ERROR(502)`가 뜬다

**증상**
`client.js` 검증 중 Django를 꺼봤는데, 예상한 `NETWORK_ERROR`가 아니라 콘솔에 `502 (Bad Gateway)`와 `code: UNKNOWN_ERROR`가 찍힘.

**원인**
브라우저는 Django에 직접 연결하지 않는다. `브라우저 → Vite(:5173) → Django(:8000)` 구조라, Django가 죽으면 Vite가 대신 502 응답을 만들어 브라우저에 돌려준다. 브라우저 입장에선 "응답을 받긴 받은" 상황이라 `error.response`가 존재하고, `client.js`의 분기(`error.response ? UNKNOWN_ERROR : NETWORK_ERROR`)가 정확히 그쪽으로 빠진다.

**해결**
코드는 고칠 필요 없음 — 분기 로직 자체는 올바르게 동작한다. 개발 환경(Vite 프록시)과 배포 환경(프론트가 Django에 직접 요청) 간 차이를 인지하는 것으로 종결. `NETWORK_ERROR`는 M6 배포 후 실제로 서버가 죽었을 때만 재현 가능하다.

**배운 것**
로컬 개발 서버는 "중간에 다른 서버(프록시)가 하나 더 있다"는 사실을 잊으면 에러 원인을 엉뚱한 곳(내 코드)에서 찾게 된다. 에러가 예상과 다르면 먼저 "요청이 실제로 어느 경로를 지나가는가"부터 그려볼 것.

### [설계] 거리 단위 표기 — LD 고정 + 보조 단위(km/AU) 토글

세 안(LD/km 병기 고정, LD/km/AU 중 택일, LD 고정+보조단위 토글) 중 세 번째로 결정. "LD를 끌 수 있게" 만드는 안(두 번째)은 이 서비스의 정체성(모든 거리를 달 거리로 환산해 감각적으로 보여줌)과 모순되어 제외. `03_user_scenarios_and_uiux.md` v1.1 6.1절에 반영.

### [설계] NEO 대시보드 요약에 "최대 추정 직경" 카드 추가

closeapproach.space 참고 중 발견 — 기존 요약 3칸(건수/위험/최근접 거리)엔 "얼마나 큰가" 축이 빠져 있었다. PHA 판정 기준 자체가 거리(0.05 AU)와 크기(140 m) 두 축인데 요약엔 거리만 있었던 셈. `03` v1.1 반영.

### [백엔드] `largest_diameter_m`/`largest_diameter_name` 추가 (`NeoDashboardView`)

`closest` 계산과 같은 패턴 — 이미 메모리에 있는 `approaches` list 위에서 별도 쿼리 없이 계산. `diameter_max_m`이 NULL인 소행성이 섞여 있을 수 있어 `max()` 호출 전 `None`을 먼저 걸러냄(안 걸러내면 `NoneType`과 `Decimal` 비교로 `TypeError`). 접근 0건인 날은 두 필드 모두 `None` — 셸에서 실제 조건문을 재현해 검증. `04_api_specification.md` v1.5에 실측값(`32.15 LD`, `357621 (2005 EG94)`)으로 반영.

### [완료] Figma 목업 7화면 제작

`3. Cosmic Watch UI MockUp` 페이지에 NEO 대시보드·상세, 외계행성 카탈로그, 크기 비교, 로그인·회원가입, Watchlist 총 7화면. `Cosmic Watch Tokens` 변수 컬렉션으로 색상 7개를 Figma 변수 바인딩(하드코딩 없음).

### [문서] 유즈케이스 다이어그램 신설 및 유저 플로우 갱신

`01_requirements_and_features.md` v1.1 — 3.3절 유즈케이스 다이어그램(Mermaid) 신설. `03_user_scenarios_and_uiux.md` v1.1 — 4.2절 화면 흐름도를 ASCII에서 Mermaid로 교체, 6.1절 와이어프레임에 목업 반영분 갱신. README에 Figma 목업 링크 추가.

### [Git] PR을 마일스톤 완료 시점이 아니라 브랜치 착수 시점에 Draft로 열도록 워크플로 변경

기존 규칙(`마일스톤 완료 시에만 PR 생성`)을 M3부터 변경. Draft 상태에선 Merge 버튼이 잠겨 실수로 미완성 코드가 `main`에 올라가는 걸 막아준다. 반영처 확인 결과 `05_milestones.md`엔 Git 전략 관련 절이 없어 해당 없음, `README.md` `## 개발 워크플로우` 절에 반영 완료.

**이번 세션 커밋**
- `feat(M3): axios 클라이언트 구현 (CSRF 인터셉터, 오류 봉투 처리)`
- `docs(M3): DEVLOG 세션 기록, API 명세 v1.5, 마일스톤 체크박스, README 워크플로 반영`

**다음에 할 일**
- 라우팅 설정 (React Router) → 디자인 토큰 적용 → `Header` 컴포넌트 → NEO 대시보드(`DateNavigator`/`NeoSummary`/`NeoListItem`) 순 (`05_milestones.md` 6장 작업 목록 그대로)

