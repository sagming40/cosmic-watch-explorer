# Cosmic Watch & Explorer — API 명세서
 
| 항목 | 내용 |
|---|---|
| 문서 번호 | 04 |
| 문서명 | API 명세서 |
| 프로젝트명 | Cosmic Watch & Explorer |
| 작성자 | 사공민규 |
| 버전 | v1.1 |
| 최종 수정일 | 2026-08-31 |
| 프레임워크 | Django REST Framework |
| 상태 | 확정 |

**변경 이력**

| 버전 | 일자 | 내용 |
|---|---|---|
| v1.0 | 2026-08-21 | 최초 작성 |
| v1.1 | 2026-08-31 | 10.1절 "테이블 9개" → "테이블 8개" 정정 (모델 8개가 실제 맞는 개수, auth_user를 잘못 포함해 계산했던 오류) |
 
---
 
## 1. 공통 규약
 
### 1.1 기본 정보
 
| 항목 | 값 |
|---|---|
| Base URL (개발) | `http://localhost:8000/api` |
| 요청·응답 형식 | `application/json` |
| 문자 인코딩 | UTF-8 |
| 시각 표기 | ISO 8601, UTC (`2026-08-21T03:16:00Z`) |
| 인증 방식 | **세션 쿠키** (`httpOnly`) |
 
### 1.2 필드 이름은 snake_case로 통일한다
 
Python은 `snake_case`, JavaScript는 `camelCase`가 관례다. 어느 쪽에 맞출지 정해야 한다.
 
**결정: 전 구간 `snake_case`를 쓴다.**
 
변환 계층을 두면 백엔드와 프론트에서 같은 필드를 다른 이름으로 부르게 되어, 디버깅할 때 브라우저 개발자도구에 찍힌 이름과 Django 코드의 이름이 달라진다. 초보 단계에서 이 불일치는 순수한 혼란 비용이다. DRF 기본값을 그대로 쓴다.
 
### 1.3 HTTP 상태 코드
 
| 코드 | 사용 상황 |
|---|---|
| `200 OK` | 조회 성공, 삭제 성공 |
| `201 Created` | 회원가입, Watchlist 등록 성공 |
| `204 No Content` | 로그아웃 성공 |
| `400 Bad Request` | 파라미터 형식 오류, 유효성 검사 실패 |
| `401 Unauthorized` | 로그인이 필요한 요청인데 비로그인 |
| `403 Forbidden` | CSRF 토큰 누락/불일치 |
| `404 Not Found` | 존재하지 않는 리소스 |
| `409 Conflict` | 이미 등록된 Watchlist 항목 |
| `429 Too Many Requests` | 요청 한도 초과 |
| `503 Service Unavailable` | NASA API 응답 실패 |
 
### 1.4 오류 응답 형식
 
DRF의 기본 오류 형식은 상황에 따라 모양이 달라진다. 어떤 때는 `{"detail": "..."}`, 어떤 때는 `{"password": ["..."]}`. 프론트에서 매번 다르게 처리해야 한다.
 
