// 목업 화면들이 같이 쓰는 부품 ─ 확정 후 components/ 아래로 나눠 옮긴다.

import type { ReactNode } from "react";
import { ChevronLeft, Orbit, Search, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NavKey = "neo" | "exoplanets" | "compare" | null;

// ─── 헤더: 로고 / 알약 메뉴 / 검색(Ctrl K) / 로그인 상태 ─────────────────
export function MockHeader({ active, user }: { active: NavKey; user?: string }) {
  const items: { key: NavKey; label: string }[] = [
    { key: "neo", label: "소행성" },
    { key: "exoplanets", label: "외계행성" },
    { key: "compare", label: "크기 비교" },
  ];
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        <a className="flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap text-bone" href="#">
          <span className="mock-accent-tint grid size-8 place-items-center rounded-lg">
            <Orbit className="size-4.5" />
          </span>
          <span className="hidden sm:inline">Cosmic Watch</span>
        </a>

        <nav className="ml-2 hidden items-center gap-1 rounded-full border border-line bg-panel/70 p-1 md:flex">
          {items.map((it) => (
            <a
              key={it.label}
              href="#"
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                it.key === active ? "bg-signal text-ink" : "text-dim hover:text-bone",
              )}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <button className="ml-auto flex h-9 shrink-0 items-center gap-2 rounded-lg border border-line bg-panel/70 px-3 text-sm text-dim transition-colors hover:text-bone lg:w-72">
          <Search className="size-4" />
          <span className="hidden lg:inline">소행성·외계행성 검색</span>
          <kbd className="ml-auto hidden rounded border border-line px-1.5 font-mono text-[11px] lg:inline">Ctrl K</kbd>
        </button>

        {user ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
              내 관심 천체
            </Button>
            <span className="grid size-8 place-items-center rounded-full bg-line text-sm font-semibold uppercase">
              {user[0]}
            </span>
          </div>
        ) : (
          <Button variant="outline" size="sm">
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}

// ─── 카드 틀 ─────────────────────────────────────────────────────────
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

// ─── 라벨 + 수치 (DataField의 새 모양) ─────────────────────────────────
export function Field({
  label,
  value,
  unit,
  sub,
  large = false,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  large?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-dim">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("font-mono font-medium tabular-nums", large ? "text-2xl" : "text-base")}>{value}</span>
        {unit && value !== "—" && <span className="font-mono text-xs text-dim">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-xs text-dim">{sub}</div>}
    </div>
  );
}

// ─── 요약 카드 ────────────────────────────────────────────────────────
export function StatCard({
  icon,
  label,
  value,
  unit,
  sub,
  hazard = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  hazard?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-panel/80 p-5 backdrop-blur", hazard && "mock-hazard-tint")}>
      <div className={cn("flex items-center gap-2 text-sm text-dim", hazard && "text-hazard")}>
        {icon}
        {label}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("font-mono text-3xl font-medium tabular-nums md:text-4xl", hazard && "text-hazard")}>{value}</span>
        {unit && value !== "—" && <span className="font-mono text-sm text-dim">{unit}</span>}
      </div>
      <div className="mt-1 truncate font-mono text-xs text-dim">{sub}</div>
    </div>
  );
}

// ─── 잠재적 위험 배지 ─ 색 + 아이콘 + 글자 3중 (03 문서 9장) ───────────────
export function HazardBadge({ label = "잠재적 위험" }: { label?: string }) {
  return (
    <Badge variant="outline" className="gap-1 border-hazard/50 text-hazard">
      <TriangleAlert className="size-3" />
      {label}
    </Badge>
  );
}

export function BackLink({ label }: { label: string }) {
  return (
    <a href="#" className="inline-flex items-center gap-1 text-sm text-dim transition-colors hover:text-bone">
      <ChevronLeft className="size-4" />
      {label}
    </a>
  );
}

export function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}

// ─── 페이지 바깥 틀 ───────────────────────────────────────────────────
export function PageShell({ active, user, children }: { active: NavKey; user?: string; children: ReactNode }) {
  return (
    <>
      <MockHeader active={active} user={user} />
      <main className="mx-auto max-w-7xl px-4 pb-32 md:px-8">{children}</main>
    </>
  );
}
