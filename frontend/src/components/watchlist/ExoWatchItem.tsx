// ExoWatchItem.tsx ─ 내 관심 천체 > 외계행성 한 줄
// 왼쪽 원은 카탈로그(ExoplanetListItem)와 같은 그림: 점선 = 지구, 채운 원 = 이 행성. 칸보다 크면 잘라 그리고 바깥 점선.

import { Link } from "react-router";

import RemoveButton from "@/components/watchlist/RemoveButton";
import type { ExoplanetWatchlistItem } from "@/types/api";
import { DASH, dec2, kstDate } from "@/utils/format";

const EARTH_R = 10;
const MAX_R = 22;

interface ExoWatchItemProps {
  item: ExoplanetWatchlistItem;
  onRemove: () => void;
}

function ExoWatchItem({ item, onRemove }: ExoWatchItemProps) {
  const r = item.radius_earth;
  const drawn = r === null ? null : Math.min(MAX_R, r * EARTH_R);
  const radius = r === null ? DASH : `${dec2(r)} × 지구`;
  return (
    <li className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[48px_minmax(0,1fr)_auto_auto] md:px-6">
      <svg viewBox="-24 -24 48 48" className="size-12" aria-hidden>
        <circle r={EARTH_R} fill="none" stroke="var(--dim)" strokeDasharray="2 3" />
        {drawn !== null && <circle r={drawn} fill="var(--signal)" fillOpacity={0.25} stroke="var(--signal)" />}
        {r !== null && r * EARTH_R > MAX_R && <circle r={MAX_R + 1} fill="none" stroke="var(--signal)" strokeDasharray="1 3" />}
      </svg>
      <div className="min-w-0">
        <Link to={`/exoplanets/${item.id}`} className="block truncate font-semibold text-bone hover:underline">
          {item.planet_name}
        </Link>
        <div className="mt-1 truncate text-sm text-dim">
          {item.host_star.name} ·{" "}
          {/* "— 광년"처럼 단위만 남지 않게 (10-27 카탈로그에서 고친 것과 같은 규칙) */}
          {item.host_star.distance_ly === null ? "거리 미측정" : <><span className="font-mono">{dec2(item.host_star.distance_ly)}</span> 광년</>}
          <span className="sm:hidden"> · 반지름 <span className="font-mono">{radius}</span></span>
          {" "}· 저장 <span className="font-mono">{kstDate(item.saved_at)}</span>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <div className="text-xs text-dim">반지름</div>
        <div className="font-mono text-sm">{radius}</div>
      </div>
      <RemoveButton label={item.planet_name} onClick={onRemove} />
    </li>
  );
}

export default ExoWatchItem;
