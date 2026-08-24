# Cosmic Watch & Explorer — DB 설계서
 
| 항목 | 내용 |
|---|---|
| 문서 번호 | 02 |
| 문서명 | DB 설계서 |
| 프로젝트명 | Cosmic Watch & Explorer |
| 작성자 | 사공민규 |
| 버전 | v1.0 |
| 최종 수정일 | 2026-08-21 |
| DBMS | MariaDB (InnoDB / utf8mb4) |
| 상태 | 확정 |
 
---
 
## 0. 이 문서의 범위
 
01번 요구사항 문서에서 확정한 기능을 저장 구조로 옮긴 문서다. 다음을 포함한다.
 
- 전체 ERD
- 테이블 9개의 상세 정의 (DDL 포함)
- NASA API 응답 필드 ↔ DB 컬럼 매핑
- 인덱스 전략
- NULL 처리 정책
- Django 모델 정의
---
 
## 1. 설계 원칙
 
### 1.1 NASA 원본 데이터를 훼손하지 않는다
 
NASA가 `null`을 주는 필드는 DB에도 `NULL`로 저장한다. `0`이나 `-1` 같은 임의의 값으로 치환하지 않는다.
 
> **이유**: 외계행성 데이터에서 `pl_rade = null`은 "반지름이 0이다"가 아니라 **"아직 측정되지 않았다"** 는 뜻이다. 이걸 0으로 바꾸면 "지구보다 작은 행성 검색"에 측정 안 된 행성이 전부 딸려 나온다.
 
### 1.2 단위를 컬럼명에 명시한다
 
`diameter`가 아니라 `diameter_min_m`, `velocity`가 아니라 `velocity_km_s`로 쓴다. 나중에 코드에서 단위를 헷갈릴 여지를 없앤다.
 
### 1.3 시간은 UTC임을 컬럼명에 표시한다
 
MariaDB의 `DATETIME` 타입에는 타임존 정보가 없다. 따라서 컬럼명에 `_utc`를 붙여 명시한다.
 
- `approach_datetime_utc`
- `orbit_determination_datetime_utc`
### 1.4 외부 ID와 내부 ID를 분리한다
 
NASA가 주는 ID(`2357621`)를 그대로 PK로 쓰지 않는다. 내부 PK는 `BIGINT AUTO_INCREMENT`로 따로 두고, NASA ID는 `nasa_id UNIQUE`로 저장한다.
 
> **이유**: 외부 시스템의 ID 체계가 바뀌어도 우리 DB의 관계(FK)가 깨지지 않는다.
 
---
 
## 2. 전체 ERD
 
```text
                        ┌─────────────────┐
                        │   auth_user     │
                        │  (Django 기본)  │
                        └────────┬────────┘
                                 │
                  ┌──────────────┴──────────────┐
                 1:N                           1:N
                  │                             │
                  ▼                             ▼
        ┌───────────────────┐       ┌─────────────────────────┐
        │  neo_watchlist    │       │  exoplanet_watchlist    │
        └─────────┬─────────┘       └────────────┬────────────┘
                 N:1                            N:1
                  │                              │
                  ▼                              ▼
            ┌───────────┐                  ┌─────────────┐
            │    neo    │                  │  exoplanet  │
            └─────┬─────┘                  └──────┬──────┘
                  │                               │
        ┌─────────┴─────────┐                    N:1
       1:N                 1:1                    │
        │                   │                     ▼
        ▼                   ▼               ┌─────────────┐
┌────────────────┐  ┌──────────────┐        │  host_star  │
│ close_approach │  │ orbital_data │        └─────────────┘
└────────────────┘  └──────────────┘
 
 
        ┌──────────────────┐
        │  neo_fetch_log   │   ← 독립 테이블 (수집 이력 관리)
        └──────────────────┘
```
 
### 2.1 관계 요약
 
| 관계 | 형태 | 설명 |
|---|---|---|
| neo → close_approach | 1:N | 하나의 소행성은 여러 번 지구에 접근한다 |
| neo → orbital_data | 1:1 | 소행성 하나당 최신 궤도 데이터 하나만 저장한다 |
| host_star → exoplanet | 1:N | 하나의 항성은 여러 행성을 거느린다 |
| user → neo_watchlist | 1:N | 사용자는 여러 NEO를 북마크한다 |
| user → exoplanet_watchlist | 1:N | 사용자는 여러 외계행성을 북마크한다 |
 
---
 
## 3. 테이블 상세 정의
 
### 3.1 `neo` — 소행성 기본 정보
 
