// ═══════════════════════════════════════════════════════════════════
// ExoplanetDetail.tsx ─ 목업 화면 4: 외계행성 상세 (/exoplanets/:id)
// 03 문서엔 와이어프레임이 없던 화면 (라우트 표 4장에만 있음). 응답: ExoplanetDetailResponse (04 문서 6.2절)
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Orbit, Ruler, Scale, Star, Thermometer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MOCK_EXO_DETAIL } from "../data";
import { DASH, dec2, int, raw } from "../format";
import { BackLink, Field, PageShell, Panel, PanelTitle, StatCard } from "../parts";

function ExoplanetDetail() {
  const p = MOCK_EXO_DETAIL;
  const star = p.host_star;
  const [saved, setSaved] = useState(p.is_watchlisted);

  return (
    <PageShell active="exoplanets" user="mingyu">
      <div className="pt-8">
        <BackLink label="외계행성 카탈로그" />
      </div>

      <section className="flex flex-wrap items-end justify-between gap-6 pt-6 pb-8">
        <div>
          <div className="mb-3 flex gap-2">
            <Badge variant="secondary">{p.discovery_method ?? DASH}</Badge>
            <Badge variant="outline" className="font-mono">
              {p.discovery_year ?? DASH} 발견
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{p.planet_name}</h1>
          <p className="mt-3 text-dim">
            {star.name} 계 · <span className="font-mono text-bone">{dec2(star.distance_ly)}</span> 광년{" "}
            <span className="font-mono">({raw(star.distance_pc, 3)} pc)</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={saved ? "secondary" : "default"} onClick={() => setSaved((v) => !v)} aria-pressed={saved}>
            <Star className={cn(saved && "fill-current")} />
            {saved ? "저장됨" : "관심 천체에 저장"}
          </Button>
          <Button variant="outline">지구와 크기 비교</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Ruler className="size-4" />} label="반지름" value={dec2(p.radius_earth)} unit="× 지구" sub="지구 = 1" />
        <StatCard icon={<Scale className="size-4" />} label="질량" value={dec2(p.mass_earth)} unit="× 지구" sub="지구 = 1" />
        <StatCard icon={<Thermometer className="size-4" />} label="평형 온도" value={int(p.equilibrium_temp_k)} unit="K" sub="참고: 물 어는점 273 K" />
        <StatCard icon={<Orbit className="size-4" />} label="공전 주기" value={dec2(p.orbital_period_days)} unit="일" sub="지구는 365.25일" />
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel>
          <PanelTitle title="지구와 나란히" sub="같은 축척 (행성끼리는 실제 비율)" />
          <EarthSideBySide radius={p.radius_earth} name={p.planet_name} />
        </Panel>

        <Panel>
          <PanelTitle title="모항성" sub={star.name} right={<Badge variant="outline" className="font-mono">{star.spectral_type ?? DASH}</Badge>} />
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            <Field label="표면 온도" value={int(star.temperature_k)} unit="K" sub="태양 5,772 K" />
            <Field label="반지름" value={raw(star.radius_solar, 4)} unit="× 태양" />
            <Field label="질량" value={raw(star.mass_solar, 4)} unit="× 태양" />
            <Field label="금속 함량" value={raw(star.metallicity, 2)} unit="[Fe/H]" sub="0 = 태양과 같음" />
            <Field label="표면 중력" value={raw(star.surface_gravity, 2)} unit="log g" />
            <Field label="거리" value={dec2(star.distance_ly)} unit="광년" />
          </div>
        </Panel>
      </section>

      {/* ─── 같은 별을 도는 행성 (sibling_planets) ─── */}
      <Panel className="mt-3">
        <PanelTitle title={`${star.name}의 다른 행성 ${p.sibling_planets.length}개`} sub="원 크기는 반지름 비율. 점선은 반지름이 측정되지 않은 행성" />
        <div className="flex flex-wrap items-end gap-6">
          <SiblingDot name={p.planet_name} radius={p.radius_earth} current />
          {p.sibling_planets.map((s) => (
            <SiblingDot key={s.id} name={s.planet_name} radius={s.radius_earth} />
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}

function EarthSideBySide({ radius, name }: { radius: number | null; name: string }) {
  const UNIT = 70; // 지구 반지름 = 70px
  const pr = radius === null ? null : radius * UNIT;
  const H = Math.max(UNIT, pr ?? 0) * 2 + 8;
  return (
    <div className="flex items-end justify-center gap-10" style={{ minHeight: H + 40 }}>
      <Body r={UNIT} label="지구" sub="1.00" muted />
      {pr === null ? <p className="text-sm text-dim">반지름 미측정</p> : <Body r={pr} label={name} sub={dec2(radius)} />}
    </div>
  );
}

function Body({ r, label, sub, muted = false }: { r: number; label: string; sub: string; muted?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={r * 2 + 4} height={r * 2 + 4} aria-hidden>
        <circle
          cx={r + 2}
          cy={r + 2}
          r={r}
          fill={muted ? "var(--line)" : "var(--signal)"}
          fillOpacity={muted ? 1 : 0.25}
          stroke={muted ? "var(--dim)" : "var(--signal)"}
        />
      </svg>
      <div className="text-center">
        <div className="text-sm font-medium">{label}</div>
        <div className="font-mono text-xs text-dim">{sub} × 지구</div>
      </div>
    </div>
  );
}

function SiblingDot({ name, radius, current = false }: { name: string; radius: number | null; current?: boolean }) {
  const r = radius === null ? 14 : radius * 18;
  return (
    <a href="#" className={cn("group flex flex-col items-center gap-2", current && "pointer-events-none")}>
      <svg width={r * 2 + 6} height={r * 2 + 6} aria-hidden>
        <circle
          cx={r + 3}
          cy={r + 3}
          r={r}
          fill={radius === null ? "none" : current ? "var(--signal)" : "var(--line)"}
          fillOpacity={current ? 0.35 : 1}
          stroke={current ? "var(--signal)" : "var(--dim)"}
          strokeDasharray={radius === null ? "3 3" : undefined}
          className="transition-colors group-hover:stroke-bone"
        />
      </svg>
      <div className="text-center">
        <div className={cn("text-sm", current ? "font-semibold text-signal" : "text-bone")}>{name.replace(/^.*\s/, "")}</div>
        <div className="font-mono text-xs text-dim">{radius === null ? DASH : dec2(radius)}</div>
      </div>
    </a>
  );
}

export default ExoplanetDetail;