**전 구간 동일한 봉투(envelope)를 쓴다.**
 
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요.",
    "fields": {
      "password": ["비밀번호는 8자 이상이어야 합니다."]
    }
  }
}
```
 
| 필드 | 설명 |
|---|---|
| `code` | 프론트에서 분기할 때 쓰는 식별자 (문구가 바뀌어도 유지됨) |
| `message` | 사용자에게 그대로 보여줄 수 있는 문구 |
| `fields` | 필드별 오류. 폼이 아닌 경우 생략 |
 
#### 오류 코드 목록
 
| code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 입력값 오류 |
| `INVALID_DATE` | 400 | 날짜 형식 오류 또는 허용 범위 밖 |
| `AUTH_REQUIRED` | 401 | 로그인 필요 |
| `INVALID_CREDENTIALS` | 400 | 아이디 또는 비밀번호 불일치 |
| `CSRF_FAILED` | 403 | CSRF 토큰 문제 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `ALREADY_EXISTS` | 409 | 중복 등록 |
| `RATE_LIMITED` | 429 | 요청 한도 초과 |
| `UPSTREAM_ERROR` | 503 | NASA API 장애 |
 
> **구현**: DRF의 `EXCEPTION_HANDLER` 설정에 커스텀 함수를 등록하면 모든 예외가 이 형식으로 나간다. 각 뷰에서 개별 처리하지 않는다.
 
### 1.5 페이징 형식
 
```json
{
  "count": 5412,
  "page": 1,
  "page_size": 20,
  "total_pages": 271,
  "results": [ ... ]
}
```
 
DRF 기본 `PageNumberPagination`은 `next`, `previous`를 **전체 URL 문자열**로 준다. 프론트에서 페이지 번호를 알려면 URL을 파싱해야 해서 불편하다. `page`, `total_pages`를 직접 내려주는 방식으로 커스터마이징한다.
 
---
 
## 2. 인증 — 세션 쿠키와 CSRF
 
### 2.1 CSRF가 필요한 이유
 
세션 쿠키는 브라우저가 **자동으로** 붙여준다. 편리하지만 부작용이 있다.
 
악성 사이트가 `<img src="http://우리사이트/api/watchlist/neo/1/">` 같은 걸 심어두면, 그 사이트를 방문한 로그인 사용자의 브라우저가 **쿠키를 자동으로 실어서** 우리 서버에 요청을 보낸다. 사용자는 아무것도 안 눌렀는데 요청이 나가는 것이다. 이걸 CSRF(사이트 간 요청 위조)라고 한다.
 
**막는 방법**: 쿠키와 별개로, 우리 사이트의 JavaScript만 읽을 수 있는 토큰을 헤더에 함께 보내게 한다. 악성 사이트는 다른 출처라서 그 토큰을 읽지 못한다.
 
> 은행 창구에 비유하면, 통장(쿠키)만으로는 출금이 안 되고 **그 자리에서 직접 쓴 서명(CSRF 토큰)** 이 있어야 하는 것과 같다. 통장을 훔쳐도 서명은 못 한다.
 
### 2.2 프론트에서의 처리
 
```javascript
// src/api/client.js
import axios from 'axios';
 
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,          // ① 쿠키를 함께 보낸다
  xsrfCookieName: 'csrftoken',    // ② 이 쿠키를 읽어서
  xsrfHeaderName: 'X-CSRFToken',  // ③ 이 헤더에 담는다
});
```
 
axios는 ②③ 설정만 해두면 `POST`, `PUT`, `DELETE`일 때 자동으로 토큰을 헤더에 붙인다. 매 요청마다 손으로 넣을 필요 없다.
 
**단, `csrftoken` 쿠키가 브라우저에 먼저 심어져 있어야 한다.** 그래서 앱이 처음 뜰 때 `GET /api/auth/csrf/`를 한 번 호출한다.
 
### 2.3 개발 환경 CORS
 
React(`5173`)와 Django(`8000`)는 포트가 달라 브라우저가 다른 출처로 판단하고 쿠키를 차단한다. Vite 프록시로 같은 출처처럼 만든다.
 
```javascript
// vite.config.js
export default {
  server: {
    proxy: { '/api': 'http://localhost:8000' }
  }
}
```
 
이렇게 하면 브라우저 입장에서는 `localhost:5173/api/...` 로 보이므로 CORS 자체가 발생하지 않는다. `django-cors-headers` 설치가 필요 없다.
 
---
 
## 3. 엔드포인트 전체 목록
 
| # | Method | 경로 | 화면 | 인증 |
|---|---|---|---|---|
| 1 | GET | `/api/auth/csrf/` | 앱 초기화 | — |
| 2 | GET | `/api/auth/me/` | 헤더 로그인 상태 | — |
| 3 | POST | `/api/auth/signup/` | 회원가입 | — |
| 4 | POST | `/api/auth/login/` | 로그인 | — |
| 5 | POST | `/api/auth/logout/` | 헤더 | 필요 |
| 6 | GET | `/api/neo/` | NEO 대시보드 | — |
| 7 | GET | `/api/neo/{nasa_id}/` | NEO 상세 | — |
| 8 | GET | `/api/neo/{nasa_id}/approaches/` | 접근 기록 더 보기 | — |
| 9 | GET | `/api/exoplanets/` | 카탈로그 | — |
| 10 | GET | `/api/exoplanets/{id}/` | 외계행성 상세 | — |
| 11 | GET | `/api/exoplanets/meta/` | 필터 드롭다운 | — |
| 12 | GET | `/api/watchlist/neo/` | 내 관심 천체 | 필요 |
| 13 | POST | `/api/watchlist/neo/` | 저장 버튼 | 필요 |
| 14 | DELETE | `/api/watchlist/neo/{nasa_id}/` | 저장 해제 | 필요 |
| 15 | GET | `/api/watchlist/exoplanets/` | 내 관심 천체 | 필요 |
| 16 | POST | `/api/watchlist/exoplanets/` | 저장 버튼 | 필요 |
| 17 | DELETE | `/api/watchlist/exoplanets/{id}/` | 저장 해제 | 필요 |
 
### 3.1 크기 비교 전용 API를 만들지 않는 이유
 
`/compare` 화면에는 별도 엔드포인트를 두지 않는다. 비교 대상이 보통 2~4개이므로, 기존 상세 API(`#7`, `#10`)를 필요한 만큼 호출하면 된다.
 
전용 API를 만들면 코드는 늘어나는데 얻는 게 요청 횟수 한두 번 줄이는 것뿐이다. MVP에서는 만들지 않는다.
 
