# ARCHITECTURE — Cosmic Watch & Explorer

> **코드가 어떻게 나뉘고 요청이 어떻게 흐르는지, 인증, API 계약, 개발 · 배포 환경을 적는 문서다.**
> 폴더별 코드 지도는 [CLAUDE.md](../CLAUDE.md) 3.2절, 저장 구조는 [DATA_MODEL](DATA_MODEL.md), 왜 이 스택인지는 [decisions/](decisions/README.md).

**엔드포인트 원본은 코드다**: `backend/config/urls.py`와 각 앱 `urls.py`(경로), `serializers.py`(응답 필드), `frontend/src/types/api.ts`(응답 타입), `apps/*/tests.py`(동작). M6에서 `drf-spectacular`를 붙이면 `/api/docs`가 원본이 된다. 그때까지 요청 · 응답 예시는 [archive/API_SPEC_old](archive/API_SPEC_old.md)에서 볼 수 있다(어긋나면 코드가 맞다).

## 1. 구조와 요청 흐름

```text
브라우저 ─ React (Vite, TypeScript)
   │  /api/...  (세션 쿠키 + CSRF 헤더)
   ▼
Django REST Framework ─ views → serializers
   │                       │
   │                       └─ services/  ← 외부 API 통신은 여기에만
   ▼                              ├ nasa_neo.py          (NeoWs Feed · Lookup)
MariaDB                           ├ exoplanet_archive.py (Exoplanet Archive)
                                  └ jpl_cad.py           (JPL 근접 접근 예보)
```

```text
❌ React → NASA API
⭕ React → Django API → DB
                ↓
          (필요 시) NASA API
```

- **`services/`를 따로 두는 이유**: `views.py`에서 `requests.get(...)`을 직접 부르면 테스트마다 실제 NASA를 부르고, NASA가 응답 형식을 바꾸면 뷰를 고쳐야 하고, 같은 호출 코드가 여러 뷰에 복사된다. 식당의 홀과 주방을 나누는 것과 같다. 홀 직원(뷰)은 주문을 받고 음식을 내주기만 하고, 재료를 어디서 사 오는지(외부 API)는 주방(서비스)이 처리한다.
- **도메인 계산은 서버에서**: LD · 광년 환산은 `apps/astronomy/units.py` 한 곳에만 둔다. 프론트에서 `km / 384400` 하지 않는다. 기준값이 프론트 곳곳에 흩어지면 나중에 빠뜨리는 곳이 생긴다.
- **테스트**: 백엔드 `manage.py test`, 프론트 `npm run test:e2e`(E2E 전용 DB). 명령과 범위는 CLAUDE.md 2.3절.

---

## 2. 인증 — 세션 쿠키와 CSRF

세션 쿠키(`httpOnly`)를 쓴다 ([decisions/0003](decisions/0003-session-cookie-auth.md)). 모든 API와 화면은 기본 잠금이고, 공개는 `csrf` · `me` · `signup` · `login` 4개뿐이다 ([decisions/0004](decisions/0004-lock-all-screens.md)). 쿠키는 만료일 없는 세션 쿠키라 브라우저를 닫으면 로그아웃된다(`SESSION_EXPIRE_AT_BROWSER_CLOSE`). 단, 크롬 · 엣지의 "시작 시 이전 세션 계속하기"는 이 쿠키까지 되살린다.

### 2.1 CSRF가 필요한 이유

세션 쿠키는 브라우저가 **자동으로** 붙여 준다. 악성 사이트가 우리 주소로 요청을 심어 두면, 로그인 사용자의 브라우저가 쿠키를 실어서 보내 버린다. 막는 방법은 쿠키와 별개로, 우리 사이트의 JavaScript만 읽을 수 있는 토큰을 헤더에 함께 보내게 하는 것이다.

> 은행 창구에 비유하면, 통장(쿠키)만으로는 출금이 안 되고 **그 자리에서 직접 쓴 서명(CSRF 토큰)** 이 있어야 하는 것과 같다.

### 2.2 프론트에서의 처리

`frontend/src/api/client.ts`의 axios 인스턴스가 `withCredentials`와 `csrftoken` 쿠키 → `X-CSRFToken` 헤더를 자동으로 처리한다. **`csrftoken` 쿠키가 먼저 있어야 하므로** 앱이 처음 뜰 때 `AuthProvider`가 `GET /api/auth/csrf/`를 한 번 부른다.

DRF는 비로그인 요청에는 CSRF를 검사하지 않는다. 그래서 문제가 생기면 "로그인 · 가입만 되고 그 뒤가 막히는" 모양으로 나타난다. `login()`마다 토큰이 회전하는 것도 주의.

### 2.3 개발 환경 CORS

