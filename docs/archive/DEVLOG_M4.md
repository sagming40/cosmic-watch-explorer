# DEVLOG M4 — M3 마무리 ~ M4 v1.0 (2026-10-27)

> **M4 기간의 날짜 블록을 줄 그대로 옮긴 문서다.** 고치지 않는다. 옛 문서 이름은 [대응표](README.md), 지금 기록은 [DEVLOG](../DEVLOG.md).

## 2026-10-27 (화) — Claude Code 이전, `main` 단일 브랜치 전환, 회사 PC 세팅

### [환경] 작업 환경 변경 — claude.ai 채팅 → Claude Code, 학교 PC → 회사 PC

취업으로 학교 PC를 더 이상 쓰지 않고, 회사 PC(회사 Claude 계정)와 집 PC·노트북(개인 Claude 계정)에서 작업한다. 그동안 claude.ai 채팅 + Project Knowledge 수동 업로드로 진행하던 방식을 Claude Code 로컬 세션으로 바꿨다. 기기·계정마다 Claude 메모리가 따로라서, 기기와 무관하게 지켜야 할 규칙(작업 방식·커밋·문서·새 기기 세팅 절차)을 저장소 루트 `CLAUDE.md`에 모았다.

**회사 PC 세팅 검증**: `npm ci` → `showmigrations` 전부 `[X]` → Exoplanet 6,451건 확인(9/1 기록 6,354건보다 많음 — 수집 시점 차이) → `runserver` + `npm run dev`로 대시보드·라우팅 정상, 같은 날짜 재조회 시 `fetch_feed` 미호출(캐시) 확인.

### [Git] `wip:` 커밋 정리 후 `main` 병합, 이후 `main` 단일 브랜치