### 3.2 URL 식별자가 NEO와 외계행성이 다른 이유
 
| 리소스 | 식별자 | 예시 URL |
|---|---|---|
| NEO | `nasa_id` | `/api/neo/2357621/` |
| Exoplanet | 내부 `id` | `/api/exoplanets/1042/` |
 
NEO의 NASA ID는 `2357621` 같은 순수 숫자라 URL에 그대로 쓸 수 있고, NASA/JPL 사이트와 대조하기 쉽다.
 
반면 외계행성의 이름은 `Kepler-317 c`처럼 **공백과 특수문자**가 들어간다. URL에 넣으려면 인코딩이 필요하고(`Kepler-317%20c`), 이름이 개정되면 링크가 깨진다. 그래서 내부 ID를 쓴다.
 
---
 
## 4. 인증 API
 
### 4.1 `GET /api/auth/csrf/`
 
CSRF 토큰 쿠키를 발급한다. 앱이 처음 로드될 때 한 번 호출한다.
 
**응답 `200`**
 
```json
{ "detail": "CSRF cookie set" }
```
 
응답 헤더로 `Set-Cookie: csrftoken=...` 가 내려온다. 본문에는 토큰을 담지 않는다.
 
---
 
### 4.2 `GET /api/auth/me/`
 
현재 로그인 상태를 확인한다. 헤더의 로그인/로그아웃 표시와, 새로고침 후 상태 복원에 쓴다.
 
**응답 `200` — 로그인 상태**
 
```json
{
  "is_authenticated": true,
  "user": {
    "id": 3,
    "username": "mingyu",
    "email": "mingyu@example.com"
  }
}
```
 
**응답 `200` — 비로그인**
 
```json
{ "is_authenticated": false, "user": null }
```
 
> 비로그인일 때 `401`을 반환하지 않는다. "로그인 안 했음"은 오류가 아니라 정상적인 조회 결과다. 여기서 401을 던지면 프론트의 공통 오류 처리기가 로그인 페이지로 튕겨버린다.
 
---
 
### 4.3 `POST /api/auth/signup/`
 
**요청**
 
```json
{
  "username": "mingyu",
  "email": "mingyu@example.com",
  "password": "supersecret123",
  "password_confirm": "supersecret123"
}
```
 
| 필드 | 타입 | 필수 | 규칙 |
|---|---|---|---|
| `username` | string | ✅ | 3~30자, 영문/숫자/`_` |
| `email` | string | ✅ | 이메일 형식, 중복 불가 |
| `password` | string | ✅ | 8자 이상, Django 기본 검증기 통과 |
| `password_confirm` | string | ✅ | `password`와 일치 |
 
**응답 `201`** — 가입과 동시에 로그인 처리한다.
 
```json
{
  "is_authenticated": true,
  "user": { "id": 3, "username": "mingyu", "email": "mingyu@example.com" }
}
```
 
**응답 `400`**
 
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해 주세요.",
    "fields": {
      "username": ["이미 사용 중인 아이디입니다."],
      "password": ["비밀번호가 너무 단순합니다."]
    }
  }
}
```
 
> 가입 직후 다시 로그인하게 만들지 않는다. 시나리오 3에서 사용자는 "저장" 버튼을 누르려다 여기까지 온 것이므로, 단계를 하나라도 줄인다.
 
---
 
### 4.4 `POST /api/auth/login/`
 
**요청**
 
```json
{ "username": "mingyu", "password": "supersecret123" }
```
 
**응답 `200`** — `/api/auth/me/`와 동일한 형식
 
**응답 `400`**
 
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "아이디 또는 비밀번호가 올바르지 않습니다."
  }
}
```
 
> **아이디가 틀렸는지 비밀번호가 틀렸는지 구분해서 알려주지 않는다.** 구분해주면 공격자가 "이 아이디는 존재한다"는 사실을 확인할 수 있다(계정 열거 공격).
 
---
 
### 4.5 `POST /api/auth/logout/`
 
요청 본문 없음. 세션을 삭제한다.
 
**응답 `204`** (본문 없음)
 
---
 
## 5. NEO API
 
### 5.1 `GET /api/neo/` — 대시보드
 
화면 6.1 전체를 이 하나로 채운다.
 
**쿼리 파라미터**
 
| 이름 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `date` | `YYYY-MM-DD` | 오늘 | 조회 날짜 |
| `sort` | string | `distance` | `distance` / `velocity` / `size` |
| `body` | string | `Earth` | 접근 대상 천체 |
 
**응답 `200`**
 
