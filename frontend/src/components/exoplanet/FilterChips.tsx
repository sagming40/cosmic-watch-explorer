// FilterChips.tsx ─ 적용된 조건 (03 문서 6.3절)
// 스크롤해서 입력칸이 안 보여도 "내가 무슨 조건을 걸었더라"를 결과 위에서 바로 확인하고, × 로 하나씩 뺀다.
// 그리는 재료는 서버가 돌려준 applied_filters ─ 서버가 실제로 적용한 조건이라 화면과 어긋날 수 없다 (04 문서 6.1 설계 결정 ②)
// 같은 항목의 최소·최대는 칩 하나("반지름 0.8 ~ 1.5")로 합치고, × 를 누르면 둘 다 빠진다.

import { X } from "lucide-react";
import { chipsFrom } from "@/utils/exoplanetQuery";

interface FilterChipsProps {
  applied: Record<string, string | number>;
  onRemove: (keys: string[]) => void;
  onClear: () => void;
}

function FilterChips({ applied, onRemove, onClear }: FilterChipsProps) {
  const chips = chipsFrom(applied);
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
      <span className="text-xs text-dim">적용된 조건</span>
      {chips.length === 0 && <span className="text-sm text-dim">없음 · 전체 목록</span>}
      {chips.map((c) => (
        <span key={c.keys.join(",")} className="flex items-center gap-1 rounded-full border border-line bg-line/40 py-1 pr-1.5 pl-3 text-sm">
          {c.label}
          <button
            type="button"
            aria-label={`${c.label} 조건 해제`}
            onClick={() => onRemove(c.keys)}
            className="grid size-5 place-items-center rounded-full text-dim hover:bg-line hover:text-bone"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {chips.length > 0 && (
        <button type="button" onClick={onClear} className="text-xs text-dim underline-offset-4 hover:text-bone hover:underline">
          모두 지우기
        </button>
      )}
    </div>
  );
}

export default FilterChips;