소행성 자체의 **변하지 않는 속성**을 담는다. 접근 기록이나 궤도 데이터는 별도 테이블로 분리한다.
 
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | 내부 식별자 |
| `nasa_id` | VARCHAR(20) | UNIQUE, NOT NULL | NASA가 부여한 ID (예: `2357621`) |
| `name` | VARCHAR(100) | NOT NULL | 소행성 이름 (예: `357621 (2005 EG94)`) |
| `designation` | VARCHAR(50) | NULL | 지정 번호 |
| `absolute_magnitude` | DECIMAL(6,3) | NULL | 절대등급 (H) |
| `diameter_min_m` | DECIMAL(14,4) | NULL | 추정 직경 최솟값 (미터) |
| `diameter_max_m` | DECIMAL(14,4) | NULL | 추정 직경 최댓값 (미터) |
| `is_hazardous` | BOOLEAN | NOT NULL, DEFAULT FALSE | 잠재적 위험 소행성 여부 |
| `is_sentry_object` | BOOLEAN | NOT NULL, DEFAULT FALSE | Sentry 감시 대상 여부 |
| `jpl_url` | VARCHAR(500) | NULL | NASA/JPL 상세 페이지 링크 |
| `created_at` | DATETIME | NOT NULL | 최초 저장 시각 |
| `updated_at` | DATETIME | NOT NULL | 마지막 갱신 시각 |
 
#### 직경을 두 컬럼으로 나눈 이유
 
NASA는 소행성의 정확한 직경을 알지 못한다. 밝기로 추정하기 때문에 **범위**로 준다.
 
```json
"estimated_diameter": {
  "meters": {
    "estimated_diameter_min": 455.5698523,
    "estimated_diameter_max": 1018.6664325
  }
}
```
 
이걸 평균 내서 하나로 합치면 원본 정보가 사라진다. 크기 비교 화면에서 "이 소행성은 455m ~ 1,018m 사이"라고 범위로 보여주는 게 정직하다.
 
---
 
### 3.2 `close_approach` — 지구 접근 기록
 
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `neo_id` | BIGINT | FK → neo.id, NOT NULL | |
| `approach_date` | DATE | NOT NULL | 접근 날짜 (검색용) |
| `approach_datetime_utc` | DATETIME | NOT NULL | 접근 시각 (UTC) |
| `velocity_km_s` | DECIMAL(12,6) | NULL | 상대 속도 (km/s) |
| `velocity_km_h` | DECIMAL(14,4) | NULL | 상대 속도 (km/h) |
| `miss_distance_km` | DECIMAL(18,4) | NULL | 최소 접근 거리 (km) |
| `miss_distance_au` | DECIMAL(12,8) | NULL | 최소 접근 거리 (AU) |
| `orbiting_body` | VARCHAR(30) | NOT NULL | 접근 대상 천체 (Earth, Mars 등) |
 
#### 제약조건
 
```sql
UNIQUE (neo_id, approach_datetime_utc, orbiting_body)
```
 
NASA API를 여러 번 수집해도 같은 접근 기록이 중복 저장되지 않는다.
 
#### `approach_date`와 `approach_datetime_utc`를 둘 다 두는 이유
 
`DATETIME` 하나만 있어도 날짜 검색은 가능하다. 하지만 이렇게 쓰게 된다.
 
```sql
WHERE DATE(approach_datetime_utc) = '2026-08-21'   -- ❌ 인덱스를 못 탄다
```
 
컬럼에 함수를 씌우면 **인덱스가 무용지물이 된다.** 도서관에서 "제목이 ㄱ으로 시작하는 책"은 색인으로 바로 찾지만, "제목의 글자 수를 세어서 5글자인 책"은 전부 뒤져야 하는 것과 같다. 날짜 전용 컬럼을 따로 두면 이렇게 쓸 수 있다.
 
```sql
WHERE approach_date = '2026-08-21'   -- ⭕ 인덱스 사용
```
 
NEO 대시보드의 핵심 쿼리가 날짜 조회이므로 이 중복은 정당하다.
 
---
 
### 3.3 `orbital_data` — 궤도 정보
 
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `neo_id` | BIGINT | FK → neo.id, **UNIQUE**, NOT NULL | 1:1 관계 |
| `orbit_id` | VARCHAR(30) | NULL | NASA 궤도 계산 버전 ID |
| `orbit_determination_datetime_utc` | DATETIME | NULL | 궤도 결정 시각 (UTC) |
| `first_observation_date` | DATE | NULL | 최초 관측일 |
| `last_observation_date` | DATE | NULL | 최근 관측일 |
| `data_arc_days` | INT | NULL | 관측 기간 (일) |
| `observations_used` | INT | NULL | 관측 횟수 |
| `eccentricity` | DECIMAL(14,10) | NULL | 이심률 |
| `semi_major_axis_au` | DECIMAL(14,10) | NULL | 궤도 장반경 (AU) |
| `inclination_deg` | DECIMAL(12,8) | NULL | 궤도 경사각 (도) |
| `orbital_period_days` | DECIMAL(16,8) | NULL | 공전 주기 (일) |
| `perihelion_distance_au` | DECIMAL(14,10) | NULL | 근일점 거리 (AU) |
| `aphelion_distance_au` | DECIMAL(14,10) | NULL | 원일점 거리 (AU) |
| `orbit_class_type` | VARCHAR(10) | NULL | 궤도 분류 코드 (APO, ATE, AMO 등) |
| `orbit_class_description` | VARCHAR(255) | NULL | 궤도 분류 설명 |
 
