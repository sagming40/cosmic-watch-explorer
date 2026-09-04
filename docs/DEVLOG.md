# DEVLOG — Cosmic Watch & Explorer

개발하면서 마주친 문제와 해결 과정을 기록한다.

---

## 이 파일을 쓰는 이유

### 1. 면접에서 쓸 수 있는 거의 유일한 재료다

완성된 코드는 면접관에게 "이 사람이 이걸 만들 수 있다"만 알려준다. 하지만 면접에서 실제로 묻는 건 이것이다.

> "개발하면서 가장 어려웠던 점은 무엇이었나요?"

이 질문에 "음... 딱히 없었는데요"라고 답하면 끝이다. 그런데 3개월 전에 겪은 문제는 반드시 잊어버린다. **기록하지 않으면 답할 재료가 없다.**

### 2. 같은 문제를 두 번 겪지 않는다

특히 환경 설정 문제(DB 연결, CORS, 인코딩)는 몇 주 뒤에 똑같이 재발한다. 그때 이 파일을 검색하면 5분에 끝날 일이, 없으면 다시 두 시간이 든다.

### 3. 진행 속도를 실측할 수 있다

"NASA 데이터 수집까지 3일 걸렸다"는 기록이 있어야, 남은 기능이 얼마나 걸릴지 추정할 수 있다. 추측이 아닌 근거 있는 일정을 세우는 유일한 방법이다.

---

## 작성 규칙

- **매일 쓰지 않아도 된다.** 막혔던 일이 있을 때만 쓴다. 아무 일 없이 술술 풀린 날은 한 줄로 충분하다.
- **해결한 직후에 쓴다.** 다음 날 쓰면 "왜 그게 문제였는지"를 이미 잊는다.
- **잘 안 된 것도 쓴다.** 삽질 기록이 성공 기록보다 가치 있다.
- **코드를 붙일 때는 문제가 된 부분만.** 파일 전체를 복사하지 않는다.

### 항목 형식

```markdown
### [카테고리] 제목

**증상**
무슨 일이 일어났는지. 오류 메시지가 있으면 그대로.

**원인**
왜 그랬는지.

**해결**
어떻게 고쳤는지. 코드는 최소한으로.

**배운 것**
다음에 비슷한 상황에서 써먹을 수 있는 한 줄.
```

### 카테고리

`환경설정` `DB` `백엔드` `프론트엔드` `외부API` `설계` `배포`

---

## 현재 상태

| 항목 | 내용 |
|---|---|
| 마지막 완료 마일스톤 | **M1 — 데이터 계층 ✅** |
| 다음 작업 | M2 진행중 — NEO API 3개(`GET /api/neo/`, `GET /api/neo/{nasa_id}/`, `GET /api/neo/{nasa_id}/approaches/`) 구현·검증 완료. 다음은 Exoplanet API(`filters.py` 다중 조건 검색, 광년 ↔ 파섹 변환) 또는 인증 · Watchlist 중 택 1 |
| 최근 병합 커밋 | `merge(M1): 데이터 계층 및 NASA 수집 서비스 구현 (#1)` |

### 환경 요약

| 항목 | 값 |
|---|---|
| Python | venv (backend/venv) |
| Django | 6.1 |
| Node | (frontend/에서 `npm create vite@latest` 진행, 버전 미기록) |
| DB | MariaDB, `cosmic_watch` (utf8mb4), 로컬 |
| Django ↔ DB | 연결 확인됨 (`migrate` 성공, 기본 테이블 존재) |
| Frontend 린터 | ESLint |
| Vite 프록시 | `/api` → `localhost:8000` 설정 완료 |

> ⚠️ **DB는 기기별로 완전히 독립돼 있다.** Git으로 공유되는 건 마이그레이션 파일뿐이고, 실제 테이블 데이터는 기기마다 따로다. 기기를 옮기면 `migrate` + `fetch_feed`/`fetch_exoplanets` 재실행이 필요하다. (2026-09-01 학교 PC에서 실측 — 아래 기록 참고)

---

## 기록

<!-- 최신 항목을 위에 추가한다 -->

---

## 2026-09-04 (금) — M2: NEO 접근 기록 API + 문서 정리

### [완료] `NeoApproachListView` 구현 (`GET /api/neo/{nasa_id}/approaches/`)

- `generics.ListAPIView` 첫 사용 — `APIView`로 매번 직접 짜던 것과 달리, `get_queryset()`만 채우면 페이지네이션·응답 조립을 DRF가 대신 처리(`get_paginated_response()`가 `CommonPagination`을 자동 호출).
- NASA를 호출하지 않는 순수 DB 조회라 Throttle 미적용 — Throttle은 "NASA를 부르는 지점"에만 건다는 원칙 재확인.
- `body` 필터 기본값을 5.1의 `Earth`와 다르게 `(전체)`로 결정 — 5.3은 "전체 기록"이 목적이라 기본값이 다르면 213건이 조용히 사라지는 문제를 사전에 인지.
- 정렬은 사용자 선택 없이 `approach_datetime_utc` 오름차순(과거→미래) 고정 — "전체 기록을 훑는" 용도라 연대기처럼 고정 순서로 결정.

### [백엔드] 오타 3종 — 파일 로딩 시점에 즉시 터지는 것과, 요청이 와야 터지는 것

**증상**
1. `pagination_class = CommonPagination` — import 누락으로 `NameError`, 서버 기동/파일 로딩 시점에 즉시 발생
2. `Neo.objects.filter(nasa_id)` — `nasa_id=nasa_id` 키워드 누락, 요청 시점에 `Q` 객체 관련 에러
3. `urls.py`의 `<str:nasa_id/>` — 슬래시가 꺾쇠 안쪽에 들어가 라우팅 등록 자체가 실패할 뻔함

**원인**
1번은 다른 파일(`pagination.py`)에서 만든 클래스를 참조만 하고 import를 안 함. 2번은 `filter()`가 키워드 인자를 기대하는데 위치 인자로 던짐 — 문법 자체는 파이썬 관점에서 유효해서 방치될 뻔함. 3번은 "닫는 꺾쇠 앞에 슬래시" 습관이 "닫는 꺾쇠 뒤에 슬래시"여야 하는 자리에 그대로 적용됨.

**해결**
1번은 `from config.pagination import CommonPagination` 추가. 2번은 `filter(nasa_id=nasa_id)`로 키워드 명시. 3번은 `<str:nasa_id>/`로 위치 수정.