```json
{
  "date": "2026-08-21",
  "summary": {
    "total_count": 6,
    "hazardous_count": 1,
    "closest_ld": 0.80,
    "closest_km": 307520.4
  },
  "cache": {
    "is_cached": true,
    "fetched_at": "2026-08-21T04:12:33Z"
  },
  "results": [
    {
      "nasa_id": "54016054",
      "name": "2024 PT5",
      "is_hazardous": true,
      "diameter_min_m": 8.2,
      "diameter_max_m": 18.4,
      "approach": {
        "datetime_utc": "2026-08-21T11:40:00Z",
        "miss_distance_km": 307520.4,
        "miss_distance_ld": 0.80,
        "miss_distance_au": 0.00205,
        "velocity_km_s": 9.42,
        "velocity_km_h": 33912.0,
        "orbiting_body": "Earth"
      }
    }
  ]
}
```
 
#### 설계 결정 ① — 요약과 목록을 한 응답에 담는다
 
화면 상단의 요약(접근 6건 / 위험 1건 / 최근접 0.8 LD)은 **아래 목록과 완전히 같은 데이터에서 계산된다.** 별도 엔드포인트로 나누면 서버가 같은 쿼리를 두 번 돌리고, 두 요청 사이에 데이터가 갱신되면 요약과 목록이 어긋난다.
 
#### 설계 결정 ② — 달 거리(LD) 환산은 서버가 한다
 
`miss_distance_ld`를 서버에서 계산해 내려준다. 프론트에서 `km / 384400` 하지 않는다.
 
기준값 384,400km가 프론트 코드 곳곳에 흩어지면, 나중에 정밀한 값으로 바꿀 때 빠뜨리는 곳이 생긴다. **도메인 계산은 한 곳에만 둔다.**
 
#### 설계 결정 ③ — `cache` 정보를 함께 내려준다
 
`is_cached: false`면 이번 요청에서 NASA API를 직접 호출했다는 뜻이다. 프론트는 이걸 보고 "방금 NASA에서 가져온 데이터입니다" 같은 안내를 띄우거나, 개발 중에 캐싱이 제대로 동작하는지 확인할 수 있다.
 
#### 처리 흐름
 
```text
GET /api/neo/?date=2026-08-21
        ↓
neo_fetch_log에 2026-08-21 있는가?
   ┌────┴────┐
  있음      없음
   ↓         ↓
DB 조회   NASA API 호출 → 저장 → fetch_log 기록
   ↓         ↓
       정렬 · 요약 계산
              ↓
            응답
```
 
#### 오류
 
```json
// 날짜 형식 오류
{ "error": { "code": "INVALID_DATE",
             "message": "날짜는 YYYY-MM-DD 형식이어야 합니다." } }
 
// NASA API 장애 (DB에도 데이터 없음)
{ "error": { "code": "UPSTREAM_ERROR",
             "message": "NASA 데이터 서버에 연결할 수 없습니다." } }
```
 
> **NASA API가 실패해도 DB에 데이터가 있으면 `200`으로 응답한다.** 요구사항 5.2의 "API 장애 시 기존 데이터 활용"이 이것이다. 이때 `cache.is_cached`는 `true`가 된다.
 
#### 요청 한도 관리
 
이 엔드포인트만 NASA API를 호출한다. DRF 스로틀을 걸어둔다.
 
```python
# settings.py
'DEFAULT_THROTTLE_RATES': {
    'neo_fetch': '30/hour',   # 캐시 미스로 NASA를 부르는 경우만 카운트
}
```
 
NASA 무료 키는 시간당 1,000회 제한이 있다. 캐싱이 있으므로 정상 상황에서는 한참 여유롭지만, 버그로 무한 호출이 발생했을 때 키가 정지되는 것을 막는 안전장치다.
 
---
 
### 5.2 `GET /api/neo/{nasa_id}/` — 상세
 
**응답 `200`**
 
```json
{
  "nasa_id": "2357621",
  "name": "357621 (2005 EG94)",
  "designation": "357621",
  "absolute_magnitude": 18.5,
  "diameter_min_m": 455.57,
  "diameter_max_m": 1018.67,
  "is_hazardous": true,
  "is_sentry_object": false,
  "jpl_url": "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2357621",
  "is_watchlisted": false,
  "orbital_data": {
    "orbit_id": "42",
    "orbit_determination_datetime_utc": "2026-08-16T06:18:55Z",
    "first_observation_date": "2005-03-08",
    "last_observation_date": "2026-08-15",
    "data_arc_days": 7830,
    "observations_used": 425,
    "eccentricity": 0.5836871,
    "semi_major_axis_au": 1.8271,
    "inclination_deg": 9.1274,
    "orbital_period_days": 902.41,
    "perihelion_distance_au": 0.7607,
    "aphelion_distance_au": 2.8935,
    "orbit_class_type": "APO",
    "orbit_class_description": "Near-Earth asteroid orbits which cross the Earth's orbit similar to that of 1862 Apollo"
  },
  "recent_approaches": [
    {
      "datetime_utc": "2026-08-21T03:16:00Z",
      "miss_distance_km": 4821033.2,
      "miss_distance_ld": 12.54,
      "velocity_km_s": 18.83,
      "orbiting_body": "Earth"
    }
  ],
  "approach_count": 87
}
```
 