#### `neo_id`에 UNIQUE를 거는 이유
 
NASA는 관측이 쌓일 때마다 궤도를 다시 계산한다. 하지만 우리 서비스는 **최신 궤도 하나만** 보여주면 충분하다. `UNIQUE`를 걸어두면 갱신할 때 새 행을 추가하는 게 아니라 기존 행을 덮어쓰게 되어, 데이터가 무한히 쌓이는 걸 막을 수 있다.
 
---
 
### 3.4 `host_star` — 모항성
 
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | 모항성 이름 |
| `distance_pc` | DECIMAL(12,3) | NULL | 지구로부터의 거리 (파섹) |
| `spectral_type` | VARCHAR(30) | NULL | 분광형 (G2V 등) |
| `temperature_k` | DECIMAL(10,2) | NULL | 유효온도 (K) |
| `radius_solar` | DECIMAL(12,6) | NULL | 태양 대비 반지름 |
| `mass_solar` | DECIMAL(12,6) | NULL | 태양 대비 질량 |
| `metallicity` | DECIMAL(10,5) | NULL | 금속도 |
| `surface_gravity` | DECIMAL(10,5) | NULL | 표면중력 (log g) |
 
#### 거리를 `host_star`에 둔 이유
 
같은 항성계의 행성들은 **지구로부터 같은 거리**에 있다. TRAPPIST-1e와 TRAPPIST-1f가 서로 다른 거리에 있을 리 없다. 행성마다 거리를 저장하면 같은 값이 반복 저장되고, 나중에 값을 수정할 때 일부만 고쳐져서 어긋날 수 있다.
 
> **주의 — 단위 문제**
> 요구사항 문서의 검색 조건은 "거리 ≤ 100 광년(ly)"인데, NASA가 주는 값은 **파섹(pc)** 이다.
> `1 pc = 3.26156 ly`
> **저장은 파섹, 화면 표시는 광년**으로 하고 변환은 백엔드에서 처리한다. DB에 두 단위를 모두 저장하지 않는다.
 
---
 
### 3.5 `exoplanet` — 외계행성
 
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `host_star_id` | BIGINT | FK → host_star.id, NOT NULL | |
| `planet_name` | VARCHAR(100) | UNIQUE, NOT NULL | 행성명 |
| `radius_earth` | DECIMAL(12,6) | NULL | 지구 대비 반지름 |
| `mass_earth` | DECIMAL(14,6) | NULL | 지구 대비 질량 |
| `equilibrium_temp_k` | DECIMAL(10,2) | NULL | 평형 온도 (K) |
| `orbital_period_days` | DECIMAL(16,8) | NULL | 공전 주기 (일) |
| `discovery_year` | SMALLINT | NULL | 발견 연도 |
| `discovery_method` | VARCHAR(50) | NULL | 발견 방법 (Transit 등) |
 
#### NULL 허용이 핵심이다
 
실제 NASA Exoplanet Archive 응답을 보면 이렇다.
 
```json
{
  "pl_name": "Kepler-317 c",
  "hostname": "Kepler-317",
  "sy_dist": 940.584,
  "pl_rade": null,      ← 반지름 미측정
  "pl_masse": null,     ← 질량 미측정
  "pl_eqt": null,       ← 온도 미측정
  "pl_orbper": 8.775,
  "disc_year": 2014,
  "discoverymethod": "Transit"
}
```
 
측정값이 비어있는 행성이 **매우 많다.** `NOT NULL`을 걸면 데이터의 상당수를 아예 저장하지 못한다.
 
---
 
### 3.6 `neo_watchlist` / `exoplanet_watchlist`
 
#### `neo_watchlist`
 
| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `user_id` | INT | FK → auth_user.id, NOT NULL |
| `neo_id` | BIGINT | FK → neo.id, NOT NULL |
| `created_at` | DATETIME | NOT NULL |
 
```sql
UNIQUE (user_id, neo_id)
```
 
#### `exoplanet_watchlist`
 
| 컬럼 | 타입 | 제약 |
|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT |
| `user_id` | INT | FK → auth_user.id, NOT NULL |
| `exoplanet_id` | BIGINT | FK → exoplanet.id, NOT NULL |
| `created_at` | DATETIME | NOT NULL |
 
```sql
UNIQUE (user_id, exoplanet_id)
```
 
`UNIQUE` 제약으로 중복 북마크를 **DB 레벨에서** 차단한다. 애플리케이션 코드에서 "이미 있나 확인 후 저장"하는 방식은 동시에 두 번 요청이 들어오면 뚫린다.
 
