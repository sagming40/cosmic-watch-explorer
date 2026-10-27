// TargetChip.tsx ─ "비교 대상" 줄의 칩 하나
// - 지구: 자물쇠 ─ 뺄 수 없는 고정 기준 (05 문서 M4 완료 기준 "지구가 제거되지 않는다")
// - 불러오는 중 / 못 불러옴(없는 id·NASA 제한 등)도 칩으로 보여준다 ─ 조용히 사라지면 왜 빠졌는지 모른다
// 점 모양: 채운 점 = 행성, 빈 점 = 소행성 (그림의 원 모양과 같은 약속)

import { Lock, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetChipProps {
  label: string;
  kind: "earth" | "planet" | "asteroid";
  state?: "ok" | "loading" | "error";
  onRemove?: () => void;
  onRetry?: () => void;
}

function TargetChip({ label, kind, state = "ok", onRemove, onRetry }: TargetChipProps) {
  return (
    <span className={cn("flex max-w-full items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-3 text-sm", state === "error" ? "border-bone/60" : "border-line bg-line/40")}>
      <span className={cn("size-2 shrink-0 rounded-full", kind === "asteroid" ? "border border-signal" : kind === "earth" ? "border border-dim bg-line" : "bg-signal")} />
      <span className={cn("min-w-0 truncate", state === "loading" && "text-dim motion-safe:animate-pulse")}>{label}</span>
      {state === "error" && onRetry && (
        <button type="button" onClick={onRetry} aria-label={`${label} 다시 불러오기`} title="다시 불러오기" className="grid size-5 shrink-0 place-items-center rounded-full text-dim hover:bg-line hover:text-bone">
          <RotateCw className="size-3" />
        </button>
      )}
      {kind === "earth" ? (
        <span className="grid size-5 shrink-0 place-items-center text-dim" title="지구는 기준이라 뺄 수 없어요">
          <Lock className="size-3" aria-label="고정 기준" />
        </span>
      ) : (
        <button type="button" onClick={onRemove} aria-label={`${label} 빼기`} className="grid size-5 shrink-0 place-items-center rounded-full text-dim hover:bg-line hover:text-bone">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export default TargetChip;
