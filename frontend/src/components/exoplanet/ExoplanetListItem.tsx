// ExoplanetListItem.tsx ─ 카탈로그 목록 한 줄. 누르면 상세(/exoplanets/:id)로.
// 왼쪽 원: 점선 = 지구, 채운 원 = 이 행성 (같은 축척). 지구의 2배를 넘는 행성은 칸에 맞춰 잘라 그린다(아래 MAX_R).

import { Link } from "react-router";
import type { ExoplanetRow } from "@/types/api";
import { DASH, dec2, int } from "@/utils/format";

const EARTH_R = 12; // 지구 반지름 = 12px
const MAX_R = 26; // 칸 크기 한계 ─ 반지름이 지구의 87배인 행성도 있다

function ExoplanetListItem({ planet }: { planet: ExoplanetRow }) {
  const r = planet.radius_earth;
  const drawn = r === null ? null : Math.min(MAX_R, r * EARTH_R);
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        to={`/exoplanets/${planet.id}`}
        className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-bone transition-colors hover:bg-line/40 focus-visible:bg-line/40"
      >
        <svg viewBox="-28 -28 56 56" className="size-14" aria-hidden>
          <circle r={EARTH_R} fill="none" stroke="var(--dim)" strokeDasharray="2 3" />
          {drawn !== null && <circle r={drawn} fill="var(--signal)" fillOpacity={0.25} stroke="var(--signal)" />}
          {/* 칸보다 커서 잘린 경우 ─ 바깥 점선으로 "더 크다"를 알린다 */}
          {r !== null && r * EARTH_R > MAX_R && <circle r={MAX_R + 1} fill="none" stroke="var(--signal)" strokeDasharray="1 3" />}
        </svg>
        <div className="min-w-0">
          <div className="truncate font-semibold">{planet.planet_name}</div>
          <div className="mt-1 truncate text-sm text-dim">
            {planet.host_star.name} ·{" "}
            {planet.host_star.distance_ly === null ? "거리 미측정" : <><span className="font-mono">{dec2(planet.host_star.distance_ly)}</span>광년</>} · {planet.discovery_method ?? DASH} ·{" "}
            <span className="font-mono">{planet.discovery_year ?? DASH}</span>
          </div>
        </div>
        <div className="hidden gap-6 text-right sm:flex">
          <Mini label="반지름" value={dec2(planet.radius_earth)} />
          <Mini label="질량" value={dec2(planet.mass_earth)} />
          <Mini label="평형 온도" value={int(planet.equilibrium_temp_k)} unit="K" />
        </div>
      </Link>
    </li>
  );
}

function Mini({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="w-16">
      <div className="text-[11px] text-dim">{label}</div>
      <div className="font-mono">
        {value}
        {unit && value !== DASH && <span className="ml-0.5 text-xs text-dim">{unit}</span>}
      </div>
    </div>
  );
}

export default ExoplanetListItem;