**배운 것**
- import 누락은 파일이 로드되는 즉시 터지고(서버 기동 시), 필터 키워드 누락은 그 필터가 실제로 실행되는 요청이 와야 터진다 — 같은 "결국 에러 남" 부류도 **언제 발각되는지**가 다르므로, 에러가 없다고 안심하지 않고 실제 코드 경로를 하나씩 요청해봐야 한다.

### [문서] `04_api_specification.md` v1.2 — 실제 구현 기준으로 정리

- 5.2 `recent_approaches` 응답 예시에 `approach_date`/`miss_distance_au`/`velocity_km_h` 반영 (5.3과 필드 구성 통일 결정의 실제 반영).
- 5.2 "설계 결정 ③" 신설 — `recent_approaches`가 "최근"이 아니라 **미래 접근 5건**이라는 정의를 명문화. 구현 중 이름과 동작이 어긋났던 걸 늦게 발견해서 문서에 정의를 명시적으로 남김.
- 420행 "이 엔드포인트만 NASA API를 호출한다" → 5.2도 조건부 호출함을 반영해 정정.
- 5.3에 없던 "정렬"·"응답 404" 절 신설 — 구현하면서 새로 결정된 사항이라 원래 문서엔 없었음.

### [Git] 원격 history 재작성 후 다른 기기에서 `git pull` ─ merge conflict

**증상**
집 PC(clone만 해두고 작업 이력 없음)에서 `git pull`을 실행하자 `backend/apps/astronomy/urls.py`, `views/.py` 두 파일에서 merge conflict 발생. Pylance가 파일 당 최대 16개 오류(`Expected expression`, `"[" was not closed` 등)를
쏟아냄 ─ 실제로는 문법이 깨진 것이 아니라 git이 conflict 마커 (`<<<<<<< HEAD` / `=======` / `>>>>>>>`)를 파일에 그대로 삽입해서 생긴 표면적 오류.

**원인**
직전에 노트북에서 커밋 메시지 오타(`최원` → `가장 먼`)를 고치기 위해 `git rebase -i` + `git push --force-with-lease`로 원격 history를 재작성함. 집 PC는 그 사실을 모른 채(마지막 `fetch` 시점 기준으로) 옛날 커밋 3개를 그대로 가진 상태였고 `git pull`(=fetch+merge)이 "내용은 같지만 hash가 다른 두 판본"을 강제 merge하려다 충돌.

**해결**
집 PC엔 지킬 local commit이 없었으므로(clone 후 작업 이력 없음), merge로 풀지 않고 원격을 그대로 덮어씀
```bash
git fetch origin
git reset --hard origin/M2-backend-api
```

**배운 것**
- rebase/amend.force-push로 **history를 재작성한 뒤에는, 그 branch를 가진 다른 기기에서 무심코 `git pull` 하면 안 된다** `pull`은 merge를 전제로 하는데, 재작성된 history는 merge가 아니라 연격을 그대로 반영(`reset --hard`)해야 깔끔하다.
- 안전한 순서: `git fetch` → `git log HEAD..origin/<브랜치> --oneline`으로 뭐가 왔는지를 먼저 확인 → local에 지킬 것이 있으면 `stash` → 없으면 바로 `reset --hard`.
- Pylance의 문법 오류 개수만 보고 "코드가 심각하게 망가졌다"고 판단하면 안된다. ─ 원인이 merge conflict 마커였던 것처럼, **오류의 개수보다 오류의 성격(어떤 종류의 오류인가)을 먼저 찾아내야 한다.**

### [환경] 집 PC ─ NEO 데이터 backfill

`neo`(36)/`close_approach`(36)/`neo_fetch_log`(8)는 이전에 이미 채워진 상태였으나 `orbital_data`만 0건. `fetch_neo_detail("2357621")` 1회 실행으로 궤도 정보 1건 + 접근 기록 20건(56건으로 증가) 확보 ─ 다른 두 기기와 동일 ID(`2357621`)로 검증 가능한 상태 확보.

**오늘 커밋**
- `feat(M2): NeoApproachListView 구현 (GET /api/neo/{nasa_id}/approaches/)`
- `docs(M2): DEVLOG 갱신 및 NEO 상세·접근기록 API 완료 반영`
- `docs(M2): DEVLOG에 Git history 재작성·집 PC 동기화 트러블슈팅 기록`

**다음에 할 일**
- M2 나머지 — Exoplanet API, 인증·Watchlist (다음 세션)
- (참고) 세 기기(학교 PC/노트북/집 PC) 모두 코드·문서·DB schema 동기화 완료. 집 PC는 NEO 데이터가 최소 상태이므로 필요 시 추가 fetch 필요

---

## 2026-09-03 (목) — M2: NEO 상세 API 구현 (`GET /api/neo/{nasa_id}/`)

### [완료] `ApproachRowSerializer`/`OrbitalDataSerializer`/`NeoDetailSerializer` 구현

- `ApproachRowSerializer(ApproachDetailSerializer)` — 어제(9/2) 확정한 설계대로 상속만으로 `approach_date` 1개 추가.
- `OrbitalDataSerializer` — 궤도 정보 14필드, 전부 NULL 허용(NASA가 관측 부족한 소행성의 궤도를 다 계산해두지 않음).

### [백엔드] 타이핑 오타 2건 — 둘 다 재발성 오타

**증상**
`OrbitalDataSerializer` 필드명이 모델과 안 맞아 `AttributeError`. `date_arc_days`(→`data_arc_days`), `observation_used`(→`observations_used`) 순서로 두 번 걸림.

**원인**
`date_arc_days`는 `date`/`data` 인접 오타. `observation_used`는 **M1 `models.py` 타이핑 때 이미 한 번 겪었던 오타의 재발**(DEVLOG 2026-08-29) — 같은 필드를 다른 파일에서 다시 타이핑하며 똑같이 틀림.

**해결**
철자 수정 후 shell 재시작해 재검증(수정 파일은 shell 재시작 전까진 반영 안 됨을 재확인).

**배운 것**
`observations_used`는 개인적으로 반복되는 함정 필드 — 이 필드를 다시 타이핑할 일이 있으면 한 번 더 의심할 것.

### [설계] `recent_approaches`가 "최근"이 아니라 "가장 먼 미래"를 반환하던 문제

**증상**
`order_by("-approach_datetime_utc")[:5]`로 만든 `recent_approaches`가 2091~2152년(65~126년 뒤) 접근을 반환. "최근"이라는 이름과 정반대.

**원인**
CloseApproach는 과거·미래 접근을 모두 포함하는데, 내림차순은 "가장 큰 값"(=데이터상 가장 먼 미래)을 먼저 뽑는다. "최신순"이라는 이름의 직관과 실제 동작(가장 나중)이 어긋남.

