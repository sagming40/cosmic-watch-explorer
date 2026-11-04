# archive — 옛 문서 보관함

> **지금은 쓰지 않지만 남겨 두는 문서**를 모은 폴더다. 보관만 하고 고치지 않는다.
> 지금 문서는 [CLAUDE.md](../../CLAUDE.md) 3.1절 "문서 지도", 진행 상황은 [PLAN](../PLAN.md).

## 개발 일지 — 끝난 단계

마일스톤이 끝나면 그 기간의 [DEVLOG](../DEVLOG.md) 날짜 블록을 여기로 옮긴다. 줄을 그대로 옮기고 머리말만 붙였다.

| 파일 | 단계 | 기간 |
|---|---|---|
| [DEVLOG_M0.md](DEVLOG_M0.md) | M0 개발 환경 (옛 DEVLOG 머리말 · 환경 요약 포함) | 2026-08-24 |
| [DEVLOG_M1.md](DEVLOG_M1.md) | M1 데이터 계층 | 2026-08-25 ~ 08-31 |
| [DEVLOG_M2.md](DEVLOG_M2.md) | M2 백엔드 완성 | 2026-08-31 ~ 09-09 |
| [DEVLOG_M3.md](DEVLOG_M3.md) | M3 프론트 기반 (앞부분) | 2026-09-10 ~ 09-14 |
| [DEVLOG_M4.md](DEVLOG_M4.md) | M3 마무리 ~ M4 v1.0 (10-27 한 블록) | 2026-10-27 |

M5는 10-28 블록 하나에 M4 끝 · M5 · M6 시작이 같이 있어서, 뒤 단계인 M6가 끝날 때 `DEVLOG_M6.md`로 함께 옮긴다.

## 옛 문서

| 파일 | 무엇 |
|---|---|
| [PLAN_M0_M5.md](PLAN_M0_M5.md) | 끝난 마일스톤 M0 ~ M5의 작업 · 완료 기준 · 실측, MVP 완료 기준 19개와 대조 결과 |
| [API_SPEC_old.md](API_SPEC_old.md) | 옛 `04_api_specification.md` 전체. 엔드포인트별 요청 · 응답 예시는 여기 있다 (2026-11-04 시점, 더 고치지 않는다) |
| [CHANGELOG_old_docs.md](CHANGELOG_old_docs.md) | 옛 문서 01 ~ 05의 머리 표와 변경 이력 |

## 옛 문서 이름 대응표

옛 기록은 고치지 않으므로 당시 이름이 그대로 남아 있다. 2026-11-04에 문서를 재정비하면서 이름이 바뀌었다 ([decisions/0001](../decisions/0001-docs-refactor.md)).

| 옛 이름 | 옛 파일 | 지금 |
|---|---|---|
| `01 문서` | `01_requirements_and_features.md` | [REQUIREMENTS](../REQUIREMENTS.md) (1 ~ 7장 번호 그대로). 3.3절 유즈케이스 · 8 · 10장은 뺐다. 9장 MVP 완료 기준 → [PLAN_M0_M5](PLAN_M0_M5.md) |
| `02 문서` | `02_database_design.md` | [DATA_MODEL](../DATA_MODEL.md) (1 ~ 5장 번호 그대로). 컬럼 표 · 필드 매핑 · 6장 DDL · 7장 모델 · 8장 ORM 예시는 뺐다 → `backend/apps/*/models.py`, `migrations/`, `services/`, `filters.py` |
| `03 문서` | `03_user_scenarios_and_uiux.md` | [DESIGN](../DESIGN.md) (1 ~ 9장 번호 그대로, `6.x` → 6.5). 10 ~ 12장은 뺐다 |
| `04 문서` | `04_api_specification.md` | 아래 표 |
| `05 문서` | `05_milestones.md` | [PLAN](../PLAN.md) (1 · 2 · 9 ~ 12장 번호 그대로). 3 ~ 8장 → [PLAN_M0_M5](PLAN_M0_M5.md) |

| `04 문서` | 지금 |
|---|---|
| 1.1 ~ 1.5 공통 규약 | [ARCHITECTURE](../ARCHITECTURE.md) 3.1 ~ 3.5 |
| 2.1 ~ 2.3 세션 · CSRF · CORS | [ARCHITECTURE](../ARCHITECTURE.md) 2.1 ~ 2.3 |
| 3 ~ 10장 | [API_SPEC_old](API_SPEC_old.md) 같은 번호. 왜 그렇게 정했는지는 [ARCHITECTURE](../ARCHITECTURE.md) 4장 |

재정비 직전 문서 전체는 커밋 `799cb24`에서 볼 수 있다.
