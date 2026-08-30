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
| 마지막 완료 마일스톤 | **M0 — 개발 환경 구성 ✅** |
| 다음 작업 | M1 진행 중 — `apps/astronomy/services/exoplanet_archive.py` 작성 시작 (TAP_URL, TAP_QUERY 상수까지 안내받음, 타이핑 전 세션 종료) |
| 최근 병합 커밋 | `feat(M1): NASA NeoWs Feed API 수집 서비스 구현` |

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

---

## 기록

<!-- 최신 항목을 위에 추가한다 -->

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