#### 설계 결정 ① — `is_watchlisted`를 응답에 포함한다
 
**이게 없으면 저장 버튼을 그릴 수 없다.**
 
페이지가 로드될 때 별을 채워야 하는지 비워야 하는지 알아야 하는데, 그러려면 이 사용자가 이 NEO를 저장했는지 확인해야 한다. 별도 API를 부르면 요청이 두 번 나가고 버튼이 잠깐 깜빡인다.
 
- 비로그인 사용자에게는 항상 `false`를 내려준다.
- 목록 API(`5.1`)에는 이 필드를 **넣지 않는다.** 목록에는 저장 버튼이 없기 때문이다.
#### 설계 결정 ② — 접근 기록은 5건만, 전체 개수는 따로
 
`recent_approaches`는 최근 5건, `approach_count`는 전체 개수다. 화면 6.2에서 "더 보기" 버튼을 보여줄지 판단하는 근거가 된다(`approach_count > 5`).
 
접근 기록이 수백 건인 소행성이 있으므로 상세 응답에 전부 담지 않는다.
 
**응답 `404`**
 
```json
{ "error": { "code": "NOT_FOUND", "message": "해당 소행성을 찾을 수 없습니다." } }
```
 
---
 
### 5.3 `GET /api/neo/{nasa_id}/approaches/` — 접근 기록 전체
 
**쿼리 파라미터**
 
| 이름 | 기본값 | 설명 |
|---|---|---|
| `page` | 1 | 페이지 번호 |
| `page_size` | 20 | 페이지당 건수 (최대 100) |
| `body` | (전체) | 접근 대상 필터 |
 
**응답 `200`**
 
```json
{
  "count": 87,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "results": [
    {
      "datetime_utc": "2026-08-21T03:16:00Z",
      "approach_date": "2026-08-21",
      "miss_distance_km": 4821033.2,
      "miss_distance_ld": 12.54,
      "miss_distance_au": 0.03222,
      "velocity_km_s": 18.83,
      "velocity_km_h": 67788.0,
      "orbiting_body": "Earth"
    }
  ]
}
```
 
---
 
## 6. 외계행성 API
 
### 6.1 `GET /api/exoplanets/` — 카탈로그 검색
 
요구사항 4.3의 다중 조건 검색. **이 프로젝트 백엔드의 핵심 기능이다.**
 
**쿼리 파라미터**
 
| 이름 | 타입 | 설명 |
|---|---|---|
| `name` | string | 행성명 부분 일치 |
| `host` | string | 모항성명 부분 일치 |
| `radius_min` / `radius_max` | number | 반지름 (지구=1) |
| `mass_min` / `mass_max` | number | 질량 (지구=1) |
| `temp_min` / `temp_max` | number | 평형 온도 (K) |
| `distance_min_ly` / `distance_max_ly` | number | **거리 (광년)** |
| `period_min` / `period_max` | number | 공전 주기 (일) |
| `year_min` / `year_max` | integer | 발견 연도 |
| `method` | string | 발견 방법 (정확히 일치) |
| `sort` | string | `name` / `distance` / `radius` / `mass` / `year` (앞에 `-`를 붙이면 내림차순) |
| `page` / `page_size` | integer | 페이징 |
 
**응답 `200`**
 
```json
{
  "count": 47,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "applied_filters": {
    "radius_min": 0.8,
    "radius_max": 1.5,
    "distance_max_ly": 100
  },
  "results": [
    {
      "id": 1042,
      "planet_name": "Proxima Cen b",
      "radius_earth": 1.03,
      "mass_earth": 1.27,
      "equilibrium_temp_k": 234.0,
      "orbital_period_days": 11.186,
      "discovery_year": 2016,
      "discovery_method": "Radial Velocity",
      "host_star": {
        "name": "Proxima Cen",
        "distance_pc": 1.301,
        "distance_ly": 4.24
      }
    }
  ]
}
```
 
#### 설계 결정 ① — 거리는 광년으로 받고, 파섹과 광년을 모두 내려준다
 
DB에는 파섹으로 저장되어 있지만(문서 02, 3.4), 사용자에게 파섹을 요구하지 않는다.
 
```python
# 요청: distance_max_ly=100
pc = 100 / 3.26156           # → 30.66 pc
qs.filter(host_star__distance_pc__lte=pc)
```
 
응답에는 `distance_pc`(원본)와 `distance_ly`(표시용)를 모두 담는다. 원본 값을 숨기지 않으면서 화면은 광년으로 그릴 수 있다.
 
#### 설계 결정 ② — `applied_filters`를 응답에 되돌려준다
 
