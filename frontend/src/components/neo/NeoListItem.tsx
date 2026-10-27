// NeoListItem.tsx ─ 대시보드 목록 한 줄. 누르면 상세(/neo/:nasa_id)로 이동한다.

import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import HazardBadge from "@/components/common/HazardBadge";
import { cn } from "@/lib/utils";
import type { NeoDashboardItem } from "@/types/api";
import { DASH, dec2, diameterRange, int, kstTime } from "@/utils/format";

import { NEAR_MOON_LD } from "./chart";

export type SubUnit = "km" | "au";

interface NeoListItemProps {
  neo: NeoDashboardItem;
  subUnit: SubUnit; // 보조 단위 토글 ─ LD는 항상 크게, km/AU 중 하나를 작게 (03 문서 6.1절)
  active: boolean; // 차트에서 이 소행성에 마우스를 올렸는지
  onHover: (id: string | null) => void;
}

function subDistance(neo: NeoDashboardItem, unit: SubUnit): string {
  const { miss_distance_km, miss_distance_au } = neo.approach;
  if (unit === "km") return miss_distance_km === null ? DASH : `${int(miss_distance_km)} km`;
  return miss_distance_au === null ? DASH : `${miss_distance_au.toFixed(4)} AU`;
}

function NeoListItem({ neo, subUnit, active, onHover }: NeoListItemProps) {
  const ld = neo.approach.miss_distance_ld;
  const nearMoon = ld !== null && ld < NEAR_MOON_LD;
  const diameter = diameterRange(neo.diameter_min_m, neo.diameter_max_m);

  return (
    <li onMouseEnter={() => onHover(neo.nasa_id)} onMouseLeave={() => onHover(null)} className="border-b border-line last:border-b-0">
      <Link
        to={`/neo/${neo.nasa_id}`}
        className={cn(
          "group relative grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 px-5 py-4 text-bone transition-colors focus-visible:bg-line/40",
          active ? "bg-line/40" : "hover:bg-line/40",
        )}
      >
        {/* 위험 분류는 왼쪽 세로 띠 + 아이콘 + 글자 3중 표시 (03 문서 9장 ─ 색만으로 구분하지 않는다) */}
        {neo.is_hazardous && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-hazard" />}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{neo.name}</span>
            {neo.is_hazardous && <HazardBadge />}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-dim">
            <span>
              추정 직경 <span className="font-mono text-bone">{diameter ?? DASH}</span>
              {diameter && <span className="font-mono text-xs"> m</span>}
            </span>
            <span>
              상대속도 <span className="font-mono text-bone">{dec2(neo.approach.velocity_km_s)}</span>
              <span className="font-mono text-xs"> km/s</span>
            </span>
            <span>
              최근접 <span className="font-mono text-bone">{kstTime(neo.approach.datetime_utc)}</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className={cn("font-mono text-2xl font-medium tabular-nums", nearMoon && "text-hazard")}>
            {dec2(ld)}
            <span className="ml-1 text-sm text-dim">LD</span>
          </div>
          <div className="mt-1 font-mono text-xs text-dim">{subDistance(neo, subUnit)}</div>
        </div>

        <ArrowUpRight className="absolute top-4 right-1 size-3.5 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  );
}

export default NeoListItem;