---
 
### 3.7 `neo_fetch_log` — 수집 이력 (신규 추가)
 
> **이 테이블은 기존 설계에 없었던 것을 추가한 것이다.**
 
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | BIGINT | PK, AUTO_INCREMENT | |
| `fetch_date` | DATE | UNIQUE, NOT NULL | 수집 대상 날짜 |
| `fetched_at` | DATETIME | NOT NULL | 실제 수집 시각 |
| `element_count` | INT | NOT NULL, DEFAULT 0 | 해당 날짜의 NEO 개수 |
| `is_success` | BOOLEAN | NOT NULL, DEFAULT TRUE | 수집 성공 여부 |
 
#### 왜 필요한가
 
요구사항 5.2의 캐싱 전략은 이렇다.
 
```text
사용자 요청 → DB 확인 → 데이터 있으면 DB 응답 / 없으면 NASA API 호출
```
 
여기에 **구멍이 하나 있다.** "DB에 데이터가 없다"는 두 가지 상황을 구분하지 못한다.
 
1. 아직 그 날짜를 수집하지 않았다 → NASA API를 호출해야 함
2. 수집은 했는데 그날 접근하는 소행성이 **0개**였다 → 호출할 필요 없음
이 구분이 없으면 소행성이 없는 날짜를 조회할 때마다 매번 NASA API를 호출하게 된다. NASA API는 시간당 1,000회 제한이 있으므로 낭비다.
 
편의점 재고 확인과 같다. 선반이 비어 있을 때 "아직 발주를 안 넣었다"와 "발주했는데 그 상품이 원래 안 들어오는 날이다"는 완전히 다른 상황이다. `neo_fetch_log`는 **발주 장부** 역할을 한다.
 
#### 수정된 캐싱 로직
 
```text
사용자가 2026-08-21 요청
        ↓
neo_fetch_log에 fetch_date = '2026-08-21' 행이 있는가?
   ┌────────┴────────┐
  있음               없음
   ↓                  ↓
close_approach     NASA API 호출
에서 조회               ↓
(0건이어도 정상)    데이터 저장
                       ↓
                  fetch_log에 기록
                       ↓
                    응답
```
 
---
 
## 4. 인덱스 전략
 
인덱스는 **책 뒤의 찾아보기**와 같다. 없어도 내용은 다 있지만, 원하는 항목을 찾으려면 첫 페이지부터 전부 넘겨야 한다. 데이터가 수만 건 쌓이면 체감 차이가 크다.
 
### 4.1 필수 인덱스
 
| 테이블 | 인덱스 | 이유 |
|---|---|---|
| `neo` | `UNIQUE(nasa_id)` | 수집 시 중복 확인 |
| `neo` | `INDEX(is_hazardous)` | 위험 소행성 필터 |
| `close_approach` | **`INDEX(approach_date)`** | **대시보드 핵심 쿼리** |
| `close_approach` | `INDEX(neo_id)` | 상세 페이지 접근 이력 |
| `close_approach` | `INDEX(miss_distance_km)` | "가장 가까운 NEO" 정렬 |
| `close_approach` | `UNIQUE(neo_id, approach_datetime_utc, orbiting_body)` | 중복 방지 |
| `orbital_data` | `UNIQUE(neo_id)` | 1:1 관계 강제 |
| `orbital_data` | `INDEX(orbit_class_type)` | 궤도 분류 필터 |
| `host_star` | `UNIQUE(name)` | 항성 중복 방지 |
| `host_star` | **`INDEX(distance_pc)`** | **거리 조건 검색** |
| `exoplanet` | `UNIQUE(planet_name)` | 행성 중복 방지 |
| `exoplanet` | `INDEX(host_star_id)` | JOIN 성능 |
| `exoplanet` | **`INDEX(radius_earth)`** | **크기 조건 검색** |
| `exoplanet` | **`INDEX(mass_earth)`** | **질량 조건 검색** |
| `exoplanet` | **`INDEX(discovery_year)`** | **발견 연도 검색** |
| `exoplanet` | `INDEX(discovery_method)` | 발견 방법 필터 |
| `neo_watchlist` | `UNIQUE(user_id, neo_id)` | 중복 북마크 방지 |
| `exoplanet_watchlist` | `UNIQUE(user_id, exoplanet_id)` | 중복 북마크 방지 |
| `neo_fetch_log` | `UNIQUE(fetch_date)` | 날짜당 1건 |
 
### 4.2 굵게 표시한 4개가 특히 중요한 이유
 
요구사항 4.3의 **다중 조건 검색**이 이 프로젝트에서 백엔드 실력을 보여주는 핵심 기능이다. 검색 조건이 9개인데 인덱스가 없으면, 조건을 조합할 때마다 전체 테이블을 스캔한다. 외계행성 데이터는 6,000건 이상이므로 체감할 수 있는 수준으로 느려진다.
 
