// NeoListItem.jsx ─ 목록 카드 한 장
// 비유: 붕어빵 틀 하나 NeoDashboardPage가 result 배열을 .map()으로
// 돌리면서 이 틀에 소행성 데이터를 하나씩 넣어 카드를 찍어낸다.

import DataField from "../common/DataField";

// 267.0269 / 597.0902 → "267 ~ 597" 로 합치는 지역 함수
// 현재는 이 components에서만 사용되지만, NeoDetail에서 같은 format이 필요해진다면
// 그 때, src/utils/format.js로 이동시킨다.
// "한 번 사용할때 이리 공용화 하지 않는다" 
// ─ 두 번째로 필요해지는 순간이 실제 공용 util이 맞는지 판단할 수 있는 시점이기 때문
function formatDiameterRange(minM, maxM) {
  // Math.round: 소수점 아래를 반올림 해서 Integer로.
  // "267.0269 m"보다 "267 m"이 훨씬 읽기 편하다.
  return `${Math.round(minM)} ~ ${Math.round(maxM)}`;  
}

function NeoListItem({ neo }) {
  const { name, is_hazardous, diameter_min_m, diameter_max_m, approach } = neo;  
  const { miss_distance_ld, miss_distance_km, velocity_km_s } = approach;  

  return (
    <div className="neo-list-item">
      <div className="neo-list-item-header">
        {/* 위험할 때만 ⚠️ 아이콘 노출. --hazard 색은 이 용도 전용이라는
            규칙(03 문서 2.1절)을 지키기 위해 안전한 항목에는 아예 렌더링 하지 않음 */}
        <span className="neo-list-item-name">
          {is_hazardous && (<span className="neo-list-item-hazard-icon">{"\u26A0\uFE0E"}</span>)}
          {name}  
        </span> 

        <div className="neo-list-item-distance">
          <DataField value={miss_distance_ld} unit="LD" layout="inline" />
        </div>   
      </div>  

      <div className="neo-list-item-sub">
        <span className="neo-list-item-distance-km">
          {miss_distance_km?.toLocaleString()} km  
        </span>
      </div>

      <div className="neo-list-item-details">
        <DataField
          label="추정 직경"
          value={formatDiameterRange(diameter_min_m, diameter_max_m)}
          unit="m"
          layout="inline"
        />
        <DataField label="상대속도" value={velocity_km_s} unit="km/s" layout="inline" />  
      </div>
    </div>
  );
}

export default NeoListItem;
