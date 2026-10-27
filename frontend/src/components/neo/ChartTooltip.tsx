// 차트 점에 마우스를 올리면 뜨는 말풍선 ─ Recharts가 { active, payload }를 넘겨준다.

import { dec2 } from "@/utils/format";
import type { ChartPoint } from "./chart";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
      <div className="font-medium">{p.name}</div>
      {/* 점 위치는 가둔 값(x)이지만, 말풍선에는 진짜 거리를 보여준다 */}
      <div className="font-mono text-dim">{dec2(p.ld)} LD</div>
    </div>
  );
}

export default ChartTooltip;
