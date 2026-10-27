// ═══════════════════════════════════════════════════════════════════
// MockupPage.tsx ─ /mockup (개발 서버에서만 열림)
//
// NEO 대시보드 디자인 목업. 하단 떠 있는 막대에서 색 시안 3종(A·B·C)을 바꿔 본다.
// 데이터는 가짜(data.ts)지만 실제 API 응답 타입과 같은 모양 → 확정되면 이 화면 코드를
// 실제 NeoDashboardPage로 옮기고, mockup 폴더는 통째로 지운다.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  Moon,
  Orbit,
  Radar,
  Ruler,
  Search,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { NeoDashboardItem } from "@/types/api";

import { MOCK_DASHBOARD, MOCK_NEXT_APPROACH } from "./data";
import "./mockup.css";

// ─── 시안 목록 ───────────────────────────────────────────────────────
const THEMES = [
  { id: "sodium", label: "A · 소듐", hint: "지금 토큰을 다듬은 안" },
  { id: "deep-space", label: "B · 딥 스페이스", hint: "남색 + 하늘색" },
  { id: "graphite", label: "C · 그래파이트", hint: "무채색 + 라임" },
] as const;
type ThemeId = (typeof THEMES)[number]["id"];

// 스케일 바 고정 범위 (03 문서 3장, v1.2 ─ 0.1 ~ 500 LD)
const LD_MIN = 0.1;
const LD_MAX = 500;
const HAZARD_THRESHOLD_LD = 1; // "1 LD 안쪽" ─ is_hazardous(PHA)와 다른 기준

type SortKey = "distance" | "velocity" | "size";
type SubUnit = "km" | "au";

// ─── 표시용 포맷 (목업 안에서만. 확정 시 utils/format.ts로) ─────────────
const nf0 = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDiameter(min: number | null, max: number | null): string | null {
  if (min === null || max === null) return null; // 값이 없으면 "—"
  return `${nf0.format(min)} ~ ${nf0.format(max)}`;
}

function fmtSub(neo: NeoDashboardItem, unit: SubUnit): string {
  const { miss_distance_km, miss_distance_au } = neo.approach;
  if (unit === "km") return miss_distance_km === null ? "—" : `${nf0.format(miss_distance_km)} km`;
  return miss_distance_au === null ? "—" : `${miss_distance_au.toFixed(4)} AU`;
}

function clampLd(ld: number) {
  return Math.max(LD_MIN, Math.min(LD_MAX, ld));
}

// 접근 시각(UTC) → 한국 시각 "14:42"
function fmtKstTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