화면 6.3의 필터 칩을 그리는 데 쓴다. 프론트가 자기 상태를 그대로 그려도 되지만, **서버가 실제로 무슨 조건으로 조회했는지**를 돌려주면 둘이 어긋날 수 없다. 잘못된 파라미터가 무시된 경우에도 사용자가 알 수 있다.
 
#### 설계 결정 ③ — `select_related`를 반드시 쓴다
 
```python
qs = Exoplanet.objects.select_related('host_star')
```
 
이게 없으면 20건 목록을 만들 때 **모항성 정보를 가져오려고 쿼리가 20번 더 나간다**(N+1 문제). 목록 조회 한 번에 21번의 DB 요청이 발생한다.
 
> 마트에서 장 볼 때 목록을 들고 한 번에 다 담아오는 것과, 물건 하나 살 때마다 집에 갔다 오는 것의 차이다. `select_related`는 JOIN으로 한 번에 가져온다.
 
#### 오류
 
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "검색 조건을 확인해 주세요.",
    "fields": { "radius_min": ["숫자를 입력해 주세요."] }
  }
}
```
 
---
 
### 6.2 `GET /api/exoplanets/{id}/` — 상세
 
**응답 `200`**
 
```json
{
  "id": 1042,
  "planet_name": "Proxima Cen b",
  "radius_earth": 1.03,
  "mass_earth": 1.27,
  "equilibrium_temp_k": 234.0,
  "orbital_period_days": 11.186,
  "discovery_year": 2016,
  "discovery_method": "Radial Velocity",
  "is_watchlisted": false,
  "host_star": {
    "id": 88,
    "name": "Proxima Cen",
    "distance_pc": 1.301,
    "distance_ly": 4.24,
    "spectral_type": "M5.5Ve",
    "temperature_k": 2992.0,
    "radius_solar": 0.1542,
    "mass_solar": 0.1221,
    "metallicity": 0.21,
    "surface_gravity": 5.2
  },
  "sibling_planets": [
    { "id": 1043, "planet_name": "Proxima Cen c", "radius_earth": null },
    { "id": 1044, "planet_name": "Proxima Cen d", "radius_earth": 0.81 }
  ]
}
```
 
#### `sibling_planets`를 넣은 이유
 
같은 항성을 도는 다른 행성 목록이다. DB 구조상 `host_star.planets`로 이미 접근 가능하므로 **추가 비용이 거의 없다.**
 
사용자 입장에서는 "이 별에는 다른 행성도 있구나" 하고 자연스럽게 탐색이 이어진다. TRAPPIST-1처럼 행성이 7개인 계는 이 링크가 실제로 유용하다.
 
> **`null` 값을 그대로 내려보낸다.** `radius_earth: null`은 "측정되지 않음"이라는 정보다. `0`으로 바꾸지 않는다(문서 02, 1.1). 프론트에서 `—`로 표시한다.
 
---
 
### 6.3 `GET /api/exoplanets/meta/` — 필터 선택지
 
**이 API가 없으면 발견 방법 드롭다운을 채울 수 없다.**
 
화면 6.3의 "발견 방법" 선택 상자에 무엇을 넣을지, 프론트에 하드코딩하면 NASA가 새 방법을 추가했을 때 목록에서 빠진다. DB에 실제로 존재하는 값을 보내준다.
 
**응답 `200`**
 
```json
{
  "discovery_methods": [
    { "value": "Transit", "count": 4210 },
    { "value": "Radial Velocity", "count": 1089 },
    { "value": "Microlensing", "count": 231 },
    { "value": "Imaging", "count": 82 },
    { "value": "Transit Timing Variations", "count": 30 }
  ],
  "ranges": {
    "radius_earth":   { "min": 0.30,  "max": 77.34 },
    "mass_earth":     { "min": 0.02,  "max": 12000.0 },
    "discovery_year": { "min": 1992,  "max": 2026 },
    "distance_ly":    { "min": 4.24,  "max": 27700.0 }
  },
  "total_count": 5642
}
```
 
`ranges`는 입력 필드의 `min`/`max` 속성과 자리표시자(`0.30 ~ 77.34`)에 쓴다. 사용자가 존재하지 않는 범위를 입력해서 빈 결과를 받는 일이 줄어든다.
 
> **이 응답은 자주 바뀌지 않으므로 서버에서 캐싱한다.** Django `cache_page(60 * 60)` 데코레이터로 1시간 캐싱하면 충분하다.
 
---
 
## 7. Watchlist API
 
### 7.1 토글이 아니라 POST / DELETE로 나눈 이유
 
화면상으로는 별 아이콘 하나를 눌렀다 뗐다 하는 **토글**이다. `POST /watchlist/toggle/` 하나로 만들 수도 있다.
 
**그렇게 하지 않는다.**
 
토글은 "현재 상태를 뒤집어라"는 명령이라, 같은 요청을 두 번 보내면 결과가 달라진다. 네트워크가 불안정해서 요청이 중복 전송되면 사용자는 저장했는데 해제되어 있는 상황이 생긴다.
 
`POST`(등록)와 `DELETE`(해제)로 나누면 **같은 요청을 몇 번 보내도 결과가 같다**(멱등성). 프론트는 현재 상태(`is_watchlisted`)를 알고 있으므로 어느 쪽을 부를지 판단할 수 있다.
 
> 전등 스위치가 "누를 때마다 반대로"인 것과, "켜기 버튼"과 "끄기 버튼"이 따로 있는 것의 차이다. 후자는 이미 켜진 상태에서 켜기를 눌러도 아무 문제가 없다.
 
---
 
### 7.2 `GET /api/watchlist/neo/`
 
**응답 `200`**
 
```json
{
  "count": 3,
  "results": [
    {
      "nasa_id": "2357621",
      "name": "357621 (2005 EG94)",
      "is_hazardous": true,
      "diameter_min_m": 455.57,
      "diameter_max_m": 1018.67,
      "saved_at": "2026-08-19T14:22:10Z",
      "next_approach": {
        "datetime_utc": "2031-03-14T22:05:00Z",
        "miss_distance_ld": 8.20
      }
    }
  ]
}
```
 
`next_approach`는 **오늘 이후의 접근 기록 중 가장 빠른 것**이다. 화면 6에서 "다음 접근 예정일"로 쓴다. 없으면 `null`.
 
```python
# 구현 힌트
CloseApproach.objects.filter(
    neo=neo, approach_date__gte=today, orbiting_body='Earth'
).order_by('approach_date').first()
```
 
**응답 `401`**
 
```json
{ "error": { "code": "AUTH_REQUIRED", "message": "로그인이 필요합니다." } }
```
 
---
 
### 7.3 `POST /api/watchlist/neo/`
 
**요청**
 
```json
{ "nasa_id": "2357621" }
```
 
**응답 `201`**
 
```json
{ "nasa_id": "2357621", "saved_at": "2026-08-21T09:30:00Z" }
```
 
**응답 `409`**
 
```json
{ "error": { "code": "ALREADY_EXISTS", "message": "이미 저장된 천체입니다." } }
```
 
> DB의 `UNIQUE(user_id, neo_id)` 제약(문서 02, 3.6)이 최종 방어선이다. 애플리케이션에서 "있는지 확인 후 저장"만 하면, 요청이 동시에 두 번 들어왔을 때 둘 다 "없음"으로 판정하고 둘 다 저장하는 일이 생길 수 있다. `IntegrityError`를 잡아서 `409`로 변환한다.
 
---
 
### 7.4 `DELETE /api/watchlist/neo/{nasa_id}/`
 
**응답 `200`**
 
```json
{ "nasa_id": "2357621", "deleted": true }
```
 
저장되어 있지 않은 항목을 삭제해도 `200`을 반환한다. "결과적으로 저장되어 있지 않다"는 목적은 달성되었기 때문이다. 여기서 `404`를 던지면 화면 6의 "실행 취소" 동작이 불필요하게 복잡해진다.
 
---
 
### 7.5 외계행성 Watchlist
 
`5`, `6`, `7`번 항목과 동일한 구조다.
 
| Method | 경로 | 요청 본문 |
|---|---|---|
| GET | `/api/watchlist/exoplanets/` | — |
| POST | `/api/watchlist/exoplanets/` | `{ "exoplanet_id": 1042 }` |
| DELETE | `/api/watchlist/exoplanets/{id}/` | — |
 
목록 응답에는 `next_approach` 대신 `host_star` 요약이 들어간다.
 
```json
{
  "count": 2,
  "results": [
    {
      "id": 1042,
      "planet_name": "Proxima Cen b",
      "radius_earth": 1.03,
      "host_star": { "name": "Proxima Cen", "distance_ly": 4.24 },
      "saved_at": "2026-08-20T11:05:44Z"
    }
  ]
}
```
 
---
 
## 8. 화면 ↔ API 대응표
 
각 화면이 어떤 API를 언제 호출하는지 정리한다. 개발할 때 이 표를 보고 순서를 잡는다.
 
| 화면 | 시점 | 호출 |
|---|---|---|
| 앱 초기화 | 최초 1회 | `GET /auth/csrf/` → `GET /auth/me/` |
| NEO 대시보드 | 진입 / 날짜 변경 | `GET /neo/?date=` |
| NEO 대시보드 | 정렬 변경 | 재호출 없이 **클라이언트에서 정렬** |
| NEO 상세 | 진입 | `GET /neo/{nasa_id}/` |
| NEO 상세 | "더 보기" | `GET /neo/{nasa_id}/approaches/?page=2` |
| NEO 상세 | 저장 클릭 | `POST` 또는 `DELETE /watchlist/neo/` |
| 카탈로그 | 진입 | `GET /exoplanets/meta/` + `GET /exoplanets/` |
| 카탈로그 | 검색 / 페이지 이동 | `GET /exoplanets/?...` |
| 외계행성 상세 | 진입 | `GET /exoplanets/{id}/` |
| 크기 비교 | 대상 추가 | `GET /neo/{nasa_id}/` 또는 `GET /exoplanets/{id}/` |
| 내 관심 천체 | 진입 | `GET /watchlist/neo/` + `GET /watchlist/exoplanets/` |
| 로그인 | 제출 | `POST /auth/login/` |
| 회원가입 | 제출 | `POST /auth/signup/` |
 
### 8.1 정렬을 클라이언트에서 하는 이유
 
대시보드의 하루치 NEO는 보통 **5~20건**이다. 정렬 때문에 서버에 다시 요청하면 네트워크 왕복 시간만 낭비된다. 이미 받아온 배열을 `sort()`하면 즉시 반응한다.
 
반면 외계행성 카탈로그는 5,000건 이상이고 페이징되어 있으므로 **반드시 서버에서 정렬한다.** 현재 페이지 20건만 정렬하면 전체 순서가 아니라 그 페이지 안에서만 뒤섞이는 잘못된 결과가 된다.
 
> `/api/neo/`의 `sort` 파라미터는 그대로 두되, 프론트는 사용하지 않는다. API 자체의 완결성을 위해 남겨둔다.
 
---
 
## 9. Django 프로젝트 구조 제안
 
```text
backend/
├── config/                    # 프로젝트 설정
│   ├── settings.py
│   ├── urls.py
│   └── exception_handler.py   # 1.4의 공통 오류 형식
│
├── apps/
│   ├── accounts/              # 인증
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── astronomy/             # NEO + Exoplanet
│   │   ├── models.py          # 문서 02의 모델
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── filters.py         # 다중 조건 검색 로직
│   │   ├── urls.py
│   │   └── services/          # ★ 외부 API 통신 격리
│   │       ├── nasa_neo.py
│   │       └── exoplanet_archive.py
│   │
│   └── watchlist/
│       ├── models.py
│       ├── views.py
│       └── urls.py
│
└── manage.py
```
 
### 9.1 `services/` 디렉터리를 따로 두는 이유
 
요구사항 7.4의 "외부 NASA API 통신 로직을 비즈니스 로직과 분리한다"가 이것이다.
 
`views.py` 안에서 `requests.get('https://api.nasa.gov/...')`를 직접 부르면 이런 문제가 생긴다.
 
- 테스트할 때마다 실제 NASA API를 호출하게 된다
- NASA가 응답 형식을 바꾸면 뷰 코드를 고쳐야 한다
- 같은 호출 코드가 여러 뷰에 복사된다
`services/nasa_neo.py`에 `fetch_feed(date)` 같은 함수 하나로 격리해두면, 뷰는 "데이터를 달라"고만 하고 어디서 어떻게 가져오는지는 신경 쓰지 않는다.
 
> 식당의 홀과 주방을 나누는 것과 같다. 홀 직원(뷰)은 주문을 받고 음식을 내주기만 하고, 재료를 어디서 사 오는지(외부 API)는 주방(서비스)이 처리한다. 거래처가 바뀌어도 홀 업무는 그대로다.
 
---
 
## 10. 다음 단계
 
```text
01 요구사항 + 기능명세서      ✅
02 DB 설계서                 ✅
03 사용자 시나리오 + UI/UX   ✅
04 API 명세서                ✅ (본 문서)
        ↓
05 실제 개발 착수
```
 
### 10.1 개발 착수 순서
 
문서 03의 개발 순서(11장)와 맞물린다.
 
| 순서 | 작업 | 확인 기준 |
|---|---|---|
| 1 | Django 프로젝트 생성 + MariaDB 연결 | `manage.py migrate` 성공 |
| 2 | 모델 작성 + 마이그레이션 | HeidiSQL에서 테이블 8개 확인 |
| 3 | `services/nasa_neo.py` 작성 | 콘솔에서 NASA 데이터 수집 성공 |
| 4 | `GET /api/neo/` 구현 | 브라우저에서 JSON 확인 |
| 5 | React 프로젝트 생성 + Vite 프록시 | 대시보드에 목록이 뜸 |
| 6 | 나머지 엔드포인트 순차 구현 | — |
 
**3번에서 멈추고 반드시 확인할 것**: NASA API에서 데이터를 받아 DB에 저장하는 것까지가 이 프로젝트의 심장이다. 여기가 되면 나머지는 조회 코드일 뿐이다.
 
```bash
python manage.py shell
>>> from apps.astronomy.services.nasa_neo import fetch_feed
>>> fetch_feed('2026-08-21')
```
 
React를 붙이기 전에 이게 먼저 되어야 한다.
