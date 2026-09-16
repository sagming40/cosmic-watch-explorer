// NeoDashboardPage.jsx ─ Path = '/'
// 비유: '/' 경로의 빈 도화지 → 추후 DateNavigator·NeoSummary·NeoListItem 배치 예정

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../api/client";

import NeoSummary from "../components/neo/NeoSummary";

// ──────────────────────────────────────────────────────────────
// Date 객체 → 'YYYY-MM-DD' 문자열
//
// ⚠️ toISOSrting()을 사용하면 안된다.
// toISOString()은 무조건 UTC(런던 시각) 기준으로 변환한다.
// 우리나라는 UTC+9라서 '한국 시각 새벽 2시'는 'UTC 전날 17시' 이다.
// 즉, 아침 9시에 접속을 하면 화면에 어제 날짜가 뜨는 버그가 된다.
// 벽시계를 볼 때 런던 시계를 보는게 아니라 내 방 시계를 보는 것
// ──────────────────────────────────────────────────────────────
function formatDate(dateObj) {
  const yyyy = dateObj.getFullYear();
  //getMonth()는 0부터 시작한다. (0 = 1월) 사람이 읽는 달로 변환하려면 +1
  // padStart(2, "0") = 한 자리면 앞에 0을 채운다. ("9" → "09")
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function NeoDashboardPage() {
  // ── 조회 날짜는 URL 주소창에 둔다 ──
  // useSearchParams는 useState와 사용하는 모양이 거의 같은데,
  // 값이 저장되는 곳이 컴포넌트 머릿속이 아니라 '주소창'이라는 점만 다르다.
  // 머릿속 메모(useState)는 새로고침을 하면 사라지지만, 주소창에 적힌 건 남는다.
  const [searchParams, setSearchParams] = useSearchParams();

  // 주소에 ?date=...가 없으면 오늘 날짜를 기본으로 사용한다.
  // 주소를 실제로 바꾸지는 않는다 ─ 경로가 "/" 여도 오늘이 보이면 되는거니까
  const date = searchParams.get("date") ?? formatDate(new Date());

  // ─── 화면 상태 3종 ───
  // 외부 API에 의존하는 화면은 항상 "로딩 중" / "성공" / "실패" 3가지 이다.
  // 이 세 화면을 처음부터 분리해두지 않으면 코드가 엉킨다. (if문, 문서 03 ─ 7장)
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─────────────────────────────────────────────────────────────────
  // useEffect = "화면이 그려진 뒤에 할 일"을 예약하는 자리
  //
  // React는 화면을 그리는 작업이 본업이다. 서버 호출 같은 일은 본업 이외의
  // 일이기 때문에 후순위로 미룬다. 미뤄둔 작업들을 useEffect에 적어둔다.
  //
  // 두 번째 인자 [date] = "값이 바뀌면 실행해달라"는 조건표
  // 비워두면(=[]) 최초 1회만, 아예 선언하지 않을 경우 "무한 호출 지옥"에 빠진다.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // ignore = "주문이 이미 취소되었습니다."
    //
    // 날짜 화살표를 빠르게 세번 누르면 요청 3개가 동시에 날아간다.
    // 하지만 network는 보낸 순서대로 도착한다는 보장이 없다.
    // 따라서, 취소된 주문에는 표식(ignore)을 달아두고, 도착하더라도 받지 않는다.
    let ignore = false;

    setIsLoading(true);
    setError(null);

    // params 옵션을 사용할 경우 axios가 자동으로 ?date=2026-09-15를 붙여준다.
    // 직접 문자열을 이어붙이지 않는 이유: 값에 공백이나 한글이 섞일 경우,
    // URL Encoding을 손으로 해줘야 하는데, 이 작업을 자동으로 해주는 옵션이다.
    api
      .get("/neo/", { params: { date } })
      .then((res) => {
        if (ignore) return;   // 취소된 주문일 경우 폐기한다.
        setData(res.data);
      })
      .catch((err) => {
        if (ignore) return;
        // client.js의 interceptor가 이미 { code, message, status } 모양으로
        // 빚어서 넘겨준 상태이다. 그대로 담기만 하면 된다.
        setError(err);
      })
      .finally(() => {
        if (ignore) return;
        setIsLoading(false);
      });
    
    // return하는 함수 = "정리(cleanup) 담당"
    // date가 바뀌어 이 effect를 다시 돌리기 직전, 또는 화면을 떠날 때 실행된다.
    return () => {
      ignore = true;
    }; 
  }, [date]);

  // ─── 세 화면을 순차적으로 처리 ───
  // Loading/Error를 먼저 걸러내고 나면, 아래쪽 코드는
  // "data가 반드시 존재한다"라고 믿고 사용할 수 있다. 조건문이 깔끔해지는 요령.
  if (isLoading) {
    return <p>불러오는 중...</p>;
  }

  if (error) {
    return (
      <p>
        {error.message} (code: {error.code})
      </p>
    );
  }

  return (
    <div>
      <h1>지구 근접 소행성</h1>
      <p>조회 날짜: {date}</p>
      <NeoSummary summary={data.summary} />

      {/* 원본 JSON ─ 개발 중 확인용. */}
      <details>
        {/* 1단계 ─ '길이 뚫렸는지만' 확인하는 단계
            JSON.stringify(값, null, 2) = 들여쓰기 2칸으로 보기 좋게 펼치기
            <pre>는 줄바꿈·공백을 그대로 보존하는 Tag라 JSON 확인에 딱 알맞다.
            이 block은 2단계에서 NeoListItem으로 통째로 교체된다. */}
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>
          {JSON.stringify(data, null, 2)}
        </pre> 
      </details>   
    </div>
  );
}

export default NeoDashboardPage;