면접에서 "검색 성능은 어떻게 고려했나요?"라는 질문에 대한 답이 여기서 나온다.
 
### 4.3 인덱스를 남발하지 않는 이유
 
인덱스는 조회를 빠르게 하는 대신 **저장을 느리게** 만든다. 책에 찾아보기를 만들면 새 내용을 추가할 때마다 찾아보기도 갱신해야 하는 것과 같다. 실제로 검색 조건으로 쓰이는 컬럼에만 건다.
 
---
 
## 5. NASA API ↔ DB 컬럼 매핑
 
### 5.1 NEO Feed / 상세 API → `neo`
 
| NASA 필드 | DB 컬럼 |
|---|---|
| `id` | `nasa_id` |
| `name` | `name` |
| `designation` | `designation` |
| `absolute_magnitude_h` | `absolute_magnitude` |
| `estimated_diameter.meters.estimated_diameter_min` | `diameter_min_m` |
| `estimated_diameter.meters.estimated_diameter_max` | `diameter_max_m` |
| `is_potentially_hazardous_asteroid` | `is_hazardous` |
| `is_sentry_object` | `is_sentry_object` |
| `nasa_jpl_url` | `jpl_url` |
 
### 5.2 `close_approach_data[]` → `close_approach`
 
| NASA 필드 | DB 컬럼 | 변환 |
|---|---|---|
| `close_approach_date` | `approach_date` | 그대로 |
| `close_approach_date_full` | `approach_datetime_utc` | `"2026-Aug-21 03:16"` → `DATETIME` 파싱 필요 |
| `relative_velocity.kilometers_per_second` | `velocity_km_s` | 문자열 → 숫자 |
| `relative_velocity.kilometers_per_hour` | `velocity_km_h` | 문자열 → 숫자 |
| `miss_distance.kilometers` | `miss_distance_km` | 문자열 → 숫자 |
| `miss_distance.astronomical` | `miss_distance_au` | 문자열 → 숫자 |
| `orbiting_body` | `orbiting_body` | 그대로 |
 
> **주의**: NASA는 숫자 값을 **문자열**로 준다 (`"18.83"`). 저장 전에 형변환이 필요하다.
 
### 5.3 `orbital_data` → `orbital_data`
 
| NASA 필드 | DB 컬럼 |
|---|---|
| `orbit_id` | `orbit_id` |
| `orbit_determination_date` | `orbit_determination_datetime_utc` |
| `first_observation_date` | `first_observation_date` |
| `last_observation_date` | `last_observation_date` |
| `data_arc_in_days` | `data_arc_days` |
| `observations_used` | `observations_used` |
| `eccentricity` | `eccentricity` |
| `semi_major_axis` | `semi_major_axis_au` |
| `inclination` | `inclination_deg` |
| `orbital_period` | `orbital_period_days` |
| `perihelion_distance` | `perihelion_distance_au` |
| `aphelion_distance` | `aphelion_distance_au` |
| `orbit_class.orbit_class_type` | `orbit_class_type` |
| `orbit_class.orbit_class_description` | `orbit_class_description` |
 
### 5.4 Exoplanet Archive (`ps` 테이블) → `exoplanet` / `host_star`
 
| NASA 필드 | DB 컬럼 | 테이블 |
|---|---|---|
| `pl_name` | `planet_name` | exoplanet |
| `hostname` | `name` | host_star |
| `sy_dist` | `distance_pc` | host_star |
| `pl_rade` | `radius_earth` | exoplanet |
| `pl_masse` | `mass_earth` | exoplanet |
| `pl_eqt` | `equilibrium_temp_k` | exoplanet |
| `pl_orbper` | `orbital_period_days` | exoplanet |
| `disc_year` | `discovery_year` | exoplanet |
| `discoverymethod` | `discovery_method` | exoplanet |
| `st_spectype` | `spectral_type` | host_star |
| `st_teff` | `temperature_k` | host_star |
| `st_rad` | `radius_solar` | host_star |
| `st_mass` | `mass_solar` | host_star |
| `st_met` | `metallicity` | host_star |
| `st_logg` | `surface_gravity` | host_star |
 
> **수집 순서 주의**: `host_star`를 먼저 저장(또는 조회)한 뒤 `exoplanet`을 저장해야 한다. FK가 걸려 있으므로 순서를 지키지 않으면 저장에 실패한다.
 
---
 
## 6. DDL (MariaDB)
 
> **중요**: 아래 DDL은 **구조 확인 및 문서화용**이다.
> 실제 테이블 생성은 **Django 마이그레이션(`python manage.py migrate`)으로 한다.**
> DDL을 손으로 실행하고 Django 모델도 만들면 두 정의가 어긋나서 반드시 문제가 생긴다.
> HeidiSQL은 **생성된 결과를 눈으로 확인하고 데이터를 조회하는 용도**로만 사용한다.
 