**해결**
A안 채택 — "오늘 이후 가장 가까운 예정 접근"으로 재정의. `approach_datetime_utc__gte=timezone.now()` 필터 + 오름차순 정렬로 변경. 예정 접근이 5건 미만인 소행성은 있는 만큼만 반환(과거로 억지로 안 채움, NULL 보존 원칙과 같은 결).
프로젝트명 "Cosmic **Watch**"가 결정 근거 — 이미 지나간 접근보다 "다음에 언제 오는가"가 감시 목적에 더 부합한다고 판단.

**배운 것**
`-`(내림차순) 정렬은 "최신순"을 보장하지 않는다. 데이터에 미래 값이 섞여 있으면 "가장 큰 값"과 "가장 최근"이 다른 것을 가리킬 수 있다.

### [백엔드] `ResourceNotFound` 예외 추가 — 커스텀 메시지가 조용히 덮어써지는 문제 발견

**증상**
`raise NotFound("해당 소행성을 찾을 수 없습니다.")`로 직접 문구를 넣어도, 실제 응답엔 `exception_handler.py`의 공용 문구가 나갈 뻔함(사전 발견, 실제 배포 전).

**원인**
`custom_exception_handler`가 `is_custom_error=True`인 예외만 `detail` 텍스트를 그대로 쓰고, 나머지는 전부 공용 문구로 덮어쓰도록 설계돼 있음(DRF 기본 예외의 영어 원문이 새어나가는 걸 막는 안전장치인데, 직접 지정한 한글 메시지까지 같이 막힘).

**해결**
`InvalidDate`/`AlreadyExists`와 같은 패턴으로 `ResourceNotFound(is_custom_error=True)` 신설. Watchlist 등 다른 404 상황에도 재사용 가능하도록 리소스 종류를 특정하지 않는 이름으로 설계.

**배운 것**
프로젝트 초반에 만든 안전장치(영어 메시지 차단)가, 나중에 추가하는 정상적인 커스터마이징까지 막을 수 있다 — 안전장치를 설계할 때 "이게 나중에 막게 될 정상 케이스는 없는가"를 같이 생각해야 함.

### [백엔드] `select_related`가 관계 부재를 막아주지 않는다는 오해

**증상**
`select_related("orbital_data")`를 걸어놨는데도 `neo.orbital_data is None` 비교에서 `RelatedObjectDoesNotExist` 예외 발생.

**원인**
`select_related`는 "쿼리를 한 번 더 왕복하지 않도록 미리 LEFT JOIN 해둔다"는 뜻일 뿐, "관계가 비어 있어도 조용히 `None`을 준다"는 약속이 아님. `OneToOneField` 반대편이 비어 있으면 Django는 그 사실을 예외로 알린다 — `NeoDetailSerializer.get_orbital_data`에서 이미 `getattr(obj, "orbital_data", None)`로 방어했던 것과 정확히 같은 문제를 view에서 새로 짜다 다시 만남.

**해결**
`getattr(neo, "orbital_data", None)` 패턴으로 통일.

**배운 것**
같은 함정을 서로 다른 파일(serializer / view)에서 각각 만날 수 있다 — 한쪽에서 이미 푼 문제라도, 다른 파일에서 비슷한 코드를 새로 짤 땐 같은 방어가 필요한지 다시 확인해야 함.

**shell/서버 검증 결과**
- `NeoDetailSerializer` — `nasa_id=2357621`(정상 케이스, `orbital_data` 14필드·`approach_count=21`) / `nasa_id=3761271`(미래 접근 0건, `recent_approaches: []` 에러 없이 정상)
- `NeoDetailView` — 캐시 히트(`2357621`, NASA 미호출) / 캐시 미스(`3761271`, `fetch_neo_detail` 호출 후 200) / 재요청 시 캐시 히트 전환 확인(같은 ID 두 번째 요청에서 NASA 미호출) / 존재하지 않는 ID(`9999999`) 404, 메시지 정확히 일치

**오늘 커밋**
- `feat(M2): ApproachRowSerializer 및 NeoDetailSerializer 구현`
- `fix(M2): recent_approaches가 가장 먼 미래를 반환하던 문제 수정`
- `feat(M2): NeoDetailView 구현 (GET /api/neo/{nasa_id}/)`

**다음에 할 일**
- `NeoApproachListView`(`GET /api/neo/{nasa_id}/approaches/`) — `CommonPagination` 첫 실전 투입

---

## 2026-09-02 (수) — M2: NEO 상세 수집 서비스(NASA Lookup API) 구현

### [완료] `services/nasa_neo.py` — 접근 기록 저장 로직 공통화

- Feed와 Lookup이 `close_approach_data`를 같은 모양으로 주는 걸 확인 → `_save_close_approaches()`로 저장 로직 공통화. `fetch_feed()`가 이 함수를 호출하도록 변경(동작 변화 없음, shell 재검증 완료).
- `Neo` 본체 저장 로직은 의도적으로 분리 유지 — Feed와 Lookup의 필드 구성이 다름(Lookup만 `designation` 제공). "겉모양이 비슷하다"가 아니라 "함께 변할 이유가 있는가"를 합칠 기준으로 삼음.

### [설계] Feed API로는 상세 화면(5.2/5.3)을 채울 수 없다는 것을 발견

- shell로 DB 상태 확인 중 `OrbitalData: 0`, 소행성 36개가 전부 `접근 1건`인 것을 발견.
- NASA NeoWs가 Feed(날짜별 목록, 궤도 정보 없음)와 Lookup(소행성 개별 조회, 궤도+전체 접근 기록 포함) 두 창구로 나뉘어 있고, M1의 `fetch_feed()`만으론 상세 API 데이터를 채울 수 없다는 걸 오늘 처음 확인.
- A안(상세 조회 시점에 Lookup 호출) 채택. `orbital_data` 행 존재 여부 자체가 캐시 판정 역할을 하도록 설계 — `neo_fetch_log`(날짜 단위 장부)는 건드리지 않음.

### [완료] `services/nasa_neo.py` — `fetch_neo_detail(nasa_id)` 구현

- `_to_int()`, `_parse_orbit_determination_datetime()` 헬퍼 추가. 궤도 결정 시각(`"2021-05-24 17:55:05"`)과 접근 시각(`"2026-Aug-21 03:16"`)의 날짜 포맷이 서로 달라 파서를 분리.
- `Neo.designation`을 Lookup 응답으로 채움(Feed 응답엔 없는 필드).
- 궤도 정보는 `update_or_create` — NASA가 관측이 쌓일 때마다 재계산해 여러 버전을 주므로 최신 값만 유지 (M1의 HostStar/Exoplanet과 같은 판단).

