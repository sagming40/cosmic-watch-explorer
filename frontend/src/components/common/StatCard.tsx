// StatCard ─ 요약 칸 하나 (라벨 + 큰 수치 + 보조 줄)
// 수치는 항상 Mono 서체 (03 문서 2.2절 ─ 자릿수가 세로로 맞아떨어지게). 옛 DataField의 역할을 이어받는다.
// hazard=true 는 "위험 분류 건수"처럼 위험 표시일 때만 쓴다 (03 문서 2.1절 ─ hazard 전용 규칙).

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DASH } from "@/utils/format";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string; // 이미 포맷된 문자열. 값이 없으면 "—"
  unit?: string;
  sub: string;
  hazard?: boolean;
}

function StatCard({ icon, label, value, unit, sub, hazard = false }: StatCardProps) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-line bg-panel/80 p-5 backdrop-blur", hazard && "hazard-tint")}>
      <div className={cn("flex items-center gap-2 text-sm text-dim", hazard && "text-hazard")}>
        {icon}
        {label}
      </div>
      {/* flex-wrap ─ 휴대폰 2열 카드에서 "6,356.57 × 지구"처럼 길면 단위가 다음 줄로 (카드 밖으로 안 밀려나게) */}
      <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
        <span className={cn("font-mono text-3xl font-medium tabular-nums md:text-4xl", hazard && "text-hazard")}>{value}</span>
        {/* 값이 없을 때 "— m"처럼 단위만 남지 않게 */}
        {unit && value !== DASH && <span className="font-mono text-sm text-dim">{unit}</span>}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-dim">{sub}</div>
    </div>
  );
}

export default StatCard;
