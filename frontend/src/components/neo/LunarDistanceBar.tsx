// LunarDistanceBar.tsx ─ "COSMIC WATCH의 시그니처" 달 거리 스케일 (03 문서 3장)
// 비유: 자(ruler) 위에 오늘 지나간 소행성들을 점으로 콕콕 찍어 두는 것.
// 단, 이 자는 눈금이 등 간격이 아니라 "몇 배 차이나는가"로 벌어지는 로그 자다.
//
// Recharts ScatterChart를 1차원 자로 쓴다 ─ y를 전부 0으로 두면 점이 가로 한 줄에만 찍힌다.

import { ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { NeoDashboardItem } from "@/types/api";

import ChartTooltip from "./ChartTooltip";
import { AXIS_TICK, LD_MAX, LD_MIN, toPoints, type ChartPoint } from "./chart";

interface LunarDistanceBarProps {
  results: NeoDashboardItem[];
  hoveredId: string | null; // 목록 ↔ 차트 연결: 목록에 마우스를 올린 소행성
  onHover: (id: string | null) => void;
}

function LunarDistanceBar({ results, hoveredId, onHover }: LunarDistanceBarProps) {
  const points = toPoints(results, () => 0);
  return (
    <ResponsiveContainer width="100%" height={96}>
      <ScatterChart margin={{ top: 24, right: 32, bottom: 4, left: 24 }}>
        <XAxis
          type="number"
          dataKey="x"
          scale="log"
          domain={[LD_MIN, LD_MAX]}
          ticks={[0.1, 1, 10, 100, 500]}
          interval={0} // 겹친다고 첫 눈금(0.1 LD)을 숨기지 않게
          // allowDataOverflow는 쓰지 않는다 ─ 켜면 그래프 영역 밖을 잘라내서, 0.1 LD 끝에 붙은 점이 반쯤 잘린다.
          // 범위 밖 값은 이미 clampLd()로 가둬서 넘기므로 넘칠 일이 없다.
          tickFormatter={(v: number) => `${v} LD`}
          stroke="var(--line)"
          tick={AXIS_TICK}
          tickLine={false}
        />
        <YAxis type="number" dataKey="y" domain={[-1, 1]} hide />
        {/* 1 LD 고정 기준선 ─ "달 궤도". 데이터 유무와 상관없이 항상 그 자리에 */}
        <ReferenceLine
          x={1}
          stroke="var(--dim)"
          strokeDasharray="4 4"
          label={{ value: "달 궤도", position: "top", fill: "var(--dim)", fontSize: 11 }}
        />
        {/* 애니메이션을 끄는 이유 ─ 말풍선·점이 날아다니면 시선이 분산된다 */}
        <Tooltip content={<ChartTooltip />} cursor={false} isAnimationActive={false} />
        <Scatter
          data={points}
          isAnimationActive={false}
          shape={(props: unknown) => {
            const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartPoint };
            const color = payload.nearMoon ? "var(--hazard)" : "var(--signal)";
            const active = payload.id === hoveredId;
            const r = active ? 8 : 5.5;
            return (
              <g onMouseEnter={() => onHover(payload.id)} onMouseLeave={() => onHover(null)}>
                {/* 1 LD 안쪽 점은 바깥 고리를 하나 더 ─ 색을 구분하기 어려운 사람도 모양으로 (03 문서 9장) */}
                {payload.nearMoon && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={color} strokeWidth={1.5} />}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  // 범위 밖이라 끝에 붙인 점은 속이 빈 원 ─ "실제로는 이보다 더 멀다"
                  fill={payload.clamped ? "none" : color}
                  fillOpacity={active ? 1 : 0.85}
                  stroke={color}
                  strokeWidth={payload.clamped ? 1.5 : active ? 3 : 0}
                  strokeOpacity={payload.clamped ? 1 : 0.35}
                />
              </g>
            );
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default LunarDistanceBar;