### [외부API] 오타 → 함수 뒤바뀜 연쇄

**증상**
`NASA_LOOKUP_URL`에 `nasa.gov` → `vasa.gov` 오타(n↔v 인접 키)로 `NameResolutionError` 발생. 고친 뒤 이어서 404 처리 코드를 붙여넣는 과정에서 `fetch_neo_detail()`이 아닌 `fetch_feed()` 안에 잘못 삽입됨 — `fetch_feed()`가 `NASA_LOOKUP_URL`을 호출하게 되며 두 함수가 동시에 깨짐.

**원인**
단순 오타 + 코드 조각을 엉뚱한 함수 자리에 붙여넣음. Pylance는 `nasa_id`(엉뚱한 함수 안에서 참조된 변수)만 잡아냈고, "함수가 통째로 뒤바뀐 것" 자체는 정적 분석으로 못 잡음.

**해결**
`fetch_feed()`는 `NASA_FEED_URL` 사용으로 원복, 404 분기는 `fetch_neo_detail()`로 이동. 두 함수 모두 shell 재시작 후 재검증.

**배운 것**
- 파일을 고쳐도 이미 켜진 shell엔 반영 안 됨 — `import`는 최초 1회만 파일을 읽어 메모리에 고정하므로, 코드 수정 후엔 shell을 껐다 켜야 함.
- 코드 조각을 다른 함수 자리에 잘못 붙여넣는 실수는 "이름이 존재하는가"만 보는 정적 분석기로 못 잡는다. 함수 단위로 diff를 다시 훑어보는 습관 필요.

### [외부API] Lookup 404 재현 안 됨 — 영구 부재로 단정 불가

**증상**
`fetch_neo_detail("2437844")` 최초 호출 시 `404`. 몇 분 뒤 같은 ID 재호출하니 궤도 정보까지 정상 저장.

**원인**
불명. Lookup 카탈로그가 정적 참조 데이터라면 같은 ID가 404→200으로 바뀔 이유가 없어, NASA 서버 쪽 일시적 응답 문제로 추정.

**해결**
404를 "이 ID는 영구적으로 데이터 없음"으로 단정하지 않고 "이번 요청이 404"로 처리하도록 주석·로그 톤 조정. `UpstreamError`로 죽이지 않고 궤도 정보 없이 조용히 종료.

**배운 것**
서드파티 API의 에러 코드를 그대로 믿지 않는다 — 관찰된 사실 이상으로 단정적인 주석을 달지 않는다.

### [설계] 5.2/5.3 응답 형식 통일 결정 (구현은 다음 세션)

- `03_user_scenarios_and_uiux.md`의 `ApproachTable` 컴포넌트가 상세(5건)와 "더 보기"(전체) 화면에서 공유되는 걸 확인 → 두 응답의 접근 기록 필드 구성을 통일하기로 결정.
- `ApproachRowSerializer(ApproachDetailSerializer)` — 기존 7필드에 `approach_date` 1개만 상속으로 추가하는 설계로 확정. `04_api_specification.md` 5.2 예시는 이 구현이 실제로 만들어진 뒤(다음 세션) 맞춰 수정 예정 — 아직 없는 구현에 문서를 먼저 맞추지 않음.

**shell 검증 결과 (최종)**
- `fetch_neo_detail("2357621")` — 접근 1건 → 21건, `designation` 채워짐, `orbital_data` 정상, 재실행해도 행 안 늘어남(멱등성)
- 추가 수집(`2437844`, `3645793`, `3694987`) — `CloseApproach` 총 374건, `orbiting_body` 분포: `Earth 161 / Merc 114 / Venus 94 / Moon 3 / Mars 2`
- 가짜 ID(`0000000`)로 404 분기 강제 재현 — `neo=None, count=0, orbit_saved=False` 정상 확인

**오늘 커밋**
- `refactor(M2): 접근 기록 저장 로직을 공통 함수로 분리`
- `feat(M2): NEO 상세 수집 서비스(NASA Lookup) 구현`
- `fix(M2): Lookup 카탈로그에 없는 ID(404) 처리 추가`

**다음에 할 일**
- `ApproachRowSerializer`(상속) + `NeoDetailSerializer` 작성
- `NeoDetailView`(`GET /api/neo/{nasa_id}/`) — `orbital_data`는 `select_related`, `recent_approaches`(최근 5건)는 `order_by(...)[:5]`로 DB에서 직접 자르기(N+1 방지)
- `NeoApproachListView`(`GET /api/neo/{nasa_id}/approaches/`) — `CommonPagination` 첫 실전 투입, `body` 필터 기본값은 오늘 확보한 분포(`Earth` 다수) 참고해 확정
- 구현 후 `04_api_specification.md` 5.2 예시에 `approach_date`/`miss_distance_au`/`velocity_km_h` 반영

---

## 2026-09-01 (화) — M2: NEO 대시보드 API 구현 (`GET /api/neo/`)

### [완료] `apps/astronomy/units.py` — 달 거리(LD) 환산 유틸

- `04_api_specification.md` 5.1절 설계 결정 ② 그대로 — `384400`을 이 파일 한 곳에만 두고, 프로젝트 전체가 여기서 꺼내 쓰도록 함.
- `km_to_lunar_distance()` — `_to_decimal`(M1)과 동일하게 `Decimal(str(value))` 방식으로 부동소수점 오차 방어. `ROUND_HALF_UP`으로 반올림 방식 명시(Python 기본은 은행가 반올림이라 사람이 기대하는 결과와 다름).
- shell 검증: `307520.4km → 0.80 LD`(문서 예시값과 일치), DB의 실제 `Decimal` 값으로도 왕복 정상 확인.

### [완료] `apps/astronomy/serializers.py` — NEO 응답 serializer

- `ApproachDetailSerializer`, `NeoApproachSerializer` 작성. **시작점을 `Neo`가 아닌 `CloseApproach`로 설계** — "오늘 접근하는 소행성 목록"은 실제로는 "오늘 날짜의 접근 사건들, 각각 어느 소행성 소속인지"라는 질문이기 때문 (`02_database_design.md` 8.2절 쿼리 패턴과 대응).
- `miss_distance_ld`는 모델에 없는 계산값이라 `SerializerMethodField`로 처리.
- `settings.py`에 `COERCE_DECIMAL_TO_STRING: False` 추가 — DRF `DecimalField` 기본값이 문자열 응답이라, 문서 5.1절 예시(따옴표 없는 숫자)와 형식이 어긋나는 걸 발견해 전역 설정으로 수정.
- `JSONRenderer().render()`까지 통과시켜 실제 JSON 형태로 숫자 타입 확인.