9/16 세션이 끊기며 남긴 `wip: 작업중`(bb6830a)을 `reset --soft`로 되감아 `feat(M3)` 정식 커밋으로 재구성 → 브랜치에 `--force-with-lease` → `main`에 병합(PR #3) → `M3-frontend-base` 브랜치 삭제. 이후로는 브랜치·PR 없이 `main`에서 바로 작업·push한다(README "개발 워크플로우" 반영).

### [Git] 미push 작업 유실 — 9/16 Recharts 작업

**증상**
9/16 세션에서 만든 Recharts 버전 LunarDistanceBar, `recharts` 의존성, 툴팁 CSS, 문서 수정이 원격 어디에도 없었다.

**원인**
마지막 `wip:` 커밋 이후의 작업을 커밋·push하지 않은 채, 그 기기(집 PC/노트북)의 프로젝트 폴더를 정리하며 지웠다.

**해결**
되살릴 방법이 없어 회사 PC에서 다시 작성하기로 함. 미완성이던 CSS 버전 LunarDistanceBar와 `utils/scale.js`는 Recharts 전환 결정에 따라 `wip:` 정리 커밋에서 제외했다.

**배운 것**
"push하지 않은 커밋/변경은 그 기기에만 있다" — 기기를 오가는 작업에선 세션 끝 push가 저장 버튼이다. `CLAUDE.md` 2.4절에 규칙으로 고정.

### [설계] 9/16 세션 결정 사항 (당시 문서화 전에 유실되어 지금 기록)

- **조회 날짜는 URL `?date=`(`useSearchParams`)에 둔다** — 새로고침·뒤로가기·공유가 공짜로 된다.
- **달력은 브라우저 기본 `<input type="date">`** — 커스텀 달력은 범위 확대. 알려진 동작: 달력 팝업에서 월 이동 화살표만 눌러도 `onChange`가 발생해 조회가 바뀐다. 완료 기준엔 영향 없어 그대로 두고 M5에서 커스텀 달력 여부 판단.
- **LunarDistanceBar: CSS 직접 구현 → Recharts** — 실측 189 LD 등이 0.1~100 LD 범위 끝에 뭉쳐 범위를 0.1~500 LD로 확대했고, 이어서 로그 축 계산을 Recharts에 맡기기로 결정(산점도에서 어차피 도입). `03` v1.2 반영.
- **스케일 바의 빨간 점 기준 = "오늘 1 LD 이내 접근"** — 목록의 `is_hazardous`(NASA PHA 분류)와 다른 기준.
- **CSS 전략: Tailwind는 v1.0 이후로 미룬다** — 지금은 전역 `index.css` + 디자인 토큰(CSS 변수). v1.0 릴리즈 후 확장 단계에서 리팩토링. → **같은 날(10-27) 번복, 지금 도입** (아래 [설계] 참고)
- **⚠ 아이콘은 `⚠︎`(텍스트 표현 선택자)** — 컬러 이모지로 렌더링되면 CSS `color`(`--hazard`)가 먹지 않는다.

### [환경] `requirements.txt` 버전 고정

기존엔 패키지 이름만 있어서 기기마다 설치 시점의 최신 버전이 깔릴 수 있었다(기기 3대 + 계정 2개 환경에서 위험). 회사 PC의 실제 설치 버전으로 고정(`django==6.1.2` 등).

### [설계] Tailwind CSS v4 + shadcn/ui 지금 도입 — "v1.0 이후" 결정 번복

**이유**
순수 CSS로 화면을 짜다 보니 코드가 길고 투박하다. 화면 목업을 다시 만들기로 하면서, 어차피 갈아엎을 거라면 목업 단계에서 Tailwind + shadcn/ui로 만들고 그 코드를 그대로 실제 화면에 옮기는 게 이중 작업이 없다. 남은 화면(NEO 상세·외계행성·인증·Watchlist·크기 비교)이 대부분이라 지금이 전환 비용이 가장 싼 시점.

**설계**
- 색은 여전히 03 문서 2.1절의 토큰 7개만 진짜 값. shadcn의 역할 이름(`--primary`, `--border` …)은 전부 그 토큰을 가리키게 연결(primary=sodium, background=ink, card=panel, border=line, muted-foreground=dim).
- 유틸리티 이름도 토큰 그대로 등록: `bg-panel`, `text-sodium`, `border-line`, `text-hazard`, `font-mono`, `text-h1` 등.
- `--hazard`는 PHA 전용 규칙 유지 → shadcn `destructive`는 hazard에 연결만 하고 버튼 등에는 쓰지 않는다.
- 항상 어두운 화면 → `<html class="dark">` 고정. 그림자는 03 문서 2.4절대로 `--shadow-*` 를 지워 shadcn 기본 `shadow-xs`까지 무력화.

**사전 검증에서 잡은 충돌**
- 기존 `index.css`의 `h1`/`a`/`body` 규칙이 레이어 밖(unlayered)에 있으면 Tailwind 유틸리티보다 무조건 이긴다 → `<h1 className="text-4xl">`이 무시됨. 기존 규칙을 `@layer base`(요소 선택자) / `@layer components`(클래스)로 옮겨 해결. 화면은 변화 없음(h1 28px·IBM Plex Sans Condensed, 배경 #0B0E14 실측 동일).

### [환경] shadcn CLI가 `cn` 경로를 잘못 써서 엉뚱한 npm 패키지 `cn`을 설치

**증상**
`npx shadcn add button` 결과 `import { cn } from "cn"`이 생성되고, `package.json`에 이름만 같은 서드파티 패키지 `cn`이 추가됨.

**원인**
`components.json`의 `utils` 별칭(`@/lib/utils`)은 정상으로 인식(`shadcn info` 확인)되는데도 import 변환이 실패. 해석된 경로가 `src\lib/utils`처럼 역슬래시·슬래시가 섞여 나오는 걸로 보아 Windows 경로 처리 문제로 추정(확정 아님). `add card --dry-run`에서도 똑같이 재현.

**해결**
`npm uninstall cn` + import를 `@/lib/utils`로 수정. 앞으로 `shadcn add` 할 때마다 같은 처리 필요 → `CLAUDE.md`에 절차로 고정.

**배운 것**
CLI가 "알아서" 설치해주는 의존성도 이름을 확인해야 한다 — 이름이 그럴듯한 엉뚱한 패키지가 들어오는 건 공급망 사고와 같은 모양이다.

### [설계] 프론트엔드 TypeScript 전환

**이유**
화면 목업을 새로 만들기 전에 전환하면 목업도 처음부터 `.tsx`로 쓰게 되어 이중 작업이 없다. 지금까지 반복된 실수(`date`/`data` 혼동, `is_cashed` 같은 필드명 오타, `null` 처리 누락)가 전부 "실행해 봐야 아는" 종류였는데, 응답 타입이 있으면 실행 전에 잡힌다. 화면 코드는 목업 후 바뀔 수 있지만 파일이 작아 전환 비용이 작고, 핵심 가치인 API 응답 타입·client·utils는 화면과 무관하게 남는다.

**설계**
- `src/types/api.ts` — 04 문서 + 실제 `serializers.py` 기준으로 17개 엔드포인트 응답 타입 전부 정의. NASA 값은 `number | null`.
- `api/client.ts` — catch로 받는 오류를 `AppError`(code/fields/status) 타입으로 고정.
- Vite react-ts 템플릿 구성(`tsconfig.json` 참조 → app/node), `strict: true`, `npm run build` = `tsc -b && vite build`.
- shadcn `components.json`을 `tsx: true`로 바꾸고 Button을 TS 원본으로 재생성.

**사전 검증에서 잡은 것**
- TypeScript 최신 7.0.2는 `typescript-eslint`(지원 범위 `<6.1.0`)와 호환 안 됨 → `~6.0.3`으로 고정.
- `NeoListItem`의 직경 `null` → `"0 ~ 0"` 버그는 타입이 `number | null`이 되는 순간 드러나는 문제라, 전환 전에 JS로 먼저 고쳐 별도 `fix` 커밋으로 분리.
- shadcn CLI의 `cn` 패키지 오설치 버그는 TS 모드에서도 똑같이 재현 → 같은 방법으로 처리.

**검증**: `tsc -b` 에러 0, `npm run build` 통과, lint는 기존 1건만. 브라우저에서 대시보드 표시, ◀ 클릭 시 `?date=2026-10-26`으로 바뀌며 재조회, `?date=2026-13-99` → `INVALID_DATE` 문구, `/asdf` → 404 화면 확인.

### [설계] 화면 목업 재작성 착수 — `/mockup`, NEO 대시보드 색 시안 3종

**방식**
아티팩트는 회사 계정이라 쓰지 않고(업로드 금지 규칙), 로컬 Vite 앱 안에 `/mockup` 라우트를 만들어 브라우저 패널로 본다. `import.meta.env.DEV`일 때만 라우트가 생겨 배포 빌드에는 목업 코드가 들어가지 않는다. 가짜 데이터도 `NeoDashboardResponse` 타입 그대로라, 확정되면 화면 코드를 실제 페이지로 옮기고 `src/mockup/`은 지운다.

**참고한 것**
개인 프로젝트 목업 2개(PlayLedger, 자재·용어 사전 — 둥근 카드, 알약형 메뉴, Ctrl K 검색, 큰 굵은 제목, 색이 옅게 깔린 강조 카드, 그라데이션 차트)와 채팅 10에서 추천했던 closeapproach.space(카운트다운, 요약 4칸). 사용자 요청: "기본값 말고 요즘 트렌디한 디자인".

**결정 (사용자)**
- 모서리 4px → 8/12/16px 둥근 스타일 (03 v1.4). 그림자 없음은 유지.
- 색은 시안을 그려서 비교 후 결정: A 소듐(지금 토큰 다듬기) / B 딥 스페이스(남색+하늘색) / C 그래파이트(무채색+라임). 하단 막대에서 전환.
- 1차 반응: B·C가 마음에 듦. B는 레퍼런스(closeapproach.space)와 겹치고, C는 이 프로젝트에서 처음 보는 톤이라 끌림 → C 방향의 새 톤 3종 추가: D 바이올렛 / E 포스퍼(레이더 녹색) / F 모노크롬(흰색 강조, 위험 빨강만 유채색).

**사전 검증에서 잡은 것**
- **시안 전환이 안 되는 함정**: `:root`의 `--primary: var(--sodium)`은 `:root`에서 값이 계산된 채 물려진다 → 시안 영역에서 `--sodium`만 바꾸면 `bg-primary`는 옛 색 그대로. 시안 영역에서 역할 변수를 다시 선언해 해결(`mockup.css`).
- **녹색 계열(C·E) 시안은 적록색약에서 "1 LD 안쪽 빨간 점"을 색만으로 구분하기 어렵다** → 시안과 무관하게 1 LD 안쪽 점에 바깥 고리를 둘러 모양으로도 구분(03 문서 9장 "색으로만 표시하지 않는다").
- **IBM Plex Sans엔 한글이 없다** — 지금까지 한글은 시스템 글꼴로 대체돼 보이고 있었음. Pretendard를 로드하고 본문 서체 맨 앞에 둠.
- 산점도의 `0.1 LD` 눈금이 겹침 판정으로 숨겨짐 → `interval={0}`.
- 카운트다운("다음 접근까지")은 03 문서 6.1절 와이어프레임에 있지만 **백엔드에 "오늘 이후 가장 가까운 지구 접근"을 주는 API가 없다**. 목업은 가짜 값 — 실제 구현 전에 API 추가 여부 결정 필요.

**검증**: `tsc -b`·lint(기존 1건) 통과. 브라우저 1440px에서 시안 3종 모두 색 적용 확인(계산값 기준), 1 LD 안쪽 점만 hazard 색, 목록↔차트 마우스 연동, 375px에서 가로 스크롤 없음.

### [설계] 색 C 그래파이트 확정 + 나머지 화면 목업 7개

**결정**: 시안 6종 중 C 그래파이트(무채색 + 라임) 확정 → `index.css` `:root` 토큰 7개 교체, 목업의 시안 덮어쓰기 삭제. 03 문서 v1.5.

**사전 검증에서 잡은 것**
- **토큰 이름 `--sodium`이 색과 안 맞게 됨** (나트륨등 호박색 → 라임) → 역할 이름 `--signal`로 변경(`text-signal`, `bg-signal`). 그대로 두면 "sodium인데 왜 초록?"이 계속 혼란을 만든다.
- **폼 오류 색** ─ 보통 빨강을 쓰지만 `--hazard`는 위험 표시 전용 규칙이 있다. 게다가 shadcn `Input`은 `aria-invalid`일 때 자동으로 `destructive`(= hazard) 빨강을 칠한다. → 오류는 아이콘 + `--bone` 글자 + 테두리 강조로, `aria-invalid` 스타일도 덮어씀. → **사용자 확정(같은 날)**: 부품마다 덮어쓰는 대신 shadcn `--destructive` 역할 자체를 `--bone`에 연결 (03 v1.6).
- 크기 비교 표에 "지름 약 ○ km"(반지름 × 6,371)를 넣으려다 제외 ─ 단위 환산은 서버 원칙(02 문서 1.2절). 배수만 표시.
- 화면마다 날짜가 하루 달랐다(상세는 NASA `approach_date`=UTC 날짜, Watchlist는 KST 변환) → 화면 표시는 전부 KST로 통일.
- "D-1,600"처럼 먼 날짜는 감이 안 와서 두 달 넘으면 "약 4.4년 뒤"로.

**화면 (하단 막대 + `?screen=`으로 전환)**
| 화면 | 핵심 |
|---|---|
| NEO 상세 | 위험 배지, 저장(☆) 버튼, 요약 4칸, **궤도 모식도**(장반경·이심률로 태양–지구 궤도–소행성 궤도를 평면 투영), 크기(이중 원 vs 롯데월드타워 555 m), 데이터 신뢰도(관측 기간), 다음 접근 5건 표 + 전체 87건 보기 |
| 외계행성 카탈로그 | 검색 조건 패널(데이터 범위 힌트, 발견 방법 칩), 적용된 조건 칩(개별 해제·모두 지우기), 지구 대비 크기 원, 페이지 이동. 1024px 미만은 패널 접이식(03 문서 8장) |
| 외계행성 상세 | 03 문서에 와이어프레임이 없던 화면. 요약 4칸, 지구와 나란히, 모항성 6필드, 형제 행성(반지름 미측정은 점선) |
| 크기 비교 | 지구 고정(잠금), 그룹 내 실제 비율 + 그룹 사이 "비율 아님" 표기, 소행성 이중 원, 수치 표 |
| 로그인·회원가입 | 왼쪽 소개 패널 + 오른쪽 폼, `?next=` 복귀 안내, 비밀번호 규칙 체크, 오류 상태 |
| Watchlist | 소행성/외계행성 탭, 다음 접근, 삭제 즉시 + 실행 취소 5초(원래 자리로 복원), 빈 상태 |

**검증**: `tsc -b` 0건, lint 기존 1건. 8화면 모두 375px 가로 스크롤 없음(스크롤 허용 영역 제외), 삭제→실행 취소→5초 후 토스트 닫힘 실측, 오류 테두리 계산값 `#FAFAFA`(빨강 아님), 실제 앱 `/`도 새 토큰으로 정상.

### [설계] 폼 오류 색 확정 — shadcn `destructive` 역할을 `--bone`으로

사용자 확정: 폼 오류는 빨강 없이 흰 테두리 + 아이콘. 입력칸마다 `aria-invalid` 스타일을 덮어쓰면 한 곳만 빠뜨려도 빨강이 샌다 → 역할(`--destructive`) 자체를 `--bone`에 연결해 shadcn 부품 전체에 자동 적용. 빨강은 `text-hazard`로 직접 쓴 곳에만 남는다. (03 v1.6)

### [완료] NEO 대시보드를 목업 디자인 + 실제 API로 재작성

목업(`/mockup`)의 대시보드를 `pages/NeoDashboardPage.tsx`로 옮기고 가짜 데이터를 `api.get<NeoDashboardResponse>`로 교체. 함께 옮긴 것: 새 헤더·레이아웃(배경 포함), `components/common`(Panel·StatCard·HazardBadge), `components/neo`(DateNavigator·NeoSummary·LunarDistanceBar·NeoScatterChart·NeoListItem·NeoFaq), `utils/format.ts`. 옛 컴포넌트(옛 DateNavigator·NeoSummary·NeoListItem, DataField)와 옛 CSS 클래스(`.header`·`.data-field`·`.neo-*`·`.date-navigator`) 삭제.

**사전 검증에서 바꾼 설계**
- **lint `set-state-in-effect` 해결** ─ effect 안에서 `setIsLoading(true)`를 바로 부르던 구조 대신, 결과에 "요청 키(날짜:재시도)"를 붙여 두고 `로딩 = 받아 둔 키 ≠ 지금 키`로 계산. 처음부터 있던 lint 에러 1건이 사라짐(0건).
- **"다음 접근까지" 카운트다운 제외** ─ 그 값을 주는 API가 없다. 가짜 값을 실제 화면에 둘 수 없어 결정 전까지 뺌(01 문서 3.2절에 후보로 기록).
- **헤더 통합 검색(Ctrl K) 제외** ─ 목업에서 나온 새 기능. 01 기능 목록에 없어 범위 관리 규칙대로 3.2절에 후보로만 기록.
- **상태 화면을 지금 같이** (03 문서 11장 "각 단계마다 조금씩") ─ 로딩 스켈레톤 + 3초 넘으면 "NASA에서 가져오는 중", 오류는 코드별 문구 + 다시 시도(잘못된 날짜면 "오늘로 가기"), 0건이면 전날·다음 날 버튼.
- **날짜 이동은 로딩·오류 중에도 보이게** ─ 화면 전체를 갈아끼우면 오류 화면이 막다른 길이 된다.
- **보기 설정(정렬·보조 단위·위험만)은 페이지에** ─ 날짜를 바꿀 때 로딩 화면이 끼면서 목록이 새로 만들어져 설정이 초기화되던 것을 막음.
- **FAQ의 "384,400 km" → "약 38만 km"** ─ M3 완료 기준("프론트 코드에 384400 없음")을 grep으로 속을 수 없게 확인하려고 주석까지 숫자 제거.
- 헤더 "소행성" 메뉴는 `/neo/...`에서도 켜지게(색만), `aria-current`는 "/"에서만.

**검증 (브라우저 실측)**: 오늘 5건 표시 → ◀로 10-26(9건), 정렬(속도순) 유지·내림차순 확인 → `?date=2026-13-99`에서 오류 문구 + "오늘로 가기" 동작 → 10-26 위험 분류 카드 hazard 색, "위험 분류만" 1건 + 배지 → 목록 클릭 시 `/neo/3831888` 이동·직접 열어도 유지 → 375px 가로 스크롤 없음. `tsc -b`·lint 0건, `npm run build` 통과.
**확인 못 한 것**: 1 LD 안쪽 접근이 있는 실제 날짜(빨간 점), 0건인 날짜, NASA 장애(UPSTREAM_ERROR), 3초 넘는 느린 응답 안내.

### [완료] NEO 상세 구현 + M3 완료 ✅

목업의 NEO 상세를 `pages/NeoDetailPage.tsx`로 옮기고 `GET /api/neo/{id}/`·`/approaches/`에 연결. 새 부품: `OrbitPanel`(궤도 모식도 + 요소 6개), `NeoSizePanel`(이중 원 vs 롯데월드타워), `ObservationPanel`(데이터 신뢰도), `ApproachTable`(다음 접근·전체 기록 공용), `components/common`의 `Field`·`StateViews`(로딩·오류, 대시보드와 공용)·`WatchlistButton`.

**사전 검증에서 정한 것**
- "더 보기"는 같은 화면에서 펼치고 20건씩 이어 불러오기. 요청은 버튼을 누를 때만 나간다 ─ 상세를 열 때마다 전체 기록(수백 건)을 받지 않는다.
- 제목 "다음 접근 5건" → 실제 건수(`다음 접근 2건`). 미래 접근이 5건 미만인 소행성이 실제로 있다.
- "소행성 목록" 버튼: 앱 안에서 왔으면 뒤로 가기(보던 날짜 유지), 주소로 바로 들어왔으면 `/`.
- **`WatchlistButton`은 M4 작업을 앞당김** ─ API(POST/DELETE)가 이미 있고 401이면 `/login?next=`로 보내면 돼서. 05 문서 M4 목록에 이관 메모(10.3절).

### [프론트엔드] 0.1 LD 끝에 붙은 점이 반쯤 잘림

**증상**
`?date=2029-04-13` 아포피스(0.10 LD)의 빨간 점이 스케일 바 왼쪽 끝에서 반만 보였다.

**원인**
Recharts `allowDataOverflow`를 켜면 그래프 영역(축 안쪽) 밖을 `clip-path`로 잘라낸다. 0.1 LD = 축의 시작점이라 점의 왼쪽 절반이 영역 밖.

**해결**
`allowDataOverflow` 제거. 범위 밖 값은 이미 `clampLd()`로 가둬서 넘기므로 넘칠 일이 없다. `clip-path` 0개 확인.

**배운 것**
"범위 밖 값을 허용"하는 옵션이 "범위 밖을 잘라낸다"는 부작용을 같이 갖고 있었다 ─ 경계값(정확히 최솟값)을 일부러 넣어 봐야 보이는 버그.

### [외부API] 1 LD 안쪽 접근을 최근 날짜에서 못 찾은 이유

NASA Feed로 9/28~10/25(4주)를 훑었지만 1 LD 안쪽 0건, 이름에 2026이 들어간(올해 발견) 천체도 0건. Feed가 미래 날짜에 대해 돌려주는 건 **궤도가 이미 확정된 천체의 예측 접근**뿐이라, 지나가기 직전에 발견되는 작은 근접 소행성은 들어 있지 않다. → 미래에 확실히 1 LD 안쪽으로 오는 **아포피스(2029-04-13, 0.10 LD)** 로 완료 기준을 확인.

**M3 완료 기준 실측 (7/7)**
- 스케일 바: `2029-04-13`에서 기준선 왼쪽 점 전부 hazard, 오른쪽 0개, 고리까지 보임
- 더 보기: `3841173`(전체 5건) 없음 / `3463448`(10건) 있음 / `3831888`(31건) 20 + 더 불러오기 → 31/31
- 그 외: 없는 ID → `NOT_FOUND` 화면, 저장(비로그인) → `/login?next=`, 목록→상세→뒤로 가기 시 `?date=` 유지, 375px 가로 스크롤 없음, `tsc -b`·lint 0건

### [완료] M4 착수 — 외계행성 카탈로그·상세 (목업 디자인 + 실제 API)

`pages/ExoplanetListPage`·`ExoplanetDetailPage` 구현. 새 부품 `components/exoplanet/`(FilterPanel·FilterChips·ExoplanetListItem·HostStarPanel·PlanetSizePanel·SiblingPlanets), `components/common/Pagination`, `utils/exoplanetQuery.ts`.

**설계 (사전 검증 포함)**
- **검색 조건·정렬·페이지는 전부 주소에** ─ 쿼리스트링을 그대로 API에 넘긴다(파라미터 이름 = API 이름). 03 문서 예시의 `distance_max`는 실제 이름 `distance_max_ly`로 정정(03 v1.7).
- 입력칸은 "검색"(또는 Enter)을 눌러야 주소에 반영. 칩 해제·뒤로 가기로 주소가 바뀌면 `FilterPanel`을 `key=주소`로 새로 만들어 입력칸도 맞춘다 ─ effect로 상태를 맞추지 않아 lint 규칙과도 맞음.
- **칩은 서버가 돌려준 `applied_filters`로** 그린다. M4 완료 기준("칩 2개")을 다시 읽다가, 최소·최대를 따로 그리면 칩이 3개가 되는 걸 발견 → 같은 항목은 "반지름 0.8 ~ 1.5" 칩 하나로 합침(× 누르면 둘 다 빠짐, 03 와이어프레임과 같은 모양).
- **400(입력값 오류)** ─ `fields`의 칸에 흰 테두리(폼 오류 규칙) + "확인할 칸: 반지름 최소, …" + 조건 지우기. 다시 시도해도 같은 결과라 재시도 버튼 대신.
- **반지름이 지구의 87배인 행성(V2376 Ori b)** ─ 지구 70px 고정 축척이면 원 지름이 1만 px을 넘는다 → 큰 쪽이 최대 크기를 넘지 않게 축척을 줄임(비율 유지). 목록 원은 칸 크기에서 자르고 점선 고리로 "더 크다" 표시.
- 발견 방법 선택지·데이터 범위 힌트는 `/meta/` ─ 실패해도 검색은 되게 오류 화면을 띄우지 않음.

**검증 (브라우저 실측)**: 조건 3개 입력 → `?radius_min=0.8&radius_max=1.5&distance_max_ly=100`, 53건, 칩 2개 → 같은 주소 새 탭에서 53건·상위 3건 동일·입력칸 채워짐 → 정렬 "가까운 순" 오름차순 확인 → 2/3 페이지 → 반지름 칩 해제 시 526건·입력칸 비워짐 → 뒤로 가기 시 주소·입력칸 복원 → `radius_min=abc&year_min=1.5` 칸 2개 테두리 `#FAFAFA` → `radius_min=50&distance_max_ly=10` 0건 안내 → TRAPPIST-1 e 상세, 형제 행성 클릭 이동, 뒤로 두 번에 검색 결과 복귀 → 프록시마 b `—` → 없는 id `NOT_FOUND` → 375px 가로 스크롤 없음. `tsc -b`·lint 0건.

### [프론트엔드] 값이 없는데 단위만 남음 / 긴 값이 카드 밖으로

**증상**
① TRAPPIST-1 계의 거리가 DB에 없어(NASA 원본 NULL) 상세 제목 아래·목록 줄에 "— 광년". ② 휴대폰 폭에서 질량 `6,356.57 × 지구`가 2열 카드 밖으로 4px 밀려나 가로 스크롤.

**원인**
① `Field`·`StatCard`는 "값이 없으면 단위 숨김"을 지키는데, 문장 안에 직접 쓴 곳은 빠져 있었다. ② `StatCard` 수치 줄이 줄바꿈 없는 flex.

**해결**
① 거리가 null이면 "거리 미측정". ② `StatCard` 수치 줄에 `flex-wrap` + 카드에 `min-w-0` (공용 부품이라 다른 화면에도 적용).

**배운 것**
NULL 보존 원칙은 부품(DataField·StatCard)에만 넣어 두면 문장 속 표시에서 새어 나간다 ─ 새 화면은 실제 DB의 NULL 많은 행(이름으로 찾은 실제 행성)으로 꼭 열어 볼 것.

### [완료] 로그인·회원가입 + `AuthProvider` + 헤더 로그인 상태

- `auth/AuthProvider`: 앱이 뜰 때 CSRF 쿠키 받기 + `/api/auth/me/` 확인 → `status`(loading/ready)·`user`·`login`/`signup`/`logout`을 방송. 예전 `App`의 `ensureCsrf()` useEffect는 여기로 옮김
- `auth/next.ts` `safeNext()`: `?next=`는 `/`로 시작하는 앱 내부 주소만 허용(`//evil.com`·`/\`·`/login` → `/`) ─ 남의 사이트로 튕겨 보내는 오픈 리다이렉트 방지
- 로그인·가입 성공 시 `navigate(next, { replace: true })` ─ 뒤로 가기로 로그인 화면이 다시 나오지 않는다. 이미 로그인한 채로 `/login`에 오면 바로 next로
- 헤더: 확인 중엔 빈 자리(로그인 버튼이 깜빡였다 사라지지 않게), 비로그인 `로그인`(지금 주소를 next로), 로그인 `내 관심 천체`·머리글자·로그아웃
- `WatchlistButton`: 로그인 안 된 게 확실하면 API 없이 바로 로그인 화면으로, 로그아웃하면 `저장됨` 표시도 바로 풀림
- `/watchlist`는 `ProtectedRoute`로 감쌈(비로그인 → `/login?next=%2Fwatchlist`) ─ *계획에 없던 작업*
- 실측: 저장 → 로그인(틀린 비밀번호 문구 확인) → 원래 상세 복귀·`저장됨` / 가입 → 복귀 → 새로고침 없이 저장 / 서버 칸 오류(중복 아이디·흔한 비밀번호) / 375px. 테스트 계정 3개는 확인 후 삭제

### [프론트엔드] 로그인한 뒤 저장·로그아웃이 전부 403 `CSRF_FAILED`

**증상**
가입 직후 저장 버튼을 눌러도 아무 일이 없다. 직접 `fetch`로 `X-CSRFToken`(쿠키 값 그대로)을 붙여도 403 `CSRF_FAILED`. 로그인·가입은 잘 된다. 로그아웃도 화면에선 풀렸지만 서버 세션은 살아 있었다(`finally`에서 `setUser(null)`이라 티가 안 났다).

**원인**
Vite 프록시를 `/api: http://localhost:8000`(문자열)로 쓰면 `Host`가 `localhost:8000`으로 바뀐다. 브라우저의 `Origin`은 `http://localhost:5173`(이날은 5174) 그대로라 Django CSRF의 Origin 검사가 "Origin ≠ Host"로 거부. 로그인·가입은 **비로그인 요청이라 DRF가 CSRF 검사를 건너뛰어서** 통과했던 것. curl로 Host·Origin 조합 4개를 바꿔 보니 `Host=8000 + Origin=5174/5173`만 403, `Host=5174 + Origin=5174`·Origin 없음은 201.

**해결**
`vite.config.ts`: `/api: { target: http://localhost:8000, changeOrigin: false }` ─ Host를 브라우저가 보낸 그대로 넘긴다. `CSRF_TRUSTED_ORIGINS`에 포트를 적는 방법도 있지만, 5173이 사용 중이면 5174로 바뀌는 포트를 다 적어야 해서 프록시 쪽을 고침.

**배운 것**
M2 API 검증은 curl·Client(Origin 없음)로만 해서 안 보였다. "로그인 상태 + 브라우저"로 POST를 한 번도 안 해 본 구간이 있었던 것 ─ 로그인 후 쓰기 동작은 반드시 실제 브라우저로 확인. 화면이 "성공한 것처럼" 보이는 `finally` 처리(로그아웃)는 서버 상태(`/me/`)로 따로 확인해야 한다.

### [백엔드] Django·DRF 기본 오류 문구가 영어로 나옴

`LANGUAGE_CODE`가 `en-us`라 가입 칸 오류("This password is too common.")가 영어로 나왔다 → `ko-kr`로 변경. 단 빈 칸 오류는 "이 필드는 blank일 수 없습니다."처럼 어색해서, 화면 입력칸에 `required`를 붙여 서버까지 가지 않게 함.

### [완료] 내 관심 천체(Watchlist) 화면 — 목업 디자인 + 실제 API

- 소행성 / 외계행성 탭(지금 탭은 `?tab=exo`로 주소에), 목록 두 개를 `Promise.all`로 한 번에 받아 탭에 개수 표시
- 소행성 줄: 위험 배지, 추정 직경(없으면 단위까지 빼고 `—`), 다음 지구 접근(`약 N년 뒤`, 1 LD 안쪽은 빨강 + 아이콘 + 화면 낭독용 글자)
- 외계행성 줄: 카탈로그와 같은 지구 비교 원, 거리 없으면 `거리 미측정`
- 삭제는 확인창 없이 즉시 DELETE + 실행 취소 5초 토스트. 연달아 지우면 토스트가 새 항목으로 바뀌고 타이머 다시 5초
- 부품: `components/watchlist/` (`NeoWatchItem`·`ExoWatchItem`·`RemoveButton`·`UndoToast`·`WatchlistEmpty`)

### [설계] 실행 취소 = "다시 POST" ─ 그래서 생기는 일 3가지

사전 검증(목업대로 구현했다고 가정하고 돌려 보기)에서 찾은 것:
1. **saved_at이 "방금"으로 바뀐다** ─ 되살린 항목은 새 행이라서. 화면에선 원래 자리에 돌려놓고 저장일은 POST 응답 값으로 바꿈. 새로고침하면 최근 저장순이라 맨 위로 올라간다(허용).
2. **DELETE가 끝나기 전에 실행 취소를 누르면** POST가 먼저 처리되고 늦게 온 DELETE가 되살린 걸 다시 지울 수 있다 → 실행 취소는 그 DELETE 약속(Promise)이 끝난 뒤에 POST.
3. **DELETE가 실패하면** 화면에선 사라졌는데 서버엔 남는다 → 줄을 되돌리고 토스트를 "삭제하지 못했어요"로. (csrftoken 쿠키를 지워 403을 일부러 내서 확인)

"5초 뒤에 진짜 삭제"(지연 삭제)도 생각했지만, 그 사이 탭을 닫으면 지운 줄 알았던 게 남고 여러 개를 연달아 지울 때 대기열이 필요해서 03 문서대로 "즉시 DELETE + 다시 POST"를 유지.

### [프론트엔드] 세션 만료(401) 때 로그인 화면 ↔ 원래 화면 핑퐁 (사전 검증에서 발견)

**증상(예상)** 서버 세션만 끝난 상태에서 저장·삭제를 누르면 401 → 로그인 화면으로 보내는데, `AuthProvider`는 아직 로그인 상태라 로그인 화면이 "이미 로그인됨"으로 보고 next로 바로 돌려보낸다.
**해결** 401(`AUTH_REQUIRED`)을 받으면 `logout()`으로 화면의 로그인 상태부터 지우고 이동. `WatchlistButton`에도 같은 구멍이 있어서 같이 고침.
**확인** `fetch`로 서버 세션만 로그아웃 → 화면에서 삭제 클릭 → 헤더가 `로그인`으로 바뀌고 `/login?next=%2Fwatchlist%3Ftab%3Dexo`에 멈춤 → 다시 로그인하면 외계행성 탭으로 복귀.
**배운 것** "화면이 기억하는 로그인 상태"와 "서버 세션"은 따로 논다. 둘이 어긋나는 순간(401)에 화면 쪽을 맞춰 줘야 한다.

### [완료] 크기 비교(SizeComparison) 화면 + `/mockup` 폴더 삭제

- 비교 대상은 주소에(`?exo=72,6400&neo=2099942`) ─ 숫자 아닌 값·중복은 버리고 그룹당 4개까지. 상세 화면 링크 2곳(외계행성 "지구와 크기 비교", NEO "크기 비교에서 자세히 보기")이 그 천체를 고른 채로 연다
- 대상마다 상세 API(#7·#10). 목록에서 고른 대상은 크기를 이미 알아서 캐시에 미리 넣는다 → **NEO 상세(NASA Lookup, 30회/시간 스로틀)를 다시 안 부른다** (실측: 오늘 목록에서 추가 시 상세 호출 0회)
- 없는 id·스로틀 등 실패는 칩으로 남긴다(`없는 소행성 (9999999)`, 다시 불러오기 버튼)
- 화면 9개가 전부 옮겨져서 `src/mockup/`(8화면·색 시안)과 `/mockup` 라우트 삭제 ─ 필요하면 git 기록에서 꺼내 보면 된다

### [설계] "그룹 간 로그 스케일"을 한 자 로그 눈금 띠로

03 문서 6.4절은 "두 그룹 사이는 로그 스케일로 배치", 목업은 그룹 둘 + "≈ 1만 배 차이" 알약뿐이었다(로그가 어디에도 없음). 와이어프레임처럼 한 그림 안에 로그 위치로 섞으면 원 크기(선형)와 위치(로그)가 다른 규칙이라 읽기 어렵다 → 그림 두 덩어리는 그대로 두고, 아래에 **모든 천체를 지름 한 자(한 칸 = 10배)에 올린 띠**를 추가. 소행성은 점 대신 최솟값~최댓값 막대. 알약 문구는 실제 배수("지구가 약 1.4만 배" = 12,742 km ÷ 아포피스 최댓값 904 m). 03 문서 v1.8 구현 메모.

지구 반지름 6,371 km를 프론트 상수로 둔 것: "도메인 계산은 서버에서" 원칙은 NASA 값 환산(LD·광년)을 말하는 것이고, 지구는 고정 기준이라 롯데월드타워 555 m(NeoSizePanel)와 같은 취급. `utils/compareQuery.ts` 한 곳에만.

### [프론트엔드] 휴대폰 폭에서 로그 눈금 글자가 겹침

**증상** 375px에서 눈금 칸이 약 150px인데 1 m ~ 1,000만 km 10칸 글자가 다 붙어 `1,000 km`·`100,000 km`가 겹침 (`getBoundingClientRect`로 확인 ─ 창이 가려져 스크린샷 불가).
**해결** 10배마다 선은 다 긋고, 글자는 4칸 이하면 전부 / 넘으면 1,000배마다(1 m · 1 km · 1,000 km · 100만 km) / 휴대폰에서 6칸 넘으면 그중 하나 걸러. 1,000,000 km 이상은 "100만 km"로 줄임.
**배운 것** 로그 축은 범위가 데이터마다 크게 달라진다(87배 행성 하나로 3칸 늘어남). 눈금 개수를 "가장 넓은 경우"로 확인할 것.

### [프론트엔드] 그룹이 꽉 찼는데 검색 결과의 "추가" 버튼이 눌림 (실측 중 발견)

4개가 찬 뒤에도 결과 줄 버튼이 켜져 있고 눌러도 아무 일 없음(addPlanet의 방어 코드가 조용히 막음) → `full`을 넘겨 버튼을 끄고 "한 그룹에 4개까지" 안내.

### [설계] 화면·조회 API 전체를 로그인 뒤로 잠금 — "비회원 탐색" 설계 번복

**결정 (사용자)**: 로그인이 생겼으니 주소만 치면 보이는 화면을 잠근다. 범위는 3안 중 "화면 + API"(추천안). 01 v1.3 · 03 v1.9 · 04 v1.6 · 05 v1.21에 변경 표시.

| 안 | 내용 | 판단 |
|---|---|---|
| 화면 + API (채택) | 프론트 전체 ProtectedRoute + 백엔드 조회 API도 401 | 화면만 잠그면 `/api/neo/`를 직접 치면 데이터가 다 보인다 ─ 현관만 잠그고 창문 열어 둔 꼴 |
| 화면만 | 프론트만 감싸기 | 빠르지만 잠금이 아님 |
| 그대로 | 비회원 탐색 유지 | 포트폴리오 면접관이 가입 없이 써 볼 수 있는 장점은 포기 |

**어떻게**
- 백엔드: 뷰마다 붙이지 않고 `DEFAULT_PERMISSION_CLASSES = [IsAuthenticatedOr401]`("기본 잠금"). 공개는 인증 API 4개만 `AllowAny` 명시 ─ 새 API를 만들고 빠뜨려서 열리는 사고가 없다. 덤: 비로그인 요청은 뷰 전에 401이라 NASA 호출·스로틀을 소모하지 않는다
- 프론트: `/login`·`/signup` 밖의 라우트를 path 없는 `<Route element={<ProtectedRoute><Outlet/></ProtectedRoute>}>` 하나로 감쌈 ─ 화면도 "기본 잠금". 비로그인 헤더는 메뉴 숨김 + 로그인/회원가입 전환 버튼
- 401 처리를 한 곳으로: `AuthProvider`에 응답 감시(interceptor) ─ `AUTH_REQUIRED`면 로그인 상태를 지운다 → ProtectedRoute가 `/login?next=지금 주소`. Watchlist 화면·저장 버튼에 있던 화면별 `logout()` 처리는 지움
- 로그아웃 뒤엔 `/login?next=보던 주소` (Header에서 `navigate("/login")`을 했지만 문지기의 이동이 나중에 덮어써서, 문지기 동작으로 통일)

### [백엔드] 권한 클래스를 전역 기본값으로 올리자 순환 import

**증상** `manage.py check`: `ImportError: Could not import 'config.permissions.IsAuthenticatedOr401' for API setting 'DEFAULT_PERMISSION_CLASSES' … cannot import name 'exception_handler' from partially initialized module 'rest_framework.views'`. 켜 둔 runserver도 이 오류로 내려가 있었다.
**원인** `rest_framework.views`가 로드되며 설정을 읽음 → `config.permissions` → (맨 위 import) `config.exception_handler` → `rest_framework.views`(아직 로드 중) ─ 한 바퀴.
**해결** `AuthRequired` import를 `has_permission()` 안으로 옮김. 요청을 처리할 땐 모든 모듈이 이미 올라와 있다.
**배운 것** 설정에 "문자열 경로"로 등록하는 클래스(DEFAULT_*_CLASSES)는 DRF 내부보다 먼저 import될 수 있다. 그 모듈은 DRF의 views·exception 쪽을 맨 위에서 import하지 않는다.

**열린 질문 (M4 시각화 때)**
- ~~03 문서 6.1절 산점도의 "점 색상 = 위험 여부"가 NASA PHA(`is_hazardous`)인지 "1 LD 안쪽"인지.~~ → 같은 날 결정: **점 색 = PHA, 1 LD 안쪽은 고리** (아래 [설계])

### [설계] 산점도 점 색 = PHA(`is_hazardous`), 1 LD 안쪽 = 고리

**결정** 산점도 점 색은 NASA PHA 분류로 칠하고, "1 LD 안쪽"은 PHA 여부와 상관없이 바깥 고리로 따로 표시한다. 스케일 바는 그대로(1 LD 안쪽만 hazard 색 + 고리).
**이유** 산점도는 거리가 이미 X축이라 색까지 거리로 칠하면 같은 정보를 두 번 그리는 셈이다. 목록의 ⚠(PHA)와 산점도 색의 뜻을 맞추고, 고리는 스케일 바와 같은 뜻("달보다 가까움")으로 공유한다. 그리고 최근 날짜엔 1 LD 안쪽 접근이 거의 없어서, 1 LD 기준이면 완료 기준("위험 소행성이 색으로 구분")을 실제 화면으로 확인할 수 없었다.
**구현** PHA 점은 삼각형(목록 ⚠와 같은 모양 ─ 색 없이도 구분, 03 문서 9장), 그 밖은 원. 스케일 바와 색 기준이 달라 차트 아래에 범례를 두고, 말풍선에도 "잠재적 위험 소행성(PHA)"·"달보다 가까움"을 글자로 표시.
**검증** `2029-04-13` 점 9개 → 삼각형 1(아포피스, 0.10 LD)·고리 1·원 8 ─ API의 PHA 1건·1 LD 안쪽 1건과 일치. `2026-09-15` → 삼각형 1(2011 EU29, 52.45 LD)·고리 0, 말풍선 PHA 문구 확인. 콘솔 오류 0.
**남은 것** 0.1 LD 끝에 붙은 점(아포피스)의 고리가 Y축 눈금 숫자에 살짝 겹친다 ─ 기능 문제는 아니라 M5 다듬기 때.

**알려진 이슈 (이번 세션에서 확인, 미처리)**
- `npm run build` 경고: JS 번들 741 kB(gzip 230 kB) > 500 kB ─ Recharts·Radix가 들어오면서. 오류는 아니고 페이지별 지연 로딩(code splitting)으로 줄일 수 있음 → M5(완성도) 또는 M6(배포) 때.
- ~~`npm run lint` 에러 1건 (`react-hooks/set-state-in-effect`)~~ → 같은 날 대시보드 재작성으로 해결 (0건) 처음 5건 중 2건은 wip 정리에서 뺀 CSS LunarDistanceBar·scale.js 쪽이었고, shadcn 생성 파일 2건은 eslint 설정으로 완화.
- `npm audit` high 5건 — 런타임은 `follow-redirects`(axios 의존) 1건, 나머지는 개발 도구. 별도 `chore` 커밋으로 처리 예정.
- `settings.py`의 `ALLOWED_HOSTS = []` — 9/8 기록엔 변경했다고 되어 있으나 실제 코드는 빈 목록(테스트 Client 검증 시 shell 안에서만 임시 추가했던 것으로 보임).
- ~~`NeoListItem`의 `formatDiameterRange`가 직경 null이면 `"0 ~ 0"` 표시~~ → 같은 날 수정 (`fix(M3)` 커밋)
- ~~NASA API 키가 과거 채팅 로그(traceback URL)에 노출된 적 있음 → 재발급 권장.~~ → 10-27 재발급 완료 (회사 PC·집 PC `.env` 모두 새 키)

**이번 세션 커밋**
- `feat(M3): NeoListItem·DateNavigator 구현 및 날짜 유틸(utils/date.js) 분리` (wip 재정리)
- `docs: CLAUDE.md 추가 — main 단일 브랜치·자동 커밋 규칙, 기기 간 작업 절차`
- `chore(M3): requirements.txt 버전 고정`
- `docs(M3): DEVLOG·05·03·README 갱신 — 작업 방식 전환 및 9/16 결정 사항 기록`
- `merge(M3): M3 중간 작업분 병합 및 main 단일 브랜치 전환 (#3)`
- `docs: CLAUDE.md에 구현 전 사전 검증 규칙 추가`
- `chore(M3): Tailwind CSS v4 + shadcn/ui 도입 및 디자인 토큰 연결`
- `chore: 로컬 미리보기용 .claude/launch.json 추가`
- `docs(M3): Tailwind·shadcn 도입 결정 및 사용 규칙 문서화`
- `fix(M3): 추정 직경이 null인 소행성이 "0 ~ 0 m"로 표시되던 문제 수정`
- `refactor(M3): 프론트엔드 TypeScript 전환 및 API 응답 타입 정의`
- `docs(M3): TypeScript 전환 기록 및 규칙 문서화`
- `chore(M3): recharts·shadcn 부품 추가, 모서리 둥글게·Pretendard 적용`
- `feat(M3): /mockup NEO 대시보드 목업 (색 시안 3종)`
- `docs(M3): 목업 착수·모서리/서체 변경 기록`
- `feat(M3): 목업 색 시안 D·E·F 추가 및 1 LD 안쪽 점 모양 구분`
- `docs(M3): 목업 시안 추가 기록`
- `docs(M3): DEVLOG 현재 상태의 시안 개수 정정 (3종 → 6종)`
- `refactor(M3): 색 토큰 C 그래파이트로 확정, --sodium → --signal 이름 변경`
- `feat(M3): 목업 7화면 추가 (NEO 상세·외계행성 목록/상세·크기 비교·로그인·회원가입·Watchlist)`
- `docs(M3): 색 확정·화면 목업 기록`
- `chore(M3): Tailwind 임의값 클래스를 표준 클래스로 교체 (VS Code 경고 3건)`
- `refactor(M3): 폼 오류 색 확정 — shadcn destructive 역할을 hazard → bone으로`
- `docs(M3): 폼 오류 규칙 확정 반영 ('확인 대기' 제거)`
- `feat(M3): NEO 대시보드를 새 디자인 + 실제 API로 재작성`
- `docs(M3): 대시보드 이전 기록, 완료 기준 5개 체크`
- `refactor(M3): 로딩·오류 화면을 공용 StateViews로 분리`
- `fix(M3): 0.1 LD 끝에 붙은 차트 점이 반쯤 잘리던 문제 수정`
- `feat(M3): NEO 상세를 새 디자인 + 실제 API로 구현 (전체 접근 기록 더 보기 포함)`
- `docs(M3): M3 완료 처리 — 완료 기준 7개 실측`
- `docs(M3): 세션 마무리 — 다른 기기에서 이어가기 위한 정리`
- `feat(M4): 외계행성 카탈로그·상세를 새 디자인 + 실제 API로 구현`
- `fix(M4): 긴 수치가 휴대폰 폭에서 요약 카드 밖으로 밀려나던 문제`
- `docs(M4): 외계행성 화면 기록, M4 완료 기준 3개 체크`
- `fix(M4): Django·DRF 기본 오류 문구가 영어로 나오던 문제 (LANGUAGE_CODE ko-kr)`
- `fix(M4): Vite 프록시가 Host를 바꿔 로그인 후 POST가 CSRF 403이던 문제`
- `feat(M4): 로그인·회원가입 화면 + AuthProvider + 헤더 로그인 상태`
- `docs(M4): 로그인·회원가입 기록, M4 완료 기준 2개 체크`
- `fix(M4): 세션 만료(401) 때 로그인 화면과 원래 화면을 오가던 문제`
- `feat(M4): 내 관심 천체(Watchlist) 화면 ─ 탭·다음 접근·삭제 + 실행 취소`
- `docs(M4): Watchlist 화면 기록`
- `feat(M4): 크기 비교 화면 ─ 지구 고정, 소행성 이중 원, 로그 눈금 띠`
- `docs(M4): 크기 비교 기록, M4 완료 기준 2개 체크`
- `chore(M4): /mockup 라우트 삭제 (목업 폴더 삭제의 나머지 절반)` ─ 폴더 삭제는 실수로 feat 커밋에 섞임, 그 두 커밋만 꺼내면 빌드 깨짐
- `docs(M4): DEVLOG 커밋 목록을 실제 커밋에 맞춤`
- `fix(M4): 권한 클래스를 전역 기본값으로 올릴 때의 순환 import 방지`
- `feat(M4): 조회 API 전체를 로그인 필요로 (기본 잠금)`
- `feat(M4): 로그인·회원가입 외 전체 화면 잠금 + 401 공통 처리`
- `docs(M4): 화면·API 잠금 결정 기록, 01·03·04 문서 비회원 설계 변경 표시`
- `docs(M4): 세션 마무리 ─ 다음에 할 일 정리`
- `chore(M4): 로컬 전용 채팅 기록 문서를 gitignore에 추가` ─ `docs/CHAT_HISTORY.md`(claude.ai 채팅 14개 정리, 로컬 전용·구글 드라이브로 기기 간 이동)
- `docs(M4): NASA API 키 재발급 완료 기록`
- `feat(M4): 산점도 점 색을 PHA 기준으로, 1 LD 안쪽은 고리로 구분`
- `chore(M4): break-words를 Tailwind v4 표준 클래스 wrap-break-word로 교체` (VS Code 경고 1건, NEO·외계행성 상세 h1)
- `docs(M4): 산점도 색 기준 결정 기록, 03·05 문서 갱신` (이 커밋 자체)

**다음에 할 일** (다음 세션은 여기서 시작)
- **M4 이어서** ─ ~~외계행성 카탈로그·상세~~ ~~로그인·회원가입~~ ~~Watchlist 화면~~ ~~크기 비교~~(10-27 완료) ~~산점도~~(10-27 완료, 점 색 = PHA·1 LD = 고리) → **01 문서 9장 MVP 대조** (05·DEVLOG는 "22개"라고 적었지만 9장 체크박스는 19개 ─ 개수부터 바로잡기) → v1.0 태그
- **새 기기에서 열면**: 10-27부터 모든 화면이 로그인 필요 → DB가 기기마다 따로라 그 기기에서 회원가입부터(CLAUDE.md 2.5절). 포트폴리오 공개 전엔 체험용 계정을 둘지 정하기(배포 M6)
- **결정 필요**: "다음 접근까지" 카운트다운용 API를 만들지 (01 문서 3.2절 후보)
- **아직 실물로 못 본 상태 화면**: 접근 0건인 날짜, NASA 장애(`UPSTREAM_ERROR`), 3초 넘는 응답 안내
- **알려진 이슈**: 번들 812 kB 경고(10-27 크기 비교까지, 처음 741 kB)(code splitting, M5~M6) · `npm audit` high 5건(별도 chore) · `settings.py` `ALLOWED_HOSTS = []` · ~~과거 채팅에 노출된 NASA API 키 재발급~~(10-27 완료)
- 검증용 날짜·ID는 `CLAUDE.md` 2.5절