React(`5173`)와 Django(`8000`)는 포트가 달라 다른 출처다. Vite 프록시로 같은 출처처럼 만들어 CORS 자체가 생기지 않게 한다. `django-cors-headers`는 필요 없다.

`vite.config.ts`의 `changeOrigin: false`를 지켜야 한다. Host를 8000으로 바꾸면 Origin(5173)과 달라져 로그인 후 POST가 CSRF 403이 된다.

---

## 3. API 계약 (공통 규칙)

### 3.1 기본 정보

| 항목 | 값 |
|---|---|
| Base URL (개발) | `http://localhost:8000/api` |
| 요청 · 응답 형식 | `application/json` (프로필 사진만 multipart · `image/webp`) |
| 시각 표기 | ISO 8601, UTC (`2026-08-21T03:16:00Z`). 화면에서 KST로 바꾼다 |
| 인증 | 세션 쿠키 |

### 3.2 필드 이름은 snake_case로 통일한다

전 구간 `snake_case`. 변환 계층을 두면 백엔드와 프론트에서 같은 필드를 다른 이름으로 부르게 되어, 개발자도구에 찍힌 이름과 Django 코드의 이름이 달라진다.

### 3.3 HTTP 상태 코드

| 코드 | 사용 상황 |
|---|---|
| `200 OK` | 조회 성공, Watchlist 삭제 성공 |
| `201 Created` | 회원가입, Watchlist 등록 성공 |
| `204 No Content` | 로그아웃, 비밀번호 변경, 계정 삭제 |
| `400 Bad Request` | 파라미터 형식 오류, 유효성 검사 실패, 로그인 실패 |
| `401 Unauthorized` | 로그인이 필요한 요청인데 비로그인 |
| `403 Forbidden` | CSRF 토큰 누락 / 불일치 |
| `404 Not Found` | 존재하지 않는 리소스 |
| `409 Conflict` | 이미 등록된 Watchlist 항목 |
| `429 Too Many Requests` | 요청 한도 초과 |
| `503 Service Unavailable` | NASA · JPL 응답 실패이고 보여 줄 데이터도 없음 |

### 3.4 오류 응답 형식