### [완료] `apps/astronomy/views.py` — 캐시 판정 로직

- `_parse_query_date()`, `_ensure_date_cached()` 작성. `02_database_design.md` 3.7절 캐싱 로직(`neo_fetch_log` 확인 후 미스일 때만 NASA 호출) 그대로 구현.
- `fetch_feed()`가 실패 시 원본 예외(`requests` 예외)를 그대로 노출하지 않고 `UpstreamError`로 통역해 던지도록 설계 — 서비스 계층과 뷰 계층의 언어를 분리.

### [환경설정] 학교 PC에서 처음 겪은 "기기별 DB 독립" 문제

**증상**
```
MySQLdb.ProgrammingError: (1146, "Table 'cosmic_watch.close_approach' doesn't exist")
```
집 PC에서 M1을 이미 마쳤는데, 학교 PC에서 검증 스크립트를 돌리자 테이블 자체가 없다는 오류 발생.

**원인**
`showmigrations` 확인 결과 `astronomy` 앱의 마이그레이션이 전부 `[ ]`(미적용) 상태였음. Git으로 공유되는 건 마이그레이션 **파일**뿐이고, 그 파일을 실제 DB에 적용하는 `migrate` 명령은 기기마다 따로 실행해야 한다는 걸 이번에 처음 실제로 겪음.

**해결**
`py manage.py migrate`로 테이블 생성 → `fetch_feed('2026-08-21')`, `py manage.py fetch_exoplanets`로 데이터 재수집(Neo 6건, Exoplanet 6,354건, HostStar 4,764건 — 집 PC 기록과 정확히 일치 확인).

**배운 것**
"두 기기를 오간다"는 프로젝트 전제가 이론으로만 있다가 오늘 실제로 부딪힘. 앞으로 기기를 바꿀 때마다 `showmigrations` → `migrate` → 데이터 재수집을 세션 시작 체크리스트에 넣어야 한다.

### [백엔드] `GET /api/neo/` — NeoDashboardView 구현 및 스로틀 함정

`NeoDashboardView(APIView)` 작성 — 캐시 판정 → (미스 시) NASA 호출 → `select_related`로 목록 조회 → 파이썬 순회로 요약(`summary`) 계산 → 응답. `apps/astronomy/urls.py` 신규, `config/urls.py`에 `api/` prefix 연결.

브라우저 검증으로 M2 완료 기준 항목 확인:
- `summary`+`cache`+`results`가 한 응답에 담김
- 같은 날짜 재조회 시 `is_cached: true` + NASA 요청 로그 미발생 (연속 6회 새로고침으로 확인)
- 새 날짜 조회 시 `is_cached: false` + NASA 호출 로그 발생
- 형식 오류 날짜(`2026/08/21`) → `400 INVALID_DATE` 정상 응답

#### [백엔드] 스로틀이 캐시 히트 요청까지 카운트하던 문제

**증상**
`neo_fetch: 2/hour`로 한도를 임시로 낮춰 검증하던 중, **캐시 히트 요청(이미 저장된 날짜 재조회)인데도** 3번째 요청에서 `429 Too Many Requests` 발생. 캐시 미스(NASA 실제 호출)만 세야 하는데 히트도 세고 있었음.

**원인**
`throttle_scope`를 뷰 클래스에 등록해두면, `settings.py`의 `DEFAULT_THROTTLE_CLASSES`(전역 등록)로 인해 DRF가 `dispatch()` 단계에서 **매 요청마다 자동으로** `check_throttles()`를 실행한다. `get()` 안에 수동으로 넣어둔 스로틀 검사 코드는 이 자동 검사보다 늦게 실행되므로, 캐시 히트 요청조차 자동 검사 단계에서 이미 카운트되고 있었다.

1차 수정(`get_throttles()`를 오버라이드해 빈 목록 반환)을 적용했는데도 여전히 스로틀이 전혀 안 걸리는 반대 증상이 발생 — 원인은 `throttle_scope`를 **`thorttle_scope`로 오타** 내서, `ScopedRateThrottle`이 `getattr`로 이 속성을 못 찾아 "제한 없음"으로 판단했기 때문. 응답 JSON의 `cache.is_cached` 필드도 `is_cashed`로 오타나 있어 문서 명세와 어긋나 있었음 — 둘 다 에러 없이 조용히 넘어가는 유형이라 실제로 브라우저에서 확인하지 않았으면 몰랐을 버그.

**해결**
- `get_throttles()`를 오버라이드해 `dispatch()` 단계의 자동 검사를 무력화(`[]` 반환)
- `get()` 내부, **캐시 미스가 확정된 시점에만** `ScopedRateThrottle()`을 직접 생성해 `allow_request()`로 수동 검사
- `thorttle_scope` → `throttle_scope`, `is_cashed` → `is_cached` 오타 정정
- 재검증: 캐시 히트 6회 연속 200(카운트 안 됨) / 캐시 미스 2회까지 200, 3번째에서 429(`2/hour` 한도와 정확히 일치) 확인 후 `30/hour`로 원상복구

**배운 것**
- DRF `APIView`는 `throttle_scope` 속성 존재 여부만으로 `dispatch()` 단계 자동 검사를 켠다 — "캐시 미스일 때만 세고 싶다" 같은 조건부 스로틀링은 `throttle_classes`를 클래스에 등록하는 방식으론 불가능하고, `get_throttles()`를 오버라이드해 자동 검사를 끈 뒤 원하는 시점에 수동으로 검사해야 한다.
- `getattr(obj, "속성명", 기본값)` 패턴은 오타가 나도 예외 없이 기본값으로 조용히 착지한다 — `is_custom_error` 플래그(M2 세션 초반)에서도 똑같은 함정을 이미 겪었는데, 오늘 `throttle_scope`에서 또 걸림. **속성 이름에 의존하는 코드는 반드시 실제 동작(로그/응답)으로 검증**해야지, 에러가 안 났다고 정상이라 믿으면 안 된다.

**오늘 커밋**
- `feat(M2): 달 거리(LD) 환산 유틸 구현`
- `feat(M2): NEO API 응답용 serializer 구현`
- `feat(M2): NEO 대시보드 캐시 판정 로직 구현`
- `feat(M2): NEO 대시보드 뷰 및 URL 라우팅 구현`
- `fix(M2): 스로틀이 캐시 히트 요청까지 카운트하던 문제 수정`

