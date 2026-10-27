// ═══════════════════════════════════════════════════════════════════
// ExoplanetCatalog.tsx ─ 목업 화면 3: 외계행성 카탈로그 (/exoplanets) ─ 03 문서 6.3절
// 응답: ExoplanetMetaResponse(필터 선택지) + ExoplanetListResponse (04 문서 6.1·6.3절)
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExoplanetRow } from "@/types/api";

import { MOCK_EXO_LIST, MOCK_EXO_META } from "../data";
import { DASH, dec2, int } from "../format";
import { PageShell, Panel } from "../parts";

// applied_filters 키 → 칩 문구 (서버가 실제로 적용한 조건을 그대로 그린다 ─ 6.1 설계 결정 ②)
const FILTER_LABEL: Record<string, (v: string | number) => string> = {
  name: (v) => `이름 "${v}"`,
  host: (v) => `모항성 "${v}"`,
  radius_min: (v) => `반지름 ≥ ${v}`,
  radius_max: (v) => `반지름 ≤ ${v}`,
  mass_min: (v) => `질량 ≥ ${v}`,
  mass_max: (v) => `질량 ≤ ${v}`,
  distance_min_ly: (v) => `거리 ≥ ${v}광년`,
  distance_max_ly: (v) => `거리 ≤ ${v}광년`,
  year_min: (v) => `${v}년 이후`,
  year_max: (v) => `${v}년 이전`,
  method: (v) => `발견: ${v}`,
};

function ExoplanetCatalog() {
  const meta = MOCK_EXO_META;
  const list = MOCK_EXO_LIST;
  const [filters, setFilters] = useState(list.applied_filters);
  const [method, setMethod] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <PageShell active="exoplanets">
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">외계행성 카탈로그</h1>
        <p className="mt-3 text-dim">
          NASA Exoplanet Archive에 등록된 <span className="font-mono text-bone">{int(meta.total_count)}</span>개 행성을 조건으로 찾아보세요.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ─── 검색 조건 ─── */}
        <Panel className="h-fit lg:sticky lg:top-20">
          <div className="flex items-center justify-between lg:mb-4">
            {/* 1024px 미만에서는 접었다 폈다 (03 문서 8장 ─ 태블릿: 필터 패널이 상단 접이식) */}
            <button
              className="flex items-center gap-2 font-semibold lg:pointer-events-none"
              onClick={() => setPanelOpen((v) => !v)}
              aria-expanded={panelOpen}
            >
              검색 조건
              <ChevronDown className={cn("size-4 text-dim transition-transform lg:hidden", panelOpen && "rotate-180")} />
            </button>
            <button className="flex items-center gap-1 text-xs text-dim hover:text-bone">
              <RotateCcw className="size-3.5" /> 초기화
            </button>
          </div>

          <div className={cn("mt-4 space-y-5 lg:mt-0 lg:block", !panelOpen && "hidden")}>
            <FilterField label="행성 이름">
              <Input placeholder="예: TRAPPIST" />
            </FilterField>
            <RangeField label="반지름" unit="지구=1" min="0.8" max="1.5" hint={`${meta.ranges.radius_earth.min} ~ ${meta.ranges.radius_earth.max}`} />
            <RangeField label="질량" unit="지구=1" hint={`${meta.ranges.mass_earth.min} ~ ${int(meta.ranges.mass_earth.max)}`} />
            <RangeField label="거리" unit="광년" max="100" hint={`${meta.ranges.distance_ly.min} ~ ${int(meta.ranges.distance_ly.max)}`} />
            <RangeField label="발견 연도" hint={`${meta.ranges.discovery_year.min} ~ ${meta.ranges.discovery_year.max}`} />

            <FilterField label="발견 방법">
              <div className="flex flex-wrap gap-1.5">
                {meta.discovery_methods.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMethod((cur) => (cur === m.value ? null : m.value))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      method === m.value ? "border-signal bg-signal text-ink" : "border-line text-dim hover:text-bone",
                    )}
                  >
                    {m.value} <span className="font-mono opacity-70">{int(m.count)}</span>
                  </button>
                ))}
              </div>
            </FilterField>

            <Button className="w-full">
              <Search /> 검색
            </Button>
          </div>
        </Panel>

        {/* ─── 결과 ─── */}
        <div className="min-w-0">
          <Panel className="p-0 md:p-0">
            {/* 적용된 조건 칩 ─ 스크롤해도 "무슨 조건이었지?"를 다시 확인하러 올라가지 않게 */}
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
              <span className="text-xs text-dim">적용된 조건</span>
              {Object.entries(filters).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1 rounded-full border border-line bg-line/40 py-1 pr-1.5 pl-3 text-sm">
                  {FILTER_LABEL[k]?.(v) ?? `${k}: ${v}`}
                  <button
                    aria-label={`${k} 조건 해제`}
                    onClick={() =>
                      setFilters((cur) => {
                        const next = { ...cur };
                        delete next[k];
                        return next;
                      })
                    }
                    className="grid size-5 place-items-center rounded-full text-dim hover:bg-line hover:text-bone"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {Object.keys(filters).length > 0 && (
                <button onClick={() => setFilters({})} className="text-xs text-dim underline-offset-4 hover:text-bone hover:underline">
                  모두 지우기
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="text-dim">
                총 <span className="font-mono text-bone">{int(list.count)}</span>건
              </span>
              <label className="flex items-center gap-2 text-dim">
                정렬
                <select className="rounded-md border border-line bg-panel px-2 py-1 text-bone">
                  <option>거리 가까운 순</option>
                  <option>반지름 작은 순</option>
                  <option>질량 작은 순</option>
                  <option>최근 발견 순</option>
                  <option>이름 순</option>
                </select>
              </label>
            </div>

            <ul className="border-t border-line">
              {list.results.map((p) => (
                <PlanetRow key={p.id} planet={p} />
              ))}
            </ul>
          </Panel>

          {/* 페이지 이동 */}
          <nav className="mt-4 flex items-center justify-center gap-1" aria-label="페이지">
            <Button variant="ghost" size="icon-sm" aria-label="이전 페이지" disabled>
              <ChevronLeft />
            </Button>
            {Array.from({ length: list.total_pages }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === list.page ? "secondary" : "ghost"} size="icon-sm" className="font-mono">
                {n}
              </Button>
            ))}
            <Button variant="ghost" size="icon-sm" aria-label="다음 페이지">
              <ChevronRight />
            </Button>
          </nav>
        </div>
      </div>
    </PageShell>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-dim">{label}</div>
      {children}
    </div>
  );
}

