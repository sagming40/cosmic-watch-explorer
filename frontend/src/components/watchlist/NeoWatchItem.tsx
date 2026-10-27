// NeoWatchItem.tsx ─ 내 관심 천체 > 소행성 한 줄 (03 문서 시나리오 4 ─ "저장한 NEO 목록 + 각각의 다음 접근 예정일")
// next_approach = 오늘 이후 "지구" 접근 중 가장 빠른 것 (04 문서 7.2절). 없으면 null → "예정된 지구 접근 없음".
// 휴대폰 폭에서는 다음 접근을 이름 아래로 내린다 (칸 3개가 375px에 안 들어간다).

import { Link } from "react-router";
import { CalendarClock, TriangleAlert } from "lucide-react";

import HazardBadge from "@/components/common/HazardBadge";
import RemoveButton from "@/components/watchlist/RemoveButton";
import { cn } from "@/lib/utils";
import type { NeoWatchlistItem } from "@/types/api";
import { DASH, daysFrom, dec2, diameterRange, kstDate, untilLabel } from "@/utils/format";

interface NeoWatchItemProps {
  item: NeoWatchlistItem;
  today: string; // "YYYY-MM-DD" ─ 목록 전체가 같은 "오늘"을 쓰도록 위에서 받는다
  onRemove: () => void;
}

function NeoWatchItem({ item, today, onRemove }: NeoWatchItemProps) {
  const diameter = diameterRange(item.diameter_min_m, item.diameter_max_m);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] md:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/neo/${item.nasa_id}`} className="truncate font-semibold text-bone hover:underline">
            {item.name}
          </Link>
          {item.is_hazardous && <HazardBadge />}
        </div>
        <div className="mt-1 text-sm text-dim">
          {/* 직경이 없으면 단위(m)까지 같이 뺀다 ─ "— m"처럼 단위만 남지 않게 */}
          추정 직경 <span className="font-mono text-bone">{diameter === null ? DASH : `${diameter} m`}</span> · 저장{" "}
          <span className="font-mono">{kstDate(item.saved_at)}</span>
        </div>
      </div>

      <div className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto sm:text-right">
        <NextApproach next={item.next_approach} today={today} />
      </div>

      <div className="col-start-2 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1">
        <RemoveButton label={item.name} onClick={onRemove} />
      </div>
    </li>
  );
}

function NextApproach({ next, today }: { next: NeoWatchlistItem["next_approach"]; today: string }) {
  if (!next) return <div className="text-sm text-dim">예정된 지구 접근 없음</div>;
  const date = kstDate(next.datetime_utc);
  const ld = next.miss_distance_ld;
  const nearMoon = ld !== null && ld < 1;
  return (
    <>
      <div className="flex items-center gap-1.5 text-xs text-dim sm:justify-end">
        <CalendarClock className="size-3.5" />
        다음 접근 · {untilLabel(daysFrom(today, date))}
      </div>
      <div className="mt-0.5 font-mono text-sm">
        {date}{" "}
        {/* 1 LD 안쪽은 색 + 아이콘 + 읽히는 글자 (색만으로 위험을 표시하지 않는다 ─ 03 문서 9장) */}
        <span className={cn("inline-flex items-center gap-1", nearMoon ? "text-hazard" : "text-dim")}>
          {nearMoon && <TriangleAlert className="size-3.5" aria-hidden />}
          {ld === null ? DASH : `${dec2(ld)} LD`}
          {nearMoon && <span className="sr-only">(달보다 가까움)</span>}
        </span>
      </div>
    </>
  );
}

export default NeoWatchItem;