**다음에 할 일**
- `GET /api/neo/{nasa_id}/`(상세) 구현 — `is_watchlisted` 필드는 인증 붙기 전이라 일단 `false` 고정으로 두고, 접근 기록 5건 제한 로직부터.
- 그다음 `GET /api/neo/{nasa_id}/approaches/`(전체 접근 기록, 페이지네이션 적용 첫 사례가 됨 — `CommonPagination` 실전 검증 기회).

---

## 2026-08-31 (월) — M2: 공통 섹션(exception_handler/pagination/throttle) 구현

### [완료] `config/exception_handler.py` — 공통 오류 응답 형식 구현

- `04_api_specification.md` 1.4절 봉투 형식대로 재포장. 커스텀 예외 4종(`InvalidDate`, `InvalidCredentials`, `AlreadyExists`, `UpstreamError`) 정의.
- shell에서 6개 케이스(404 / 400 검증실패 / 400 커스텀 / 401 / 429 / 알 수 없는 예외) 응답 형식 검증 완료.

### [완료] 리팩터링 — 예외 판정 방식을 `isupper()`에서 명시적 플래그로 변경

- 초기 구현은 `default_code.isupper()`로 "우리가 만든 예외인지"를 판정했으나, `AlreadyExists`의 `default_code` 오타(`ALREADY_EXIST`, S 누락)를 발견하면서 이 방식의 위험성이 드러남 — 오타가 대문자로 났다면 조용히 잘못된 `code`가 그대로 나갔을 것.
- 각 커스텀 예외에 `is_custom_error = True` 명시적 플래그 추가, 판정 로직을 `getattr(exc, "is_custom_error", False)`로 변경. 플래그를 깜빡해도 `getattr` 기본값(`False`)으로 안전하게 착지하도록 설계.

### [완료] `config/pagination.py` — 커스텀 페이지네이션 구현

- `04_api_specification.md` 1.5절 형식(`page`, `page_size`, `total_pages`)으로 응답 재구성. `max_page_size=100` 상한 설정.
- 아직 실제 목록 API가 없어 shell에서 클래스 로드만 검증 — 진짜 페이지 분할 동작은 `GET /api/exoplanets/` 구현 시 함께 확인 예정.
- 커밋 후 docstring 오탈자(`total_page`→`total_pages`) 별도 발견해 정정 커밋 추가.

### [완료] DRF 스로틀 설정 등록 (`neo_fetch: 30/hour`)

- `settings.py`에 `DEFAULT_THROTTLE_CLASSES`(`ScopedRateThrottle`), `DEFAULT_THROTTLE_RATES` 등록.
- 실제 적용(`throttle_scope = 'neo_fetch'`)은 `GET /api/neo/` 뷰 구현 시 진행 예정.

### [환경설정] 커밋 스테이징 실수 → force push로 복구

**증상**
`git add pagination.py` 상태에서 커밋 메시지는 스로틀(`settings.py`) 내용으로 작성해 push. 내용물과 메시지가 어긋난 커밋이 원격에 올라감.

**원인**
`git add`는 기존 staging 내용에 "추가"하는 명령이라, `git reset --soft HEAD~1`로 커밋을 되돌린 뒤에도 이전에 add해둔 파일이 staging에 남아있었음. 여기에 다른 파일을 추가로 add하면서 두 파일이 섞여 커밋됨.

**해결**
`git reset --soft HEAD~1`로 커밋만 취소(파일 변경 내용은 유지) → `git restore --staged`로 불필요한 파일 스테이징 해제 → 파일별로 나눠 재커밋 → `git push --force-with-lease`로 원격 히스토리 교체.

**배운 것**
- `git add`는 "새로 스테이징"이 아니라 "기존에 더하기"다. `reset --soft` 직후엔 `git status`로 staging 상태를 먼저 확인해야 한다.
- push 후에도 **혼자 쓰는 feature 브랜치**라면 `--force-with-lease`로 안전하게 히스토리를 고쳐 쓸 수 있다. (`main`이나 공유 브랜치였다면 안 됨.)

**오늘 커밋**
- `feat(M2): 공통 오류 응답 형식(exception_handler) 구현`
- `refactor(M2): 예외 판정 방식을 isupper()에서 명시적 플래그로 변경`
- `feat(M2): 커스텀 페이지네이션(CommonPagination) 구현`
- `feat(M2): DRF 스로틀 설정 등록 (neo_fetch: 30/hour)`
- `fix(M2): pagination.py docstring 오탈자 정정`

**다음에 할 일**
- NEO API 구현 착수 — `GET /api/neo/` (캐시 판정 → NASA 호출 → 요약 계산 → 응답), 달 거리(LD) 환산 로직, `GET /api/neo/{nasa_id}/`, `GET /api/neo/{nasa_id}/approaches/` 순서로.

---

## 2026-08-31 (월/새벽) — M1 완료: Exoplanet Archive 수집 + Admin 등록

### [완료] `services/exoplanet_archive.py` — `fetch_exoplanets()` 구현 및 검증

- TAP(Table Access Protocol) 방식으로 NASA Exoplanet Archive 수집. `nasa_neo.py`의 `requests.get → raise_for_status → .json()` 흐름 그대로 재사용.
- `ps` 테이블에서 `default_flag = 1` 조건 필수 확인 — 같은 행성이 여러 논문 값으로 중복 등록되는 걸 방지 (한 행성 = 여러 행, 대표 판본만 골라야 함).
- `HostStar` → `Exoplanet` 순서로 `update_or_create` 저장 (FK 순서 제약 때문). 둘 다 관측값이라 `get_or_create`가 아닌 `update_or_create` 사용 — CloseApproach(불변 이력)와의 구분 원칙 그대로 적용.
- `_to_decimal` 헬퍼를 그대로 재사용 (내부에서 이미 `Decimal(str(value))` 방식으로 float 정밀도 문제를 방어하고 있었음 — 재작업 불필요).

**shell 검증 결과**
- NASA 수신 6,354개 행 = `Exoplanet.objects.count()` 6,354건 — 누락 없이 전부 저장 확인.
- `radius_earth IS NULL` 1,612건 — NASA 원본 NULL을 임의값으로 바꾸지 않았음을 증명.
- `manage.py fetch_exoplanets` 재실행 시 동일 결과(멱등성 확인) — `UNIQUE(name)`/`UNIQUE(planet_name)` + `update_or_create` 조합 정상 동작.

### [완료] Django Admin 등록

- `Neo`, `HostStar`, `Exoplanet` 세 모델 등록. `is_hazardous`, `discovery_method` 필터 추가.
- Admin에서 Neo 6건, Exoplanet 6,354건(페이지네이션 정상) 조회 확인.