// 범위 입력 ─ placeholder에 실제 데이터 범위(meta.ranges)를 보여줘서 "없는 범위"를 덜 입력하게
function RangeField({ label, unit, min, max, hint }: { label: string; unit?: string; min?: string; max?: string; hint: string }) {
  return (
    <FilterField label={unit ? `${label} (${unit})` : label}>
      <div className="flex items-center gap-2">
        <Input defaultValue={min} placeholder="최소" className="font-mono" inputMode="decimal" />
        <span className="text-dim">~</span>
        <Input defaultValue={max} placeholder="최대" className="font-mono" inputMode="decimal" />
      </div>
      <div className="mt-1 font-mono text-[11px] text-dim">데이터 범위 {hint}</div>
    </FilterField>
  );
}

// 목록 한 줄 ─ 왼쪽 원: 지구(점선)와 같은 축척으로 그린 행성 크기
function PlanetRow({ planet }: { planet: ExoplanetRow }) {
  const r = planet.radius_earth;
  const EARTH = 12; // 지구 반지름 = 12px
  return (
    <li className="group grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-line/40">
      <svg viewBox="-28 -28 56 56" className="size-14" aria-hidden>
        <circle r={EARTH} fill="none" stroke="var(--dim)" strokeDasharray="2 3" />
        {r !== null && <circle r={Math.min(26, r * EARTH)} fill="var(--signal)" fillOpacity={0.25} stroke="var(--signal)" />}
      </svg>
      <div className="min-w-0">
        <div className="truncate font-semibold">{planet.planet_name}</div>
        <div className="mt-1 truncate text-sm text-dim">
          {planet.host_star.name} · <span className="font-mono">{dec2(planet.host_star.distance_ly)}</span>광년 · {planet.discovery_method ?? DASH} ·{" "}
          <span className="font-mono">{planet.discovery_year ?? DASH}</span>
        </div>
      </div>
      <div className="hidden gap-6 text-right sm:flex">
        <Mini label="반지름" value={dec2(planet.radius_earth)} />
        <Mini label="질량" value={dec2(planet.mass_earth)} />
        <Mini label="평형 온도" value={int(planet.equilibrium_temp_k)} unit="K" />
      </div>
    </li>
  );
}

function Mini({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="w-16">
      <div className="text-[11px] text-dim">{label}</div>
      <div className="font-mono">
        {value}
        {unit && value !== DASH && <span className="ml-0.5 text-xs text-dim">{unit}</span>}
      </div>
    </div>
  );
}

export default ExoplanetCatalog;