```sql
CREATE DATABASE IF NOT EXISTS cosmic_watch
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
 
USE cosmic_watch;
 
-- ============================================
-- 1. neo
-- ============================================
CREATE TABLE neo (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    nasa_id             VARCHAR(20)     NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    designation         VARCHAR(50)     NULL,
    absolute_magnitude  DECIMAL(6,3)    NULL,
    diameter_min_m      DECIMAL(14,4)   NULL,
    diameter_max_m      DECIMAL(14,4)   NULL,
    is_hazardous        BOOLEAN         NOT NULL DEFAULT FALSE,
    is_sentry_object    BOOLEAN         NOT NULL DEFAULT FALSE,
    jpl_url             VARCHAR(500)    NULL,
    created_at          DATETIME        NOT NULL,
    updated_at          DATETIME        NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_neo_nasa_id (nasa_id),
    KEY ix_neo_hazardous (is_hazardous)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 2. close_approach
-- ============================================
CREATE TABLE close_approach (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    neo_id                  BIGINT          NOT NULL,
    approach_date           DATE            NOT NULL,
    approach_datetime_utc   DATETIME        NOT NULL,
    velocity_km_s           DECIMAL(12,6)   NULL,
    velocity_km_h           DECIMAL(14,4)   NULL,
    miss_distance_km        DECIMAL(18,4)   NULL,
    miss_distance_au        DECIMAL(12,8)   NULL,
    orbiting_body           VARCHAR(30)     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ca_unique (neo_id, approach_datetime_utc, orbiting_body),
    KEY ix_ca_date (approach_date),
    KEY ix_ca_neo (neo_id),
    KEY ix_ca_distance (miss_distance_km),
    CONSTRAINT fk_ca_neo FOREIGN KEY (neo_id)
        REFERENCES neo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 3. orbital_data
-- ============================================
CREATE TABLE orbital_data (
    id                                  BIGINT          NOT NULL AUTO_INCREMENT,
    neo_id                              BIGINT          NOT NULL,
    orbit_id                            VARCHAR(30)     NULL,
    orbit_determination_datetime_utc    DATETIME        NULL,
    first_observation_date              DATE            NULL,
    last_observation_date               DATE            NULL,
    data_arc_days                       INT             NULL,
    observations_used                   INT             NULL,
    eccentricity                        DECIMAL(14,10)  NULL,
    semi_major_axis_au                  DECIMAL(14,10)  NULL,
    inclination_deg                     DECIMAL(12,8)   NULL,
    orbital_period_days                 DECIMAL(16,8)   NULL,
    perihelion_distance_au              DECIMAL(14,10)  NULL,
    aphelion_distance_au                DECIMAL(14,10)  NULL,
    orbit_class_type                    VARCHAR(10)     NULL,
    orbit_class_description             VARCHAR(255)    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_od_neo (neo_id),
    KEY ix_od_class (orbit_class_type),
    CONSTRAINT fk_od_neo FOREIGN KEY (neo_id)
        REFERENCES neo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 4. host_star
-- ============================================
CREATE TABLE host_star (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,
    distance_pc     DECIMAL(12,3)   NULL,
    spectral_type   VARCHAR(30)     NULL,
    temperature_k   DECIMAL(10,2)   NULL,
    radius_solar    DECIMAL(12,6)   NULL,
    mass_solar      DECIMAL(12,6)   NULL,
    metallicity     DECIMAL(10,5)   NULL,
    surface_gravity DECIMAL(10,5)   NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_hs_name (name),
    KEY ix_hs_distance (distance_pc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 5. exoplanet
-- ============================================
CREATE TABLE exoplanet (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    host_star_id        BIGINT          NOT NULL,
    planet_name         VARCHAR(100)    NOT NULL,
    radius_earth        DECIMAL(12,6)   NULL,
    mass_earth          DECIMAL(14,6)   NULL,
    equilibrium_temp_k  DECIMAL(10,2)   NULL,
    orbital_period_days DECIMAL(16,8)   NULL,
    discovery_year      SMALLINT        NULL,
    discovery_method    VARCHAR(50)     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ep_name (planet_name),
    KEY ix_ep_host (host_star_id),
    KEY ix_ep_radius (radius_earth),
    KEY ix_ep_mass (mass_earth),
    KEY ix_ep_year (discovery_year),
    KEY ix_ep_method (discovery_method),
    CONSTRAINT fk_ep_host FOREIGN KEY (host_star_id)
        REFERENCES host_star(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 6. neo_watchlist
-- ============================================
CREATE TABLE neo_watchlist (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    user_id     INT         NOT NULL,
    neo_id      BIGINT      NOT NULL,
    created_at  DATETIME    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_nw_user_neo (user_id, neo_id),
    CONSTRAINT fk_nw_user FOREIGN KEY (user_id)
        REFERENCES auth_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_nw_neo FOREIGN KEY (neo_id)
        REFERENCES neo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 7. exoplanet_watchlist
-- ============================================
CREATE TABLE exoplanet_watchlist (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    user_id         INT         NOT NULL,
    exoplanet_id    BIGINT      NOT NULL,
    created_at      DATETIME    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ew_user_ep (user_id, exoplanet_id),
    CONSTRAINT fk_ew_user FOREIGN KEY (user_id)
        REFERENCES auth_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_ew_ep FOREIGN KEY (exoplanet_id)
        REFERENCES exoplanet(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
-- ============================================
-- 8. neo_fetch_log
-- ============================================
CREATE TABLE neo_fetch_log (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    fetch_date      DATE        NOT NULL,
    fetched_at      DATETIME    NOT NULL,
    element_count   INT         NOT NULL DEFAULT 0,
    is_success      BOOLEAN     NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_nfl_date (fetch_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
 
---
 
## 7. Django 모델 정의
 
```python
# apps/astronomy/models.py
 
