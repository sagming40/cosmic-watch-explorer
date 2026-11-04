# DEVLOG M1 — M1 데이터 계층 (2026-08-25 ~ 08-31)

> **M1 기간의 날짜 블록을 줄 그대로 옮긴 문서다.** 고치지 않는다. 옛 문서 이름은 [대응표](README.md), 지금 기록은 [DEVLOG](../DEVLOG.md).

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

**이번 세션 커밋**
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

**이번 세션 커밋**
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

**이번 세션 커밋**
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

**이번 세션 커밋**
- `feat(M1): Neo 모델 정의`

**다음에 할 일**
- `CloseApproach` → `OrbitalData` → `HostStar` → `Exoplanet` → `NeoFetchLog` 순으로 이어서 작성, 그 다음 `apps/watchlist/models.py` (`NeoWatchlist`, `ExoplanetWatchlist`).

