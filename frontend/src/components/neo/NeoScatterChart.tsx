// NeoScatterChart.tsx ─ 거리 × 속도 산점도 (03 문서 6.1절 ─ 한 차트에 4개 변수)
// X: 접근 거리(LD, 로그) / Y: 상대속도 / 점 크기: 추정 직경 / 점 색: 1 LD 안쪽 여부

import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { NeoDashboardItem } from "@/types/api";

import ChartTooltip from "./ChartTooltip";
import { AXIS_TICK, LD_MAX, LD_MIN, toPoints, type ChartPoint } from "./chart";

interface NeoScatterChartProps {
  results: NeoDashboardItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

function NeoScatterChart({ results, hoveredId, onHover }: NeoScatterChartProps) {
  // 속도를 모르는(null) 접근은 Y 위치를 정할 수 없어 뺀다 (0으로 그리면 "정지한 소행성"이라는 거짓 그림이 된다)
  const points = toPoints(
    results.filter((n) => n.approach.velocity_km_s !== null),
    (n) => n.approach.velocity_km_s as number,
  );
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="x"
          scale="log"
          domain={[LD_MIN, LD_MAX]}
          ticks={[0.1, 1, 10, 100]}
          allowDataOverflow
          interval={0}
          stroke="var(--line)"
          tick={AXIS_TICK}
          tickLine={false}
        />
        <YAxis type="number" dataKey="y" stroke="var(--line)" tick={AXIS_TICK} tickLine={false} width={44} />
        <ZAxis type="number" dataKey="size" range={[30, 420]} />
        <ReferenceLine x={1} stroke="var(--dim)" strokeDasharray="4 4" />
        <Tooltip content={<ChartTooltip />} cursor={false} isAnimationActive={false} />
        <Scatter
          data={points}
          isAnimationActive={false}
          shape={(props: unknown) => {
            const { cx, cy, payload, width } = props as { cx: number; cy: number; payload: ChartPoint; width?: number };
            const r = Math.max(3, (width ?? 8) / 2);
            const color = payload.nearMoon ? "var(--hazard)" : "var(--signal)";
            const active = payload.id === hoveredId;
            return (
              <g onMouseEnter={() => onHover(payload.id)} onMouseLeave={() => onHover(null)}>
                {/* 스케일 바와 같은 규칙 ─ 1 LD 안쪽은 바깥 고리로도 구분 */}
                {payload.nearMoon && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={color} strokeWidth={1.5} />}
                <circle cx={cx} cy={cy} r={active ? r + 2 : r} fill={color} fillOpacity={active ? 0.9 : 0.45} stroke={color} strokeWidth={1} />
              </g>
            );
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default NeoScatterChart;
