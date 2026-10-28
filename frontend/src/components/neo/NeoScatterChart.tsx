// NeoScatterChart.tsx ─ 거리 × 속도 산점도 (03 문서 6.1절 ─ 한 차트에 4개 변수)
// X: 접근 거리(LD, 로그) / Y: 상대속도 / 점 크기: 추정 직경 / 점 색·모양: PHA 여부 + 1 LD 안쪽은 고리
//
// 점 색은 스케일 바(1 LD 기준)와 다르게 PHA(is_hazardous) 기준이다 (10-27 결정).
// 산점도는 거리가 이미 X축이라, 색까지 거리로 칠하면 같은 정보를 두 번 그리는 셈이 된다.
// 대신 "1 LD 안쪽" 고리는 스케일 바와 같은 뜻으로 그대로 둔다 ─ 고리 = 달보다 가까움.

import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import type { NeoDashboardItem } from "@/types/api";

import ChartTooltip from "./ChartTooltip";
import { AXIS_TICK, LD_MAX, LD_MIN, toPoints, type ChartPoint } from "./chart";

interface NeoScatterChartProps {
  results: NeoDashboardItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}

// PHA 점은 삼각형 ─ 목록의 ⚠ 아이콘과 같은 모양, 색을 구분하기 어려운 사람도 모양으로 (03 문서 9장)
// size = 원의 반지름과 비슷한 크기로 보이게 꼭짓점까지 거리를 1.3배
function trianglePath(cx: number, cy: number, size: number): string {
  const R = size * 1.3;
  const dx = R * Math.cos(Math.PI / 6); // 아래 두 꼭짓점의 가로 거리
  return `M${cx},${cy - R} L${cx + dx},${cy + R / 2} L${cx - dx},${cy + R / 2} Z`;
}

function NeoScatterChart({ results, hoveredId, onHover }: NeoScatterChartProps) {
  // 속도를 모르는(null) 접근은 Y 위치를 정할 수 없어 뺀다 (0으로 그리면 "정지한 소행성"이라는 거짓 그림이 된다)
  const points = toPoints(
    results.filter((n) => n.approach.velocity_km_s !== null),
    (n) => n.approach.velocity_km_s as number,
  );
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
          <XAxis
            type="number"
            dataKey="x"
            scale="log"
            domain={[LD_MIN, LD_MAX]}
            ticks={[0.1, 1, 10, 100]}
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
              const base = Math.max(3, (width ?? 8) / 2);
              const active = payload.id === hoveredId;
              const r = active ? base + 2 : base;
              const color = payload.pha ? "var(--hazard)" : "var(--signal)";
              // 범위 밖(0.05 LD 미만·500 LD 초과)이라 끝에 붙여 그린 점은 속을 비운다 ─ 스케일 바·범례 "범위 밖 (끝에 표시)"와 같은 약속 (10-28 M5)
              const fillOpacity = payload.clamped ? 0 : active ? 0.9 : 0.45;
              return (
                <g onMouseEnter={() => onHover(payload.id)} onMouseLeave={() => onHover(null)}>
                  {/* 1 LD 안쪽 = 고리 (PHA 여부와 상관없이). 위험 표시라 hazard 색 */}
                  {payload.nearMoon && (
                    <circle cx={cx} cy={cy} r={(payload.pha ? r * 1.3 : r) + 5} fill="none" stroke="var(--hazard)" strokeWidth={1.5} />
                  )}
                  {payload.pha ? (
                    <path d={trianglePath(cx, cy, r)} fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth={1} strokeLinejoin="round" />
                  ) : (
                    <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={fillOpacity} stroke={color} strokeWidth={1} />
                  )}
                </g>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* 범례 ─ 스케일 바와 색 기준이 달라서 꼭 필요하다 */}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim" aria-label="산점도 범례">
        <li className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d={trianglePath(6, 7, 4)} fill="var(--hazard)" fillOpacity={0.7} stroke="var(--hazard)" />
          </svg>
          잠재적 위험 소행성(PHA)
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="4" fill="var(--signal)" fillOpacity={0.7} stroke="var(--signal)" />
          </svg>
          그 밖의 소행성
        </li>
        <li className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="2.5" fill="var(--dim)" />
            <circle cx="7" cy="7" r="6" fill="none" stroke="var(--hazard)" strokeWidth={1.5} />
          </svg>
          고리 = 달보다 가까움 (1 LD 안쪽)
        </li>
      </ul>
    </div>
  );
}

export default NeoScatterChart;
