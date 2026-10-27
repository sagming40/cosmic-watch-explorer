// Pagination ─ 페이지 이동 (03 문서 10장). 페이지가 수백 개여도 버튼은 7개 안팎만:
// [◀] 1 … 4 5 [6] 7 8 … 323 [▶]

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function pageWindow(page: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const from = Math.max(2, page - 2);
  const to = Math.min(total - 1, page + 2);
  out.push(1);
  if (from > 2) out.push("…");
  for (let p = from; p <= to; p++) out.push(p);
  if (to < total - 1) out.push("…");
  if (total > 1) out.push(total);
  return out;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지">
      <Button variant="ghost" size="icon-sm" aria-label="이전 페이지" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft />
      </Button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-dim">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "secondary" : "ghost"}
            size="sm"
            className="min-w-8 font-mono"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="ghost" size="icon-sm" aria-label="다음 페이지" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight />
      </Button>
    </nav>
  );
}

export default Pagination;