### [문서] 오류 정정

- `05_milestones.md` 147번째 줄에 "테이블 9개" 오기가 v1.1 정정에서 누락돼 있었음 — 이번에 8개로 정정.
- `02_database_design.md` 7장 코드블록을 `apps/astronomy`/`apps/watchlist` 두 개로 분리 (2026-08-25 기록에 예정돼 있던 작업).
- `04_api_specification.md` 10.1절의 "테이블 9개" 표기도 8개로 동일하게 정정.

**M1 완료 기준 7개 전부 충족.**

**오늘 커밋**
- `feat(M1): NASA Exoplanet Archive TAP 수집 서비스 및 커맨드 구현`
- `feat(M1): Django Admin에 Neo/HostStar/Exoplanet 등록`
- `docs(M1): 마일스톤 완료 처리 및 DEVLOG 갱신` (이 커밋 자체)

**다음에 할 일**
- M2 착수. `04_api_specification.md`의 엔드포인트 17개 구현 시작 — `05_milestones.md` 5장 작업 목록 순서(공통 → NEO API → Exoplanet API → 인증·Watchlist)대로 진행.

---

## 2026-08-30 (일) — M1: NASA NeoWs Feed 수집 서비스 구현

### [완료] `services/nasa_neo.py` — `fetch_feed(date)` 구현 및 검증

- `config/settings.py`에 `NASA_API_KEY` 설정 추가. 
- `_to_decimal`(문자열→Decimal 안전 변환), `_parse_datetime_utc`(NASA 날짜 포맷 파싱 + `timezone.make_aware`로 UTC 명시) 헬퍼 함수 작성. 
- `Neo`는 `update_or_create`(최신값 갱신), `CloseApproach`는 `get_or_create`(중복 방지)로 구분 사용.

**디버깅 과정에서 겪은 실수(전부 해결)**
- 상수명 불일치(`NASA_FEED_URL`/`NEO_FEED_URL`)
- `response.raise_for_status()` 메서드 호출 문법 오류, `strptime` 포맷 문자열 그룹명 충돌(`%b` 중복)
- naive datetime 경고(→ `timezone.make_aware` 적용 과정에서 `return` 위치 오류로 도달 불가 코드 발생 → 재수정)
- `timezone.utc`/`timezone.UTC` 대소문자 오류.

**shell 검증 결과** 
- `fetch_feed('2026-08-21')` 실행 시 NASA `element_count`(6)와 실제 저장 건수(6) 일치. 동일 날짜 재실행 시 신규 저장 0건 확인 — `UniqueConstraint(uk_ca_unique)` 정상 동작.

**오늘 커밋**
- `feat(M1): NASA NeoWs Feed API 수집 서비스 구현`

**다음에 할 일** 
- `services/exoplanet_archive.py` 작성 — TAP_URL, TAP_QUERY 상수까지 안내받았고 아직 타이핑 전. 
- `fetch_exoplanets()` 함수 본체(HostStar 먼저 저장 → Exoplanet 저장 순서) 작성 필요.

---

## 2026-08-29 (토) — M1: 모델 8개 완성 및 마이그레이션 적용

### [완료] `apps/astronomy/models.py` 나머지 5개 모델 작성

- `Neo`에 이어 `CloseApproach`, `OrbitalData`, `HostStar`, `Exoplanet`, `NeoFetchLog` 작성 완료. 
- `CloseApproach`는 `UniqueConstraint(neo, approach_datetime_utc, orbiting_body)`로 중복 접근 기록을 DB 레벨에서 방지
- `OrbitalData`는 `OneToOneField`로 소행성당 최신 궤도 1건만 유지하도록 설계.

**발견 및 수정한 오타**
- `observation_used`→`observations_used`
- `equilibrium_temp_k` 정밀도 오류(DECIMAL 10,8→10,2)
- `distance_pc` 주석의 단위 오기(AU→ly).

### [완료] `apps/watchlist/models.py` 작성

- `NeoWatchlist`, `ExoplanetWatchlist` 작성. 
- `settings.AUTH_USER_MODEL`로 Django 기본 User 참조, 다른 앱 모델은 `'astronomy.Neo'`처럼 `app_label.모델명` 문자열로 참조.

**발견 및 수정한 오타**
- `Meta.constraint`→`constraints` (양쪽 모델 모두 동일 오타 — `sqlmigrate`로도 조용히 누락되는 유형이라 주의 필요했음).

### [완료] `makemigrations` → `sqlmigrate` 대조 → `migrate` 적용

- `astronomy` 0001·0002, `watchlist` 0001 마이그레이션 생성. 
- `sqlmigrate` 결과를 `02_database_design.md` DDL과 전부 대조 확인 후 `migrate` 실행. HeidiSQL에서 테이블 8개 확인.

> **문서 오류 발견**
>`05_milestones.md`, `02_database_design.md`가 공통으로 "테이블 9개"라고 적어뒀으나 실제 모델은 8개. `auth_user`를 잘못 포함해서 센 것으로 추정. 마일스톤 완료 시 두 문서 모두 8로 수정 예정.

**오늘 커밋**
- `feat(M1) astronomy 앱 모델 6개 정의 완료`
- `fix(M1): astronomy 앱 오타 수정`
- `feat(M1): astronomy·watchlist 마이그레이션 생성 및 적용`

**다음에 할 일**
- `services/nasa_neo.py` — `fetch_feed(date)` 구현.

---

## 2026-08-25 (화) — M1 착수

### [설계] apps 구조 결정: astronomy / watchlist 분리

- `05_milestones.md`와 `02_database_design.md` 7장 사이에 앱 구조가 어긋나 있었음(전자는 앱 2개, 후자는 코드블록 1개). 
- `05_milestones.md` 기준으로 `apps/astronomy`(NASA 원본 데이터)와 `apps/watchlist`(사용자 생성 데이터)를 분리하기로 확정. 
 - 성격이 다른 데이터이고, M2 인증 붙일 때 "로그인 필요 여부" 경계가 앱 단위로 갈리는 게 깔끔함.

> `02_database_design.md` 7장은 M1 완료 시 코드블록을 앱 2개로 나눠 갱신 예정 (Tier 2 문서, 구현과 어긋날 때 갱신 대상).

- `apps/astronomy`, `apps/watchlist` 앱 생성 완료
- `INSTALLED_APPS` 등록, `manage.py check` 통과 확인. 
- `Neo` 모델 작성 완료.

**오늘 커밋**
- `feat(M1): Neo 모델 정의`

