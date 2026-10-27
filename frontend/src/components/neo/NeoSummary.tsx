// NeoSummary.tsx ─ 대시보드 상단 요약 4칸
// 값을 직접 계산하지 않는다 ─ 요약과 목록은 같은 데이터에서 서버가 미리 계산해 보낸다 (04 문서 5.1절 설계 결정 ①).

import { Moon, Radar, Ruler, TriangleAlert } from "lucide-react";

import StatCard from "@/components/common/StatCard";
import type { NeoDashboardSummary } from "@/types/api";
import { DASH, dec2, int } from "@/utils/format";

function NeoSummary({ summary, isToday }: { summary: NeoDashboardSummary; isToday: boolean }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Radar className="size-4" />} label="접근 건수" value={int(summary.total_count)} sub={`지구 기준 · ${isToday ? "오늘" : "이 날"}`} />
      <StatCard
        icon={<TriangleAlert className="size-4" />}
        label="잠재적 위험 분류"
        value={int(summary.hazardous_count)}
        sub="NASA PHA 기준"
        hazard={summary.hazardous_count > 0}
      />
      <StatCard
        icon={<Moon className="size-4" />}
        label="최근접 거리"
        value={dec2(summary.closest_ld)}
        unit="LD"
        sub={summary.closest_km === null ? DASH : `${int(summary.closest_km)} km`}
      />
      <StatCard
        icon={<Ruler className="size-4" />}
        label="최대 추정 직경"
        value={int(summary.largest_diameter_m)}
        unit="m"
        sub={summary.largest_diameter_name ?? DASH}
      />
    </section>
  );
}

export default NeoSummary;