DRF 기본 오류는 상황에 따라 모양이 달라서, **전 구간 같은 봉투**를 쓴다. `config/exception_handler.py`가 모든 예외를 이 형식으로 내보내고 각 뷰에서 따로 처리하지 않는다.

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "입력값을 확인해 주세요.", "fields": { "password": ["…"] } } }
```

- `code`: 프론트가 분기할 때 쓰는 식별자(문구가 바뀌어도 유지). `VALIDATION_ERROR` · `INVALID_DATE` · `INVALID_CREDENTIALS` · `AUTH_REQUIRED` · `CSRF_FAILED` · `NOT_FOUND` · `ALREADY_EXISTS` · `RATE_LIMITED` · `UPSTREAM_ERROR`
- `message`: 사용자에게 그대로 보여 줄 수 있는 문구. 모든 400은 공용 문구를 쓰고, 무엇이 틀렸는지는 `fields`로 전달한다.
- `fields`: 필드별 오류. 폼이 아니면 생략.

### 3.5 페이징 형식

`{ count, page, page_size, total_pages, results }` (`config/pagination.py`). DRF 기본은 `next` · `previous`를 전체 URL로 줘서 프론트가 파싱해야 해서 바꿨다. 기본 20건, 최대 100건.

---

## 4. API별 결정 (왜 이렇게 했나)

### 4.1 인증 · 계정

- **`/me/`는 비로그인이어도 200**: "로그인 안 했음"은 오류가 아니라 정상 조회 결과다. 응답에 설정(`preferences`)까지 담아 대시보드가 깜빡이지 않는다.
- **가입과 동시에 로그인**: 다시 로그인하게 만들지 않는다.
- **로그인 실패는 구분 없이 400 `INVALID_CREDENTIALS`**: 아이디와 비밀번호 중 어느 쪽이 틀렸는지 알려 주면 "이 아이디는 존재한다"는 사실이 드러난다(계정 열거 공격).
- **횟수 제한**: 로그인 · 가입 · 비밀번호를 다시 받는 곳에 건다(값은 `settings.py`). 성공 · 실패 구분 없이 센다. 실패만 세면 응답 차이로 적중 여부가 드러날 수 있다. 프록시 뒤에 서면 `NUM_PROXIES`가 필요하다(M6).
- **이메일 변경 · 탈퇴도 비밀번호를 다시 받는다**: 세션(쿠키)만 훔친 사람이 계정을 통째로 가져가지 못하게.
- **비밀번호 변경 후 이 기기는 유지, 다른 기기는 로그아웃**: 비밀번호를 바꾸는 이유가 보통 "남이 알았을까 봐"라서. `update_session_auth_hash`로 지금 세션만 다시 묶는다.
- **아이디는 못 바꾼다**: 로그인 아이디라 바뀌면 헷갈린다.
- **설정은 서버(DB)에**: 사용자가 여러 기기에서 쓴다. 조회만으로는 행을 만들지 않는다.
- **탈퇴 후 화면은 페이지를 새로 연다**(`window.location.replace`): 라우터의 주소 이동이 낮은 우선순위라, 문지기가 먼저 `/login?next=/account`로 보냈다(실측).
- **프로필 사진**: 확장자 · Content-Type을 믿지 않고 Pillow로 열어 본다(JPG · PNG · WebP · GIF, 2MB, 4천만 픽셀 이하 ─ 압축 폭탄). EXIF 방향대로 돌려 가운데 256px WebP로 **새로 만들어** 위치(GPS) · 기기 정보가 남지 않는다. 주소에 사용자 id가 없어 항상 내 사진만 다룬다.

### 4.2 NEO

- **요약과 목록을 한 응답에**: 요약은 목록과 같은 데이터에서 계산된다. 나누면 같은 쿼리를 두 번 돌리고, 사이에 데이터가 갱신되면 어긋난다.
- **`cache`를 함께 내려 준다**: `is_cached: false`면 이번 요청에서 NASA를 직접 불렀다는 뜻이다. 캐싱이 동작하는지 눈으로 확인할 수 있다.
- **미래 날짜 유효기간 24시간**: NASA의 미래 예측은 관측이 쌓이면 바뀐다. 오늘 이후 날짜는 받은 지 24시간이 지나면 다시 받고(시각이 바뀐 옛 예측 행은 지운다), 지난 날짜는 다시 받지 않는다.
- **조회 날짜는 `1900-01-01` ~ `2200-12-31`**: NASA는 범위 밖도 200 + 0건을 주지만, 헛호출과 "0건" 장부 기록을 막으려고 서버가 먼저 `INVALID_DATE`로 거절한다.
- **NASA가 실패해도 DB에 데이터가 있으면 200**: 대시보드는 예전 데이터로, 상세는 `orbit_status`로 알린다. 없을 때만 503. 서비스가 통신 실패만 `NasaUnavailable`로 바꾸고 뷰는 그것만 잡는다(우리 버그가 "NASA 장애"로 둔갑하지 않게).

| `orbit_status` | 뜻 | 화면 |
|---|---|---|
| `ok` | 궤도 정보 있음 | 궤도 모식도 · 요소 |
| `missing` | NASA에도 없다 | "NASA가 아직 계산하지 않았어요" |
| `unavailable` | NASA에 연결하지 못했다 | 궤도 칸에만 안내 + 다시 시도 |
| `rate_limited` | 우리 쪽 호출 한도에 걸려 이번엔 부르지 않았다 | 궤도 칸에만 안내 + 다시 시도 |

- **요청 한도**: 대시보드와 상세가 조건부로 NASA를 부른다. Scope를 나눠(`neo_fetch`, `neo_detail_fetch`) 독립적으로 세고, 캐시 미스일 때만 직접 검사한다(`get_throttles()`가 `[]`). NASA 키는 시간당 제한이 있어서(10-28 확인 2,000회) 버그로 무한 호출할 때 키가 정지되는 걸 막는 안전장치다.
- **재시도 · 로그**: 일시 장애(5xx · 연결 실패 · 시간 초과)면 **한 번만** 다시 시도한다. 실패 로그에 요청 URL을 남기지 않는다 ─ URL에 `api_key`가 들어 있다.
- **`is_watchlisted`는 상세 응답에만**: 없으면 저장 버튼을 그릴 수 없고, 별도 API면 버튼이 깜빡인다. 목록에는 저장 버튼이 없어 넣지 않는다.
- **`recent_approaches`는 "다음 접근 5건"이다**: 이름과 달리 미래 기준이다. 이 서비스가 "감시(Watch)" 목적이라 "다음에 언제 오는가"가 더 유용하다. 5건 미만이면 있는 만큼만 주고 과거로 채우지 않는다. 전체는 `approaches/`(과거 → 미래 고정).
- **접근 기록은 5건 + 개수**: 수백 건인 소행성이 있어 상세에 전부 담지 않는다.
- **`next-approach`**: JPL CAD에서 받는다([decisions/0008](decisions/0008-jpl-cad-countdown.md)). "지금 이후 0.05 AU 안쪽 중 가장 먼저 오는 접근". 서버 캐시 6시간, 사용자 요청 수와 JPL 호출 수가 무관해서 스로틀이 없다. 시각은 TDB에서 69.184초를 빼 UTC로. JPL 번호와 NeoWs 번호가 달라 상세 ID는 우리 DB에서 이름으로 찾고 없으면 `null`. URL은 `neo/<nasa_id>/`보다 **먼저** 등록한다.
- **NEO는 `nasa_id`, 외계행성은 내부 `id`로 부른다**: NASA ID는 순수 숫자라 URL에 그대로 쓰고 NASA/JPL과 대조하기 쉽다. 외계행성 이름은 공백 · 특수문자가 있고 개정되면 링크가 깨진다.

### 4.3 외계행성

- **거리는 광년으로 받고 파섹 · 광년을 모두 내려 준다**: 저장은 파섹([DATA_MODEL](DATA_MODEL.md) 3.4절), 사용자에게 파섹을 요구하지 않는다.
- **`applied_filters`를 돌려준다**: 필터 칩을 서버가 실제로 쓴 조건으로 그린다. 페이지네이션 클래스가 아니라 뷰의 `list()`에서 얹는다(페이지 부품은 검색 조건을 알 필요가 없다).
- **파라미터 오류 두 종류**: 모르는 파라미터는 조용히 무시, 아는 파라미터의 값이 틀리면 400 + `fields`. `sort`는 검색 조건이 아니라 표시 순서라 틀려도 400 없이 기본 정렬로.
- **`select_related('host_star')`는 필수**: 없으면 20건 목록에 쿼리가 20번 더 나간다(N+1). `QuerySet`은 평가되기 전까지 SQL을 실행하지 않아, 조건을 다 조합한 뒤 한 번만 요청한다.
- **정렬 시 NULL은 항상 뒤로**(`nulls_last`): MariaDB 기본은 오름차순일 때 NULL이 맨 앞이라 값 없는 행성이 위를 채운다. 값을 채우지 않고 순서만 바꾼다.
- **`sibling_planets`**: 추가 비용이 거의 없고 탐색이 이어진다. `null`은 그대로 내려보내 프론트에서 `—`로 표시한다.
- **`meta` API**: 발견 방법을 프론트에 하드코딩하면 NASA가 새 방법을 추가했을 때 빠진다. 서버가 1시간 캐싱한다. `cache_page` 대신 직접 `cache.get` · `cache.set`을 쓴다 ─ HTML 뷰 전제라 DRF `Response`와 어긋나고, 캐시 히트 · 미스가 뷰 코드에 드러나는 게 낫다.

### 4.4 Watchlist

- **토글이 아니라 POST / DELETE**: 토글은 같은 요청을 두 번 보내면 결과가 달라져, 네트워크가 불안정할 때 저장했는데 해제되어 있을 수 있다. "켜기 버튼"과 "끄기 버튼"이 따로 있으면 몇 번 눌러도 결과가 같다.
- **중복은 `IntegrityError`를 잡아 409**: DB 제약이 최종 방어선이다. "있는지 확인 후 저장"은 동시 요청에 뚫린다.
- **없는 대상을 저장하면 404**: 프로젝트 전반의 "리소스 없음 = 404" 관례를 따른다.
- **저장 안 된 항목을 삭제해도 200**: "결과적으로 저장되어 있지 않다"는 목적을 달성했기 때문이다. 404면 실행 취소가 불필요하게 복잡해진다.
- **목록은 페이징하지 않는다**: 관심 천체는 수십 건 규모다. 같은 이유로 NEO 목록의 `next_approach` N+1은 허용했다.
- **식별자 키**: POST · DELETE 응답은 요청 본문 키(`nasa_id`, `exoplanet_id`)를 그대로 돌려준다.

### 4.5 화면과 API

- **크기 비교 전용 API를 만들지 않는다**: 비교 대상이 보통 2 ~ 4개라 상세 API를 필요한 만큼 부르면 된다.
- **대시보드 정렬은 클라이언트에서**: 하루치는 보통 5 ~ 20건이라 다시 요청하면 왕복 시간만 낭비한다. `sort` 파라미터는 API 완결성을 위해 남겨 뒀다.
- **외계행성 정렬은 반드시 서버에서**: 5,000건 이상을 페이징하므로, 현재 페이지만 정렬하면 전체 순서가 아니다.
- **401은 화면마다 처리하지 않는다**: `AuthProvider`의 응답 감시가 로그인 상태를 지우면 `ProtectedRoute`가 `/login?next=지금 주소`로 보낸다.

---

## 5. 개발 · 배포 환경

- **개발**: 기기별 세팅 · 실행 · 테스트는 [CLAUDE.md](../CLAUDE.md) 2장이 원본이다. DB는 기기마다 따로다.
- **배포**: 아직 안 했다. 위치는 [decisions/0009](decisions/0009-deploy-platform.md), 할 일은 [PLAN](PLAN.md) 9장. 서버를 만들면 `SERVER.md`를 새로 쓴다.