**다음에 할 일**
- `CloseApproach` → `OrbitalData` → `HostStar` → `Exoplanet` → `NeoFetchLog` 순으로 이어서 작성, 그 다음 `apps/watchlist/models.py` (`NeoWatchlist`, `ExoplanetWatchlist`).

---

## 2026-08-24 (월) — M0 완료

### [환경설정] Django + MariaDB + React 초기 환경 구성

M0 체크리스트 10개 항목 전부 완료. 예상 3~5일 잡았는데 실제로는 **하루 만에 끝남** — 다음 마일스톤 추정치 보정 시 참고.

**진행 순서**: 저장소 초기화(`git init`) → 설계 문서 6종 커밋 → `backend/` 가상환경 + Django 프로젝트 생성 → MariaDB 연결 → `frontend/` Vite+React 생성 + 프록시 설정.

#### [환경설정] SECRET_KEY 생성 명령어 오타

**증상**
```
python "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
can't open file '...': [Errno 2] No such file or directory
```

**원인**
`-c` 옵션을 빠뜨려서, 파이썬 코드 문자열을 실행할 스크립트가 아니라 **파일 이름**으로 인식함.

**해결**
```powershell
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**배운 것**
`python -c "..."` 는 "이 문자열을 코드로 실행해라", `python "..."` 는 "이 이름의 파일을 실행해라"로 완전히 다른 명령이다.

---

#### [DB] `migrate` 실행 시 `HOST: 'NoneType' object has no attribute 'startswith'`

**증상**
`python manage.py migrate` 실행 시 `.env`에 `DB_HOST`를 분명히 적었는데도 `HOST` 값이 `None`으로 들어가 연결 실패.

**원인**
`settings.py`에 `from dotenv import load_dotenv` 로 **모듈만 가져오고, 실제로 호출(`load_dotenv()`)하는 코드가 없었음.** import는 도구를 손에 쥐는 것이고, 함수 호출은 그 도구를 실제로 쓰는 것 — 이 둘을 혼동함. `.env` 파일 자체가 한 번도 읽힌 적이 없어서 `os.getenv()`가 전부 `None`을 반환했다.

**해결**
`BASE_DIR` 정의 직후에 호출 코드 추가:
```python
load_dotenv()
```

**배운 것**
`import`와 "그 모듈의 함수를 실행하는 것"은 별개의 단계다. 라이브러리를 가져오기만 하고 초기화 함수를 안 부르는 실수는 앞으로도 나올 수 있으니, 새 라이브러리 쓸 때는 "가져오기"와 "실행하기" 두 단계를 항상 구분해서 확인할 것.

---

#### [환경설정] Git 커밋 순서를 바꾸고 싶을 때

**증상**
`frontend` 관련 커밋을 먼저 만들었는데, `backend` 커밋이 히스토리 상 먼저 오도록 순서를 바꾸고 싶었음. 이미 push하지 않은 상태에서 "되돌릴 수 없는지" 걱정.

**원인**
Git 커밋 자체를 "취소 불가능한 확정"으로 오해함.

**해결**
GitHub Desktop의 **Undo** 기능으로 아직 push 안 한 커밋을 취소(커밋 이전 상태로 파일을 되돌림) → `backend` 파일만 선택해서 먼저 커밋 → `frontend` 파일 커밋 → 한 번에 push.

**배운 것**
- **push하기 전** 로컬 커밋은 자유롭게 순서를 바꾸거나 취소할 수 있다. push는 "로컬 확정 → 원격 전송"의 경계선이고, 그 전까지는 되돌리기 비용이 거의 없다.
- GitHub Desktop은 파일 단위로 골라서 커밋할 수 있다(체크박스). 터미널의 `git add <path>`와 동일한 기능.

---

### [설계] 설계 문서 4종 완료

01 요구사항 → 02 DB 설계 → 03 UI/UX → 04 API 명세 순으로 작성 완료.

**원래 순서에서 바꾼 것**: GPT가 제안한 순서는 `요구사항 → UI/UX → DB → API`였는데, DB 설계를 UI보다 먼저 했다. 이미 테이블 구조를 상당 부분 확정해둔 상태였고, DB를 먼저 굳혀두면 화면 설계에서 "이 값 필요한데 DB에 없네" 하고 되돌아오는 일을 막을 수 있다고 판단했다.

**설계 중 발견한 문제 3가지**

1. **캐싱 로직에 구멍이 있었다.** "DB에 데이터 없으면 NASA 호출"인데, "아직 수집 안 함"과 "수집했지만 그날 소행성이 0건"을 구분할 수 없었다. → `neo_fetch_log` 테이블을 추가해 수집 이력을 따로 남기기로 함.

2. **검색 조건 컬럼에 인덱스가 하나도 없었다.** 외계행성 9개 조건 검색이 핵심 기능인데 `radius_earth`, `mass_earth`, `discovery_year`, `distance_pc`에 인덱스가 없으면 매번 전체 스캔. → 인덱스 추가.

3. **단위 불일치.** 요구사항의 검색 조건은 "거리 ≤ 100 광년"인데 NASA가 주는 값은 파섹. `1 pc = 3.26156 ly`. → 저장은 파섹, 표시는 광년, 변환은 백엔드가 담당하는 것으로 명시.

**인증 방식 결정**: 세션 쿠키. JWT는 서버가 발급한 토큰을 무효화할 수 없어 로그아웃이 제대로 동작하지 않고, `localStorage`에 두면 XSS에 취약하다. 서버 1대 규모라 무상태의 이점도 없다.

**배운 것**: 화면을 먼저 그려보니 요구사항 문서에 없던 API가 발견됐다(`/api/exoplanets/meta/` — 발견 방법 드롭다운을 채울 데이터). 설계 문서는 순서대로 쓸 때마다 앞 문서의 빈틈이 드러난다.

---

<!--
다음 항목은 이런 식으로 쓰면 된다.


## 2026-08-2X (X)

### [환경설정] Django ↔ MariaDB 연결 실패

**증상**
```
django.db.utils.OperationalError: (2059, "Authentication plugin ... cannot be loaded")
```

**원인**
(여기에)

**해결**
(여기에)

**배운 것**
(여기에)

---

### [외부API] NASA 응답의 숫자가 문자열로 온다

**증상**
`velocity_km_s` 값을 DecimalField에 넣으려니 타입 오류.

**원인**
NASA NeoWs는 숫자를 `"18.83"` 형태의 문자열로 반환한다.

**해결**
(여기에)

**배운 것**
외부 API 응답은 타입을 믿지 말고 실제 JSON을 눈으로 확인할 것.
-->