from django.db import models
from django.conf import settings
 
 
class Neo(models.Model):
    nasa_id            = models.CharField(max_length=20, unique=True)
    name               = models.CharField(max_length=100)
    designation        = models.CharField(max_length=50, null=True, blank=True)
    absolute_magnitude = models.DecimalField(max_digits=6, decimal_places=3,
                                             null=True, blank=True)
    diameter_min_m     = models.DecimalField(max_digits=14, decimal_places=4,
                                             null=True, blank=True)
    diameter_max_m     = models.DecimalField(max_digits=14, decimal_places=4,
                                             null=True, blank=True)
    is_hazardous       = models.BooleanField(default=False, db_index=True)
    is_sentry_object   = models.BooleanField(default=False)
    jpl_url            = models.URLField(max_length=500, null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)
 
    class Meta:
        db_table = 'neo'
 
    def __str__(self):
        return self.name
 
 
class CloseApproach(models.Model):
    neo                   = models.ForeignKey(Neo, on_delete=models.CASCADE,
                                              related_name='approaches')
    approach_date         = models.DateField(db_index=True)
    approach_datetime_utc = models.DateTimeField()
    velocity_km_s         = models.DecimalField(max_digits=12, decimal_places=6,
                                                null=True, blank=True)
    velocity_km_h         = models.DecimalField(max_digits=14, decimal_places=4,
                                                null=True, blank=True)
    miss_distance_km      = models.DecimalField(max_digits=18, decimal_places=4,
                                                null=True, blank=True, db_index=True)
    miss_distance_au      = models.DecimalField(max_digits=12, decimal_places=8,
                                                null=True, blank=True)
    orbiting_body         = models.CharField(max_length=30)
 
    class Meta:
        db_table = 'close_approach'
        constraints = [
            models.UniqueConstraint(
                fields=['neo', 'approach_datetime_utc', 'orbiting_body'],
                name='uk_ca_unique'
            )
        ]
 
 
class OrbitalData(models.Model):
    neo = models.OneToOneField(Neo, on_delete=models.CASCADE,
                               related_name='orbital_data')
    orbit_id                         = models.CharField(max_length=30, null=True, blank=True)
    orbit_determination_datetime_utc = models.DateTimeField(null=True, blank=True)
    first_observation_date           = models.DateField(null=True, blank=True)
    last_observation_date            = models.DateField(null=True, blank=True)
    data_arc_days                    = models.IntegerField(null=True, blank=True)
    observations_used                = models.IntegerField(null=True, blank=True)
    eccentricity                     = models.DecimalField(max_digits=14, decimal_places=10,
                                                           null=True, blank=True)
    semi_major_axis_au               = models.DecimalField(max_digits=14, decimal_places=10,
                                                           null=True, blank=True)
    inclination_deg                  = models.DecimalField(max_digits=12, decimal_places=8,
                                                           null=True, blank=True)
    orbital_period_days              = models.DecimalField(max_digits=16, decimal_places=8,
                                                           null=True, blank=True)
    perihelion_distance_au           = models.DecimalField(max_digits=14, decimal_places=10,
                                                           null=True, blank=True)
    aphelion_distance_au             = models.DecimalField(max_digits=14, decimal_places=10,
                                                           null=True, blank=True)
    orbit_class_type                 = models.CharField(max_length=10, null=True,
                                                        blank=True, db_index=True)
    orbit_class_description          = models.CharField(max_length=255, null=True, blank=True)
 
    class Meta:
        db_table = 'orbital_data'
 
 
