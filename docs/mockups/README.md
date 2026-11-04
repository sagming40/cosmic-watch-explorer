# mockups — 화면 그림

> **화면 그림을 모아 두는 폴더다.** 규격과 색의 단일 출처는 [DESIGN](../DESIGN.md)이고, 목업은 그 결정을 보여 주는 참고 자료다.
> 진행 상황은 [PLAN](../PLAN.md).

## 지금 상태

아직 파일이 없다. **지금 화면 기준 목업은 M6의 맨 마지막 작업으로 만든다**([PLAN](../PLAN.md) 9장, [decisions/0001](../decisions/0001-docs-refactor.md)). 그때까지 화면 기준은 DESIGN과 구현이다.

M7부터 새로 생기는 화면(일식 · 월식 메뉴 등)은 구현 전에 여기서 그림으로 먼저 정한다.

## 만들 때 규칙

전역 "문서 체계" 절 mockups 항목대로 한다. 로컬 HTML, 화면 하나 = 파일 하나(`화면.기기.html`), 공용 값은 `shared.js` · `shared.css`, 주소 파라미터로 상태 전환, 예시 데이터는 지어낸다. 파일이 생기면 여기에 보는 방법과 파일 표(파일 · DESIGN 절 · 채택 날짜)를 적는다.

## 옛 자료

옮겨 오지 않았다. 지금 구현과 다른 옛 안이고, 구현이 기준이다.

| 무엇 | 어디 | 메모 |
|---|---|---|
| Figma 목업 7화면 | [cosmic-watch-explorer (Figma)](https://www.figma.com/design/vGgPqDdYg7LPX4vG8eSx95/cosmic-watch-explorer?node-id=3-2) | 2026-09. 색 C 그래파이트 확정 전, 토큰을 Figma 변수로 연결 |
| 코드 목업 8화면 · 색 시안 6종 | 커밋 `8559628^`의 `frontend/src/mockup/` | 2026-10-27. 하단 막대와 `?screen=`으로 전환했다. 지금 앱에 없고 git에서 꺼내 볼 수 있다 |
