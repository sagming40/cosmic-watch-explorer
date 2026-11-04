# 0002. 백엔드는 Django + DRF + MariaDB

- 상태: 확정
- 날짜: 2026-08-21

## 맥락

외계행성 다중 조건 검색(9개 조건 조합)이 이 서비스의 핵심 기능이고, 혼자 만드는 학습 · 포트폴리오 프로젝트라 관리자 화면까지 만들 여유가 없었다.

## 결정

Django + Django REST Framework + MariaDB. 프론트는 React(이후 TypeScript, Vite), 차트는 Recharts.

- **Django**: 조건을 붙였다 뗐다 하는 검색에 ORM 표현력이 좋다. Django Admin으로 관리자 페이지 개발 비용을 없앤다.
- **Recharts**: React 컴포넌트 형태라 JSX 안에서 바로 쓴다.

## 검토한 대안

- **D3**: 강력하지만 SVG를 직접 다뤄야 해서 학습 비용이 크다.
- **검색에 django-filter**: 넣어 두었지만 쓰지 않고 `filters.py`에 직접 작성했다. "모르는 파라미터는 무시, 틀린 값은 400"을 구분해서 처리하려고.

## 감수할 것

Django와 React를 동시에 처음 다룬다. 그래서 백엔드를 M2에서 먼저 끝내 "백엔드는 확실히 정상"이라는 기준선을 두고 프론트를 시작했다.
