# decisions — 결정 기록

> **"왜 이걸로?"를 결정 하나 = 파일 하나로 적는 폴더다.** 지난 결정은 고치지 않고, 뒤집으면 새 파일을 만들어 옛 파일 상태만 `대체됨 → NNNN`으로 바꾼다.
> 형식은 상태 · 날짜 / 맥락 / 결정 / 검토한 대안 / 감수할 것. 0002 ~ 0010은 2026-11-04 재정비 때 옛 문서 · DEVLOG `[설계]`에서 옮겼고 날짜는 결정한 날이다.

| 번호 | 결정 | 상태 |
|---|---|---|
| [0001](0001-docs-refactor.md) | 문서를 전역 문서 체계에 맞춰 재정비, 목업은 M6 끝에 | 확정 |
| [0002](0002-django-drf-mariadb.md) | 백엔드는 Django + DRF + MariaDB | 확정 |
| [0003](0003-session-cookie-auth.md) | 인증은 세션 쿠키 | 확정 |
| [0004](0004-lock-all-screens.md) | 화면 · 조회 API 전체를 로그인 뒤로 잠근다 | 확정 |
| [0005](0005-tailwind-shadcn.md) | Tailwind CSS v4 + shadcn/ui 지금 도입 | 확정 |
| [0006](0006-typescript.md) | 프론트엔드 TypeScript 전환 | 확정 |
| [0007](0007-main-only-branch.md) | 브랜치 · PR 없이 main 하나로 | 확정 |
| [0008](0008-jpl-cad-countdown.md) | 카운트다운 데이터는 JPL CAD에서 받는다 | 확정 |
| [0009](0009-deploy-platform.md) | 배포 위치 | 대기 (크레딧 결과) |
| [0010](0010-eclipse-calc-exception.md) | 일식 · 월식의 한국 가시성은 직접 계산을 허용 | 확정 (구현은 M7-3) |
