// LunaDistanceBar.jsx ─ "COSMIC WATCH의 시그니쳐"
// 비유: 자(ruler) 위에 오늘 지나간 소행성들을 점으로 콕콕 찍어 두는 것
// 단, 이 자는 눈금이 등 간격이 아니라 "몇 배 차이나는가"로 벌어지는 로그 자(ruler)다.

import { ldToPercent } from "../../utils/scale";

// 03 문서 3장: 1 LD 안쪽으로 들어온 접근만 --hazard로 표시한다.
// ⚠️주의⚠️ ─ NeoListItem의 is_hazardous(NASA의 PHA 분류)와 다른 기준이다.
// 즉, "오늘 실제로 얼마나 가까이 왔는가"만 보는 것이다.
const HAZARD_THRESHOLD_LD = 1;

function LunarDistanceBar({ results }) {
  return (
    <div className="lunar-distance-bar">
      {/* 눈금 라벨 ─ 0.1 / 1 / 10 / 100 LD, 각자 로그 위치에 맟춰 배치 */}
      <div className="lunar-distance-bar-labels">
        {[0.1, 1, 10, 100].map((tick) => (
          <span
            key={tick}
            className="lunar-distance-bar-tick-label"
            style={{ left: `${ldToPercent(tick)}%` }}
          >
            {tick} LD
          </span>    
        ))}
      </div>  

      {/* 막대 본체 */}
      <div className="lunar-distance-bar-track">
        {/* 1 LD 고정 기준선 ─ "달 궤도" 표시. 다른 점들과 달리 데이터 유무와 상관없이 항상 그 자리에 그려진다. */}
        <div
          className="lunar-distance-bar-moon-line"
          style={{ left: `${ldToPercent(1)}%` }}
        />  
      </div>
    </div>
  )  
}