class HostStar(models.Model):
    name            = models.CharField(max_length=100, unique=True)
    distance_pc     = models.DecimalField(max_digits=12, decimal_places=3,
                                          null=True, blank=True, db_index=True)
    spectral_type   = models.CharField(max_length=30, null=True, blank=True)
    temperature_k   = models.DecimalField(max_digits=10, decimal_places=2,
                                          null=True, blank=True)
    radius_solar    = models.DecimalField(max_digits=12, decimal_places=6,
                                          null=True, blank=True)
    mass_solar      = models.DecimalField(max_digits=12, decimal_places=6,
                                          null=True, blank=True)
    metallicity     = models.DecimalField(max_digits=10, decimal_places=5,
                                          null=True, blank=True)
    surface_gravity = models.DecimalField(max_digits=10, decimal_places=5,
                                          null=True, blank=True)
 
    class Meta:
        db_table = 'host_star'
 
    def __str__(self):
        return self.name
 
 
class Exoplanet(models.Model):
    host_star           = models.ForeignKey(HostStar, on_delete=models.CASCADE,
                                            related_name='planets')
    planet_name         = models.CharField(max_length=100, unique=True)
    radius_earth        = models.DecimalField(max_digits=12, decimal_places=6,
                                              null=True, blank=True, db_index=True)
    mass_earth          = models.DecimalField(max_digits=14, decimal_places=6,
                                              null=True, blank=True, db_index=True)
    equilibrium_temp_k  = models.DecimalField(max_digits=10, decimal_places=2,
                                              null=True, blank=True)
    orbital_period_days = models.DecimalField(max_digits=16, decimal_places=8,
                                              null=True, blank=True)
    discovery_year      = models.SmallIntegerField(null=True, blank=True, db_index=True)
    discovery_method    = models.CharField(max_length=50, null=True,
                                           blank=True, db_index=True)
 
    class Meta:
        db_table = 'exoplanet'
 
    def __str__(self):
        return self.planet_name
 
 
class NeoWatchlist(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL,
                                   on_delete=models.CASCADE,
                                   related_name='neo_watchlist')
    neo        = models.ForeignKey(Neo, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        db_table = 'neo_watchlist'
        constraints = [
            models.UniqueConstraint(fields=['user', 'neo'], name='uk_nw_user_neo')
        ]
 
 
class ExoplanetWatchlist(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL,
                                   on_delete=models.CASCADE,
                                   related_name='exoplanet_watchlist')
    exoplanet  = models.ForeignKey(Exoplanet, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        db_table = 'exoplanet_watchlist'
        constraints = [
            models.UniqueConstraint(fields=['user', 'exoplanet'], name='uk_ew_user_ep')
        ]
 
 
class NeoFetchLog(models.Model):
    fetch_date    = models.DateField(unique=True)
    fetched_at    = models.DateTimeField(auto_now_add=True)
    element_count = models.IntegerField(default=0)
    is_success    = models.BooleanField(default=True)
 
    class Meta:
        db_table = 'neo_fetch_log'
```
 
---
 
## 8. 검색 쿼리 예시 (Django ORM)
 
### 8.1 다중 조건 외계행성 검색
 
```python
def search_exoplanets(params):
    qs = Exoplanet.objects.select_related('host_star')
 
    if params.get('name'):
        qs = qs.filter(planet_name__icontains=params['name'])
 
    if params.get('radius_min'):
        qs = qs.filter(radius_earth__gte=params['radius_min'])
    if params.get('radius_max'):
        qs = qs.filter(radius_earth__lte=params['radius_max'])
 
    if params.get('mass_min'):
        qs = qs.filter(mass_earth__gte=params['mass_min'])
    if params.get('mass_max'):
        qs = qs.filter(mass_earth__lte=params['mass_max'])
 
    if params.get('distance_max_ly'):
        # 광년 → 파섹 변환 후 필터
        pc = params['distance_max_ly'] / 3.26156
        qs = qs.filter(host_star__distance_pc__lte=pc)
 
    if params.get('year_min'):
        qs = qs.filter(discovery_year__gte=params['year_min'])
 
    if params.get('method'):
        qs = qs.filter(discovery_method=params['method'])
 
    return qs.order_by('planet_name')
```
 
조건이 있으면 붙이고 없으면 건너뛴다. `QuerySet`은 실제로 평가되기 전까지 SQL을 실행하지 않으므로, 조건을 모두 조합한 뒤 **한 번만** DB에 요청한다.
 
> `select_related('host_star')`가 중요하다. 이게 없으면 목록 100건을 렌더링할 때 항성 정보를 가져오려고 쿼리가 100번 추가로 나간다(N+1 문제). JOIN 한 번으로 해결된다.
 
### 8.2 날짜별 NEO 대시보드 조회
 
```python
def get_neos_by_date(target_date):
    return CloseApproach.objects.filter(
        approach_date=target_date,
        orbiting_body='Earth'
    ).select_related('neo').order_by('miss_distance_km')
```
 
---
 
## 9. 다음 문서
 
```text
01 요구사항 + 기능명세서      ✅
        ↓
02 DB 설계서                 ✅ (본 문서)
        ↓
03 사용자 시나리오 + UI/UX   ← 다음
        ↓
04 API 명세서
        ↓
05 Django + React 실제 개발
```
