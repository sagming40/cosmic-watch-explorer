// Field ─ 라벨 + 수치 한 쌍 (상세 화면의 작은 값들). 수치는 Mono, 값이 없으면 단위를 붙이지 않는다.

import { cn } from "@/lib/utils";
import { DASH } from "@/utils/format";

interface FieldProps {
  label: string;
  value: string; // 이미 포맷된 문자열. 값이 없으면 "—"
  unit?: string;
  sub?: string;
  large?: boolean;
}

function Field({ label, value, unit, sub, large = false }: FieldProps) {
  return (
    <div>
      <div className="text-xs text-dim">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("font-mono font-medium tabular-nums", large ? "text-2xl" : "text-base")}>{value}</span>
        {unit && value !== DASH && <span className="font-mono text-xs text-dim">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-xs text-dim">{sub}</div>}
    </div>
  );
}

export default Field;
