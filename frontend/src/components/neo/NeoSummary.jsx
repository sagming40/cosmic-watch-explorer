// NeoSummary.jsx ─ NEO 대시보드 상단 요약 4칸
// 비유: 식당 입구의 "오늘의 매출 현황판" ─ 식당 안까지 들어가지 않아도
// 식당 앞에 붙어있는 현황판만 보면 오늘의 상황을 한눈에 확인할 수 있다.

import DataField from "../common/DataField";

// Summary 객체 하나를 받아와서 4칸으로 펼쳐 보여준다.
// 값을 직접 계산하지 않는 이유: 04_api_specification.md 5.1절
// "요약과 목록은 완전히 같은 데이터에서, 서버가 미리 계산해 보내준다." 고 정해둠.
// FE 단에서는 내려준 데이터를 배치만 한다.
function NeoSummary({ summary }) {
  const {
    total_count,
    hazardous_count,
    closest_ld,
    closest_km,
    largest_diameter_m,
    largest_diameter_name,
  } = summary;
  
  return (
    <div className="neo-summary">
      {/* 1칸 ─ 접근 건수: 값이 하나뿐이라 DataField 한 번으로 끝 */}
      <DataField label="접근 건수" value={total_count} />

      {/* 2칸 ─ 위헙 분류: 값 하나 */}
      <DataField label="위험 분류" value={hazardous_count} />

      {/* 3칸 ─ 최근접 거리: LD (큰 글씨) + km(보조 정보) 두 줄
          DataField를 세로로 두 번 겹쳐서 "위 칸/아래 칸" 구조를 만든다.
          아래 칸엔 label을 주지 않는 대신 CSS로 작게(--dim 색) 표시한다. */}
      <div className="neo-summary-cell">
        <DataField label="최근접 거리" value={closest_ld} unit="LD" />
        <DataField value={closest_km?.toLocaleString()} unit="km" layout="inline" />
      </div>      

      {/* 4칸 ─ 최대 추정 직경: m(큰 글씨) + 이름(보조 정보) */}
      <div className="neo-summary-cell">
        <DataField label="최대 추정 직경" value={largest_diameter_m} unit="m" />
        <DataField value={largest_diameter_name} layout="inline" />
      </div>
    </div>
  );
}

export default NeoSummary;
