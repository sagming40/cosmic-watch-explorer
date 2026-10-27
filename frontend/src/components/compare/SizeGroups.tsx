// SizeGroups.tsx ─ 크기 비교 그림 두 덩어리 (03 문서 6.4절)
// - PlanetGroup: 지구 + 외계행성. 서로 실제 비율. 큰 행성(지구의 87배도 있다)이 있으면 칸에 맞춰 축척을 줄인다
// - AsteroidGroup: 소행성끼리 실제 비율. 안쪽 원 = 최솟값, 바깥 점선 원 = 최댓값 (불확실성 자체를 그린다)
// 크기를 모르는 천체는 점선 원 + "크기 미측정" ─ 축척 계산에서도 뺀다 (0으로 그리지 않는다)

import type { ReactNode } from "react";
import { Link } from "react-router";

import type { AsteroidTarget, PlanetTarget } from "@/components/compare/types";
import { asteroidSized } from "@/components/compare/types";
import { DASH, dec2, diameterRange } from "@/utils/format";

const EARTH_R = 48; // 기본 축척: 지구 반지름 = 48px
const PLANET_MAX_R = 110; // 행성 원의 최대 반지름
const ASTEROID_MAX_D = 96; // 가장 큰 소행성(최댓값) 지름 = 96px
const UNKNOWN_R = 20;

export function PlanetGroup({ planets }: { planets: PlanetTarget[] }) {
  const largest = Math.max(1, ...planets.map((p) => p.radiusEarth ?? 0));
  const unit = Math.min(EARTH_R, PLANET_MAX_R / largest);
  return (
    <div className="min-w-0 lg:flex-1">
      <GroupTitle title="행성 · 실제 비율" note={unit < EARTH_R ? "큰 행성에 맞춰 축척을 줄였어요" : undefined} />
      <div className="flex items-end gap-6 overflow-x-auto pb-1">
        <Disc r={unit} caption={<Caption name="지구" sub="1.00 × 지구" />} earth />
        {planets.map((p) =>
          p.radiusEarth === null ? (
            <Disc key={p.id} r={UNKNOWN_R} caption={<Caption name={p.name} to={`/exoplanets/${p.id}`} sub="크기 미측정" />} unknown />
          ) : (
            <Disc key={p.id} r={p.radiusEarth * unit} caption={<Caption name={p.name} to={`/exoplanets/${p.id}`} sub={`${dec2(p.radiusEarth)} × 지구`} />} />
          ),
        )}
        {planets.length === 0 && <p className="self-center text-sm text-dim">외계행성을 추가하면 지구 옆에 같은 축척으로 놓여요.</p>}
      </div>
    </div>
  );
}

export function AsteroidGroup({ asteroids }: { asteroids: AsteroidTarget[] }) {
  const largest = Math.max(0, ...asteroids.filter(asteroidSized).map((a) => a.maxM));
  const unit = largest > 0 ? ASTEROID_MAX_D / largest : 0; // px per m (지름 기준)
  return (
    <div className="min-w-0 lg:flex-1">
      <GroupTitle title="소행성 · 실제 비율" />
      <div className="flex items-end gap-6 overflow-x-auto pb-1">
        {asteroids.length === 0 && <p className="self-center py-6 text-sm text-dim">추가한 소행성이 없어요.</p>}
        {asteroids.map((a) => {
          const to = `/neo/${a.id}`;
          if (!asteroidSized(a)) return <Disc key={a.id} r={UNKNOWN_R} caption={<Caption name={a.name} to={to} sub="크기 미측정" />} unknown />;
          const R = Math.max(2, (a.maxM * unit) / 2);
          const r = Math.max(1.5, (a.minM * unit) / 2);
          return (
            <Figure key={a.id} size={R * 2 + 4} caption={<Caption name={a.name} to={to} sub={`${diameterRange(a.minM, a.maxM)} m`} />}>
              <circle cx={R + 2} cy={R + 2} r={R} fill="none" stroke="var(--signal)" strokeDasharray="4 3" />
              <circle cx={R + 2} cy={R + 2} r={r} fill="var(--signal)" fillOpacity={0.3} stroke="var(--signal)" />
            </Figure>
          );
        })}
      </div>
    </div>
  );
}

function GroupTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-2 text-xs text-dim">
      <span>{title}</span>
      {note && <span className="rounded-full border border-line px-2 py-0.5">{note}</span>}
    </div>
  );
}

function Figure({ size, caption, children }: { size: number; caption: ReactNode; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <svg width={size} height={size} aria-hidden>
        {children}
      </svg>
      {caption}
    </div>
  );
}

function Disc({ r, caption, earth = false, unknown = false }: { r: number; caption: ReactNode; earth?: boolean; unknown?: boolean }) {
  const R = Math.max(1.5, r);
  return (
    <Figure size={R * 2 + 4} caption={caption}>
      <circle
        cx={R + 2}
        cy={R + 2}
        r={R}
        fill={earth ? "var(--line)" : unknown ? "none" : "var(--signal)"}
        fillOpacity={earth ? 1 : 0.25}
        stroke={earth ? "var(--dim)" : unknown ? "var(--dim)" : "var(--signal)"}
        strokeDasharray={unknown ? "3 3" : undefined}
      />
    </Figure>
  );
}

function Caption({ name, sub, to }: { name: string; sub: string; to?: string }) {
  return (
    <div className="max-w-32 text-center">
      {to ? (
        <Link to={to} className="block truncate text-sm font-medium text-bone hover:underline" title={name}>
          {name}
        </Link>
      ) : (
        <div className="truncate text-sm font-medium">{name}</div>
      )}
      <div className="font-mono text-xs text-dim">{sub || DASH}</div>
    </div>
  );
}
