// PlanetSizePanel.tsx ─ 지구와 나란히 (행성끼리는 실제 비율)
// 반지름이 지구의 87배인 행성도 있다 → 큰 쪽 반지름이 MAX_R(px)을 넘지 않게 축척을 줄인다. 비율은 그대로.

import { Panel, PanelTitle } from "@/components/common/Panel";
import { dec2 } from "@/utils/format";

const EARTH_R = 70; // 기본 축척: 지구 반지름 = 70px
const MAX_R = 120;

function PlanetSizePanel({ radius, name }: { radius: number | null; name: string }) {
  const unit = radius === null ? EARTH_R : Math.min(EARTH_R, MAX_R / Math.max(1, radius));
  const earthR = unit;
  const planetR = radius === null ? null : radius * unit;
  return (
    <Panel>
      <PanelTitle title="지구와 나란히" sub="같은 축척 (행성끼리는 실제 비율)" />
      <div className="flex min-h-56 items-end justify-center gap-10">
        <Body r={earthR} label="지구" sub="1.00 × 지구" muted />
        {planetR === null ? <p className="text-sm text-dim">반지름이 측정되지 않았어요</p> : <Body r={planetR} label={name} sub={`${dec2(radius)} × 지구`} />}
      </div>
      {radius !== null && radius > 10 && <p className="mt-3 text-center text-xs text-dim">지구는 이 행성의 약 1/{Math.round(radius)} 크기예요.</p>}
    </Panel>
  );
}

function Body({ r, label, sub, muted = false }: { r: number; label: string; sub: string; muted?: boolean }) {
  const R = Math.max(1.5, r);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={R * 2 + 4} height={R * 2 + 4} aria-hidden>
        <circle
          cx={R + 2}
          cy={R + 2}
          r={R}
          fill={muted ? "var(--line)" : "var(--signal)"}
          fillOpacity={muted ? 1 : 0.25}
          stroke={muted ? "var(--dim)" : "var(--signal)"}
        />
      </svg>
      <div className="text-center">
        <div className="text-sm font-medium">{label}</div>
        <div className="font-mono text-xs text-dim">{sub}</div>
      </div>
    </div>
  );
}

export default PlanetSizePanel;
