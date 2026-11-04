# 0006. 프론트엔드 TypeScript 전환

- 상태: 확정
- 날짜: 2026-10-27

## 맥락

반복된 실수(`date`/`data` 혼동, `is_cashed` 같은 필드명 오타, `null` 처리 누락)가 전부 "실행해 봐야 아는" 종류였다. 백엔드가 NULL을 그대로 내려주는 설계(NASA 원본 보존)라 특히 효과가 크다. 목업을 새로 만들기 전이면 이중 작업이 없다.

## 결정

프론트 전부 `.ts` / `.tsx`, `strict: true`. API 응답 타입은 `src/types/api.ts` 한 곳에 둔다. 규칙은 CLAUDE.md 3.5절.

## 검토한 대안

- **JS 유지 + JSDoc**: 빌드에서 막히지 않아 같은 실수가 계속 실행 때 드러난다.
- **TypeScript 최신 7.0**: `typescript-eslint`가 `<6.1`까지만 지원해 `~6.0.x`로 고정했다.

## 감수할 것

serializer를 바꾸면 `types/api.ts`도 손으로 같이 고쳐야 한다.