// ═══════════════════════════════════════════════════════════════════
function MockupPage() {
  const [theme, setTheme] = useState<ThemeId>("sodium");
  const [sort, setSort] = useState<SortKey>("distance");
  const [subUnit, setSubUnit] = useState<SubUnit>("km");
  const [hazardOnly, setHazardOnly] = useState(false);
  // 목록 ↔ 차트 연결 ─ 한쪽에 마우스를 올리면 다른 쪽도 같이 강조된다
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const data = MOCK_DASHBOARD;

  const rows = useMemo(() => {
    const list = hazardOnly ? data.results.filter((n) => n.is_hazardous) : [...data.results];
    const by: Record<SortKey, (n: NeoDashboardItem) => number> = {
      distance: (n) => n.approach.miss_distance_ld ?? Infinity,
      velocity: (n) => -(n.approach.velocity_km_s ?? -Infinity),
      size: (n) => -(n.diameter_max_m ?? -Infinity),
    };
    return list.sort((a, b) => by[sort](a) - by[sort](b));
  }, [data.results, hazardOnly, sort]);

  return (
    <div data-mock-theme={theme} className="mock-backdrop min-h-screen text-bone">
      <MockHeader />

      <main className="mx-auto max-w-7xl px-4 pb-32 md:px-8">
        {/* ─── 히어로: 제목 + 날짜 이동 / 다음 접근 카운트다운 ─── */}
        <section className="grid gap-6 pt-10 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex items-center gap-2 text-label font-medium tracking-[0.12em] text-sodium uppercase">
              <span className="mock-live-dot size-1.5 rounded-full bg-sodium" />
              Live · NASA NeoWs
            </div>
            <h1 className="text-4xl leading-tight font-bold tracking-tight md:text-5xl">
              오늘 지구 곁을 지나는
              <br />
              <span className="text-sodium">소행성 {data.summary.total_count}개</span>
            </h1>
            <DatePill date={data.date} />
          </div>

          <Countdown />
        </section>

        {/* ─── 요약 4칸 ─── */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={<Radar className="size-4" />} label="접근 건수" value={nf0.format(data.summary.total_count)} sub="지구 기준 · 오늘" />
          <StatCard
            icon={<TriangleAlert className="size-4" />}
            label="잠재적 위험 분류"
            value={nf0.format(data.summary.hazardous_count)}
            sub="NASA PHA 기준"
            hazard={data.summary.hazardous_count > 0}
          />
          <StatCard
            icon={<Moon className="size-4" />}
            label="최근접 거리"
            value={data.summary.closest_ld === null ? "—" : nf2.format(data.summary.closest_ld)}
            unit="LD"
            sub={data.summary.closest_km === null ? "—" : `${nf0.format(data.summary.closest_km)} km`}
          />
          <StatCard
            icon={<Ruler className="size-4" />}
            label="최대 추정 직경"
            value={data.summary.largest_diameter_m === null ? "—" : nf0.format(data.summary.largest_diameter_m)}
            unit="m"
            sub={data.summary.largest_diameter_name ?? "—"}
          />
        </section>

        {/* ─── 시그니처: 달 거리 스케일 바 ─── */}
        <section className="mt-3 rounded-xl border border-line bg-panel/80 p-5 backdrop-blur md:p-6">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">달 거리 스케일</h2>
            <div className="flex items-center gap-4 text-xs text-dim">
              <Legend className="bg-hazard" label="달보다 가까이 (1 LD 안쪽)" />
              <Legend className="bg-sodium" label="그 밖" />
              <Legend className="border border-sodium" label="범위 밖 (끝에 표시)" />
            </div>
          </div>
          <p className="mb-2 text-sm text-dim">
            모든 거리를 지구–달 평균 거리(1 LD) 기준으로 놓은 로그 눈금. 점선 왼쪽이면 달보다 가까이 온 것이다.
          </p>
          <LunarScale results={data.results} hoveredId={hoveredId} onHover={setHoveredId} />
        </section>

        {/* ─── 목록 + 산점도·FAQ ─── */}
        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-xl border border-line bg-panel/80 backdrop-blur">
            {/* 툴바 */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line px-5 py-4">
              <ToolbarGroup label="정렬">
                <ToggleGroup
                  type="single"
                  size="sm"
                  variant="outline"
                  value={sort}
                  onValueChange={(v) => v && setSort(v as SortKey)}
                >
                  <ToggleGroupItem value="distance">거리</ToggleGroupItem>
                  <ToggleGroupItem value="velocity">속도</ToggleGroupItem>
                  <ToggleGroupItem value="size">크기</ToggleGroupItem>
                </ToggleGroup>
              </ToolbarGroup>
              <ToolbarGroup label="보조 단위">
                <ToggleGroup
                  type="single"
                  size="sm"
                  variant="outline"
                  value={subUnit}
                  onValueChange={(v) => v && setSubUnit(v as SubUnit)}
                >
                  <ToggleGroupItem value="km">km</ToggleGroupItem>
                  <ToggleGroupItem value="au">AU</ToggleGroupItem>
                </ToggleGroup>
              </ToolbarGroup>
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-dim">
                <Switch checked={hazardOnly} onCheckedChange={setHazardOnly} />
                위험 분류만
              </label>
            </div>

            <ul>
              {rows.map((neo) => (
                <NeoRow
                  key={neo.nasa_id}
                  neo={neo}
                  subUnit={subUnit}
                  active={hoveredId === neo.nasa_id}
                  onHover={setHoveredId}
                />
              ))}
              {rows.length === 0 && (
                <li className="px-5 py-12 text-center text-sm text-dim">
                  오늘은 위험 분류 소행성이 없습니다.
                  <button className="ml-2 text-sodium underline-offset-4 hover:underline" onClick={() => setHazardOnly(false)}>
                    전체 보기
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-line bg-panel/80 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">거리 × 속도</h2>
              <p className="mb-3 text-sm text-dim">점이 클수록 큰 소행성. 왼쪽 위일수록 가깝고 빠르다.</p>
              <DistanceVelocityChart results={data.results} hoveredId={hoveredId} onHover={setHoveredId} />
            </div>
            <Faq />
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-dim">
          <span className="flex items-center gap-1.5">
            <Database className="size-3.5" />
            데이터: NASA NeoWs · {fmtKstTime(data.cache.fetched_at)} 수집 (캐시)
          </span>
          <span>학습·포트폴리오 목적이며 실제 충돌 예측에 사용하지 마세요.</span>
        </footer>
      </main>

      <ThemeDock theme={theme} onChange={setTheme} />
    </div>
  );
}

// ─── 헤더: 로고 / 알약 모양 메뉴 / 검색(⌘K) / 로그인 ─────────────────────
function MockHeader() {
  const items = ["소행성", "외계행성", "크기 비교"];
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        <a className="flex items-center gap-2 font-semibold tracking-tight" href="#">
          <span className="grid size-8 place-items-center rounded-lg mock-accent-tint">
            <Orbit className="size-4.5" />
          </span>
          <span className="hidden sm:inline">Cosmic Watch</span>
        </a>

        <nav className="ml-2 hidden items-center gap-1 rounded-full border border-line bg-panel/70 p-1 md:flex">
          {items.map((label, i) => (
            <a
              key={label}
              href="#"
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                i === 0 ? "bg-sodium text-ink" : "text-dim hover:text-bone",
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        <button className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-line bg-panel/70 px-3 text-sm text-dim transition-colors hover:text-bone md:w-72">
          <Search className="size-4" />
          <span className="hidden md:inline">소행성·외계행성 검색</span>
          <kbd className="ml-auto hidden rounded border border-line px-1.5 font-mono text-[11px] md:inline">Ctrl K</kbd>
        </button>
        <Button variant="outline" size="sm">
          로그인
        </Button>
      </div>
    </header>
  );
}

// ─── 날짜 이동 알약 ───────────────────────────────────────────────────
function DatePill({ date }: { date: string }) {
  return (
    <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-line bg-panel/80 p-1 backdrop-blur">
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="이전 날짜">
        <ChevronLeft />
      </Button>
      <button className="flex items-center gap-2 rounded-full px-3 py-1 font-mono text-sm hover:bg-line/60">
        <CalendarDays className="size-4 text-dim" />
        {date} <span className="text-dim">(월)</span>
      </button>
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="다음 날짜">
        <ChevronRight />
      </Button>
      <span className="mx-1 h-5 w-px bg-line" />
      <button className="rounded-full px-3 py-1 text-sm text-sodium hover:bg-line/60">오늘</button>
    </div>
  );
}

// ─── 다음 접근 카운트다운 (오늘을 볼 때만 노출 ─ 03 문서 6.1절) ─────────
function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, MOCK_NEXT_APPROACH.at - now);
  const parts = [
    { v: Math.floor(left / 86_400_000), l: "일" },
    { v: Math.floor(left / 3_600_000) % 24, l: "시간" },
    { v: Math.floor(left / 60_000) % 60, l: "분" },
    { v: Math.floor(left / 1000) % 60, l: "초" },
  ];

  return (
    <div className="rounded-xl border border-line bg-panel/80 p-5 backdrop-blur lg:min-w-95">
      <div className="text-xs font-medium tracking-[0.12em] text-dim uppercase">다음 접근까지</div>
      <div className="mt-3 flex items-end gap-3">
        {parts.map((p) => (
          <div key={p.l} className="text-center">
            <div className="font-mono text-4xl leading-none font-medium tabular-nums">
              {String(p.v).padStart(2, "0")}
            </div>
            <div className="mt-1.5 text-[11px] text-dim">{p.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="font-medium">{MOCK_NEXT_APPROACH.name}</span>
        <span className="font-mono text-hazard">{MOCK_NEXT_APPROACH.miss_distance_ld} LD 예정</span>
      </div>
    </div>
  );
}

// ─── 요약 카드 ────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  unit,
  sub,
  hazard = false,
}: {
  icon: React.ReactNode;
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

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dim">{label}</span>
      {children}
    </div>
  );
}

// ─── 목록 한 줄 ───────────────────────────────────────────────────────
function NeoRow({
  neo,
  subUnit,
  active,
  onHover,
}: {
  neo: NeoDashboardItem;
  subUnit: SubUnit;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const ld = neo.approach.miss_distance_ld;
  const nearMoon = ld !== null && ld < HAZARD_THRESHOLD_LD;
  const diameter = fmtDiameter(neo.diameter_min_m, neo.diameter_max_m);

  return (
    <li
      onMouseEnter={() => onHover(neo.nasa_id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group relative grid cursor-pointer grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-b border-line px-5 py-4 transition-colors last:border-b-0",
        active ? "bg-line/40" : "hover:bg-line/40",
      )}
    >
      {/* 위험 분류는 왼쪽 세로 띠 + 아이콘 + 글자 3중 표시 (03 문서 9장 ─ 색만으로 구분하지 않는다) */}
      {neo.is_hazardous && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-hazard" />}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold">{neo.name}</span>
          {neo.is_hazardous && (
            <Badge variant="outline" className="gap-1 border-hazard/50 text-hazard">
              <TriangleAlert className="size-3" />
              잠재적 위험
            </Badge>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-dim">
          <span>
            추정 직경 <span className="font-mono text-bone">{diameter ?? "—"}</span>
            {diameter && <span className="font-mono text-xs"> m</span>}
          </span>
          <span>
            상대속도{" "}
            <span className="font-mono text-bone">
              {neo.approach.velocity_km_s === null ? "—" : nf2.format(neo.approach.velocity_km_s)}
            </span>
            <span className="font-mono text-xs"> km/s</span>
          </span>
          <span>
            최근접 <span className="font-mono text-bone">{fmtKstTime(neo.approach.datetime_utc)}</span>
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className={cn("font-mono text-2xl font-medium tabular-nums", nearMoon && "text-hazard")}>
          {ld === null ? "—" : nf2.format(ld)}
          <span className="ml-1 text-sm text-dim">LD</span>
        </div>
        <div className="mt-1 font-mono text-xs text-dim">{fmtSub(neo, subUnit)}</div>
      </div>

      <ArrowUpRight className="absolute top-4 right-1 size-3.5 text-dim opacity-0 transition-opacity group-hover:opacity-100" />
    </li>
  );
}

// ─── 차트 공통 ────────────────────────────────────────────────────────
interface ChartPoint {
  id: string;
  name: string;
  ld: number;
  x: number;
  y: number;
  size: number;
  clamped: boolean;
  nearMoon: boolean;
}

function toPoints(results: NeoDashboardItem[], y: (n: NeoDashboardItem) => number): ChartPoint[] {
  return results
    .filter((n) => n.approach.miss_distance_ld !== null)
    .map((n) => {
      const ld = n.approach.miss_distance_ld as number; // 위 filter로 null 제외됨
      return {
        id: n.nasa_id,
        name: n.name,
        ld,
        x: clampLd(ld),
        y: y(n),
        size: n.diameter_max_m ?? 10,
        clamped: ld < LD_MIN || ld > LD_MAX,
        nearMoon: ld < HAZARD_THRESHOLD_LD,
      };
    });
}

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
      <div className="font-medium">{p.name}</div>
      <div className="font-mono text-dim">{nf2.format(p.ld)} LD</div>
    </div>
  );
}

const axisTick = { fill: "var(--dim)", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" };

// ─── 달 거리 스케일 (1차원 로그 자) ────────────────────────────────────
function LunarScale({
  results,
  hoveredId,
  onHover,
}: {
  results: NeoDashboardItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const points = toPoints(results, () => 0);
  return (
    <ResponsiveContainer width="100%" height={96}>
      <ScatterChart margin={{ top: 24, right: 32, bottom: 4, left: 24 }}>
        <XAxis
          type="number"
          dataKey="x"
          scale="log"
          domain={[LD_MIN, LD_MAX]}
          ticks={[0.1, 1, 10, 100, 500]}
          allowDataOverflow
          interval={0}
          tickFormatter={(v: number) => `${v} LD`}
          stroke="var(--line)"
          tick={axisTick}
          tickLine={false}
        />
        <YAxis type="number" dataKey="y" domain={[-1, 1]} hide />
        <ReferenceLine
          x={1}
          stroke="var(--dim)"
          strokeDasharray="4 4"
          label={{ value: "달 궤도", position: "top", fill: "var(--dim)", fontSize: 11 }}
        />
        <Tooltip content={<PointTooltip />} cursor={false} isAnimationActive={false} />
        <Scatter
          data={points}
          isAnimationActive={false}
          shape={(props: unknown) => {
            const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartPoint };
            const color = payload.nearMoon ? "var(--hazard)" : "var(--sodium)";
            const active = payload.id === hoveredId;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={active ? 8 : 5.5}
                fill={payload.clamped ? "none" : color}
                fillOpacity={active ? 1 : 0.85}
                stroke={color}
                strokeWidth={payload.clamped ? 1.5 : active ? 3 : 0}
                strokeOpacity={0.35}
                onMouseEnter={() => onHover(payload.id)}
                onMouseLeave={() => onHover(null)}
              />
            );
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─── 거리 × 속도 산점도 (03 문서 6.1절 ─ 4개 변수를 한 차트에) ──────────
function DistanceVelocityChart({
  results,
  hoveredId,
  onHover,
}: {
  results: NeoDashboardItem[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  const points = toPoints(results, (n) => n.approach.velocity_km_s ?? 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" />
        <XAxis
          type="number"
          dataKey="x"
          scale="log"
          domain={[LD_MIN, LD_MAX]}
          ticks={[0.1, 1, 10, 100]}
          allowDataOverflow
          interval={0}
          tickFormatter={(v: number) => `${v}`}
          stroke="var(--line)"
          tick={axisTick}
          tickLine={false}
        />
        <YAxis type="number" dataKey="y" stroke="var(--line)" tick={axisTick} tickLine={false} unit="" width={44} />
        <ZAxis type="number" dataKey="size" range={[30, 420]} />
        <ReferenceLine x={1} stroke="var(--dim)" strokeDasharray="4 4" />
        <Tooltip content={<PointTooltip />} cursor={false} isAnimationActive={false} />
        <Scatter
          data={points}
          isAnimationActive={false}
          shape={(props: unknown) => {
            const { cx, cy, payload, width } = props as { cx: number; cy: number; payload: ChartPoint; width?: number };
            const r = Math.max(3, (width ?? 8) / 2);
            const color = payload.nearMoon ? "var(--hazard)" : "var(--sodium)";
            const active = payload.id === hoveredId;
            return (
              <circle
                cx={cx}
                cy={cy}
                r={active ? r + 2 : r}
                fill={color}
                fillOpacity={active ? 0.9 : 0.45}
                stroke={color}
                strokeWidth={1}
                onMouseEnter={() => onHover(payload.id)}
                onMouseLeave={() => onHover(null)}
              />
            );
          }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ─── 알아두면 좋은 것 (정적 FAQ) ──────────────────────────────────────
function Faq() {
  const items = [
    { q: "달 거리(LD)가 뭔가요?", a: "지구에서 달까지 평균 거리 384,400 km. 12 LD면 달보다 12배 멀다는 뜻이에요." },
    { q: "잠재적 위험 소행성이란?", a: "지구 궤도에 0.05 AU(약 19.5 LD) 이내로 다가올 수 있고 지름이 약 140 m 이상인 천체예요." },
    { q: "데이터는 어디서 오나요?", a: "NASA NeoWs API. 학습·포트폴리오 목적이며 실제 충돌 예측에 사용하지 마세요." },
  ];
  return (
    <div className="rounded-xl border border-line bg-panel/80 p-2 backdrop-blur">
      {items.map((it) => (
        <details key={it.q} className="group rounded-lg px-3 py-2.5 open:bg-line/40">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
            {it.q}
            <ChevronRight className="size-4 text-dim transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-dim">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

// ─── 하단 시안 전환 막대 (목업 전용) ──────────────────────────────────
function ThemeDock({ theme, onChange }: { theme: ThemeId; onChange: (t: ThemeId) => void }) {
  return (
    <div className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full border border-line bg-panel/90 p-1.5 backdrop-blur-xl">
        <span className="px-3 text-xs text-dim">색 시안</span>
        {THEMES.map((t) => (
          <button
            key={t.id}
            title={t.hint}
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              theme === t.id ? "bg-sodium text-ink" : "text-dim hover:text-bone",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MockupPage;
