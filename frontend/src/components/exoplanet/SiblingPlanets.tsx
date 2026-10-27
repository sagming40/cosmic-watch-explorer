// SiblingPlanets.tsx ─ 같은 별을 도는 다른 행성 (04 문서 6.2절 sibling_planets)
// "이 별에는 다른 행성도 있구나" → 눌러서 바로 이동. 원 크기는 반지름 비율(같은 계 안에서 가장 큰 행성 기준).
// 반지름이 측정되지 않은 행성은 점선 + "—"

import { Link } from "react-router";
import { Panel, PanelTitle } from "@/components/common/Panel";
import { cn } from "@/lib/utils";
import type { SiblingPlanet } from "@/types/api";
import { DASH, dec2 } from "@/utils/format";

const MAX_R = 36; // 가장 큰 행성 = 반지름 36px
const UNKNOWN_R = 12;

function SiblingPlanets({ current, siblings, starName }: { current: SiblingPlanet; siblings: SiblingPlanet[]; starName: string }) {
  if (siblings.length === 0) {
    return (
      <Panel>
        <PanelTitle title="같은 별의 다른 행성" />
        <p className="text-sm text-dim">{starName}에서 지금까지 발견된 행성은 이 하나뿐이에요.</p>
      </Panel>
    );
  }
  const all = [current, ...siblings];
  const largest = Math.max(...all.map((p) => p.radius_earth ?? 0));
  const unit = largest > 0 ? MAX_R / largest : 0;
  return (
    <Panel>
      <PanelTitle title={`${starName}의 다른 행성 ${siblings.length}개`} sub="원 크기는 반지름 비율. 점선은 반지름이 측정되지 않은 행성" />
      <div className="flex flex-wrap items-end gap-6">
        {all.map((p) => (
          <Dot key={p.id} planet={p} r={p.radius_earth === null ? UNKNOWN_R : Math.max(2, p.radius_earth * unit)} current={p.id === current.id} />
        ))}
      </div>
    </Panel>
  );
}

function Dot({ planet, r, current }: { planet: SiblingPlanet; r: number; current: boolean }) {
  const unknown = planet.radius_earth === null;
  const body = (
    <>
      <svg width={r * 2 + 6} height={r * 2 + 6} aria-hidden>
        <circle
          cx={r + 3}
          cy={r + 3}
          r={r}
          fill={unknown ? "none" : current ? "var(--signal)" : "var(--line)"}
          fillOpacity={current ? 0.35 : 1}
          stroke={current ? "var(--signal)" : "var(--dim)"}
          strokeDasharray={unknown ? "3 3" : undefined}
          className={current ? undefined : "transition-colors group-hover:stroke-bone"}
        />
      </svg>
      <div className="max-w-28 text-center">
        <div className={cn("truncate text-sm", current ? "font-semibold text-signal" : "text-bone")}>{planet.planet_name}</div>
        <div className="font-mono text-xs text-dim">{unknown ? DASH : `${dec2(planet.radius_earth)} × 지구`}</div>
      </div>
    </>
  );
  // 지금 보고 있는 행성은 링크가 아니다
  return current ? (
    <div className="flex flex-col items-center gap-2" aria-current="page">
      {body}
    </div>
  ) : (
    <Link to={`/exoplanets/${planet.id}`} className="group flex flex-col items-center gap-2">
      {body}
    </Link>
  );
}

export default SiblingPlanets;
