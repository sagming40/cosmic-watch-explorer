// Panel ─ 카드 틀 (테두리 + 패널 배경, 모서리 16px, 그림자 없음 ─ 03 문서 2.4절)
// 화면의 거의 모든 덩어리가 이 틀 안에 들어간다.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-xl border border-line bg-panel/80 p-5 backdrop-blur md:p-6", className)}>{children}</div>;
}

export function PanelTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-dim">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
