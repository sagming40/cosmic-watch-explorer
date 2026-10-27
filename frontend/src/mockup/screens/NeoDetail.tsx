// ═══════════════════════════════════════════════════════════════════
// NeoDetail.tsx ─ 목업 화면 2: NEO 상세 (/neo/:id) ─ 03 문서 6.2절
// 응답: NeoDetailResponse (04 문서 5.2절)
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { ArrowUpRight, CalendarClock, Eye, Ruler, Sparkles, Star, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NeoApproachRow, OrbitalData } from "@/types/api";

import { MOCK_NEO_DETAIL, MOCK_TODAY } from "../data";
import { DASH, daysFrom, dec2, diameterRange, int, kstDate, kstDateTime, raw, untilLabel } from "../format";
import { BackLink, Field, PageShell, Panel, PanelTitle, StatCard } from "../parts";

const LD_MIN = 0.1;
const LD_MAX = 500;


function NeoDetail() {
  const neo = MOCK_NEO_DETAIL;
  const [saved, setSaved] = useState(neo.is_watchlisted);
  const next = neo.recent_approaches[0] ?? null;
  const diameter = diameterRange(neo.diameter_min_m, neo.diameter_max_m);

  return (
    <PageShell active="neo">
      <div className="pt-8">
        <BackLink label="오늘의 소행성 목록" />
      </div>

      {/* ─── 제목 영역 ─── */}
      <section className="flex flex-wrap items-end justify-between gap-6 pt-6 pb-8">
        <div className="min-w-0">
          {neo.is_hazardous && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-hazard/40 px-3 py-1 text-sm text-hazard">
              <TriangleAlert className="size-4" />
              잠재적 위험 소행성 (PHA)
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{neo.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-dim">
            <span>NASA ID {neo.nasa_id}</span>
            <span>명칭 {neo.designation ?? DASH}</span>
            <span>Sentry 감시 {neo.is_sentry_object ? "대상" : "아님"}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* 저장 버튼 ─ POST / DELETE 로 나뉜다 (04 문서 7.1절). 비로그인이면 /login?next= 로 */}
          <Button
            variant={saved ? "secondary" : "default"}
            onClick={() => setSaved((v) => !v)}
            aria-pressed={saved}
          >
            <Star className={cn(saved && "fill-current")} />
            {saved ? "저장됨" : "관심 천체에 저장"}
          </Button>
          {neo.jpl_url && (
            <Button variant="outline" asChild>
              <a href={neo.jpl_url} target="_blank" rel="noreferrer">
                NASA/JPL 원본
                <ArrowUpRight />
              </a>
            </Button>
          )}
        </div>
      </section>

      {/* ─── 요약 4칸 ─── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Ruler className="size-4" />} label="추정 직경" value={diameter ?? DASH} unit="m" sub="밝기로 추정한 범위" />
        <StatCard icon={<Sparkles className="size-4" />} label="절대등급" value={dec2(neo.absolute_magnitude)} unit="H" sub="작을수록 밝고 크다" />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          label="다음 접근"
          value={next ? kstDate(next.datetime_utc) : DASH}
          sub={next ? `${untilLabel(daysFrom(MOCK_TODAY, kstDate(next.datetime_utc)))} · ${dec2(next.miss_distance_ld)} LD · ${next.orbiting_body}` : "예정된 접근 없음"}
        />
        <StatCard
          icon={<Eye className="size-4" />}
          label="관측"
          value={int(neo.orbital_data?.observations_used ?? null)}
          unit="회"
          sub={neo.orbital_data ? `${int(neo.orbital_data.data_arc_days)}일 동안` : DASH}
        />
      </section>

      {/* ─── 궤도 / 크기·관측 ─── */}
      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel>
          <PanelTitle
            title="궤도"
            sub={neo.orbital_data?.orbit_class_description ?? undefined}
            right={
              neo.orbital_data?.orbit_class_type && (
                <Badge variant="outline" className="font-mono">
                  {neo.orbital_data.orbit_class_type}
                </Badge>
              )
            }
          />
          {neo.orbital_data ? (
            <>
              <OrbitDiagram orbit={neo.orbital_data} />
              <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
                <Field label="이심률" value={raw(neo.orbital_data.eccentricity, 4)} />
                <Field label="장반경" value={raw(neo.orbital_data.semi_major_axis_au, 4)} unit="AU" />
                <Field label="경사각" value={raw(neo.orbital_data.inclination_deg, 2)} unit="°" />
                <Field label="공전 주기" value={dec2(neo.orbital_data.orbital_period_days)} unit="일" />
                <Field label="근일점" value={raw(neo.orbital_data.perihelion_distance_au, 4)} unit="AU" />
                <Field label="원일점" value={raw(neo.orbital_data.aphelion_distance_au, 4)} unit="AU" />
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-dim">NASA가 아직 이 소행성의 궤도를 계산하지 않았어요.</p>
          )}
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel>
            <PanelTitle title="크기" sub="안쪽 원 = 최솟값, 바깥 원 = 최댓값" />
            <SizeCompare min={neo.diameter_min_m} max={neo.diameter_max_m} />
            <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm text-signal hover:underline">
              크기 비교에서 자세히 보기 <ArrowUpRight className="size-4" />
            </a>
          </Panel>

          {neo.orbital_data && (
            <Panel>
              <PanelTitle title="데이터 신뢰도" sub="관측 기간이 길고 횟수가 많을수록 궤도 예측이 정확해요" />
              <ObservationSpan orbit={neo.orbital_data} />
            </Panel>
          )}
        </div>
      </section>

      {/* ─── 접근 기록 ─── */}
      <Panel className="mt-3 p-0 md:p-0">
        <div className="p-5 pb-0 md:p-6 md:pb-0">
          <PanelTitle title="다음 접근 5건" sub="오늘 이후 가까운 순. 지난 기록까지 보려면 전체 기록에서" />
        </div>
        <ApproachTable rows={neo.recent_approaches} />
        {neo.approach_count > 5 && (
          <div className="border-t border-line p-4 text-center">
            <Button variant="ghost">전체 접근 기록 {int(neo.approach_count)}건 보기</Button>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}

// ─── 궤도 모식도 ─ 태양을 초점에 둔 타원 + 지구 궤도(1 AU) ──────────────
// 평면 투영 모식도다. 경사각은 무시하고, 축척만 실제 AU 비율을 따른다.
function OrbitDiagram({ orbit }: { orbit: OrbitalData }) {
  const a = orbit.semi_major_axis_au;
  const e = orbit.eccentricity;
  if (a === null || e === null || e >= 1) {
    return <p className="py-10 text-center text-sm text-dim">궤도 요소가 부족해 그림을 그릴 수 없어요.</p>;
  }
  const S = 100; // 1 AU = 100 (SVG 단위)
  const c = a * e; // 태양(초점) ↔ 타원 중심 거리
  const b = a * Math.sqrt(1 - e * e);
  const left = (-c - a) * S;
  const right = Math.max((a - c) * S, S);
  const half = Math.max(b * S, S) + 18;
  const pad = 24;
  const labelRoom = 110; // 오른쪽 "근일점 0.76" 글자 자리

  return (
    <svg
      viewBox={`${left - pad} ${-half} ${right - left + pad * 2 + labelRoom} ${half * 2}`}
      className="mx-auto h-auto max-h-80 w-full"
      role="img"
      aria-label={`궤도 모식도: 근일점 ${raw(orbit.perihelion_distance_au, 2)} AU, 원일점 ${raw(orbit.aphelion_distance_au, 2)} AU, 지구 궤도는 1 AU`}
    >
      {/* 지구 궤도 */}
      <circle cx={0} cy={0} r={S} fill="none" stroke="var(--dim)" strokeDasharray="3 5" strokeWidth={1} />
      <circle cx={0} cy={-S} r={4} fill="var(--bone)" />
      <text x={6} y={-S - 8} fill="var(--dim)" fontSize={13}>
        지구 궤도 (1 AU)
      </text>
      {/* 소행성 궤도 */}
      <ellipse cx={-c * S} cy={0} rx={a * S} ry={b * S} fill="none" stroke="var(--signal)" strokeWidth={1.75} />
      {/* 근일점·원일점 */}
      <circle cx={(a - c) * S} cy={0} r={3.5} fill="var(--signal)" />
      <text x={(a - c) * S + 8} y={-6} fill="var(--signal)" fontSize={13}>
        근일점 {raw(orbit.perihelion_distance_au, 2)}
      </text>
      <circle cx={(-c - a) * S} cy={0} r={3.5} fill="var(--signal)" />
      <text x={(-c - a) * S + 8} y={-6} fill="var(--signal)" fontSize={13}>
        원일점 {raw(orbit.aphelion_distance_au, 2)} AU
      </text>
      {/* 태양 */}
      <circle cx={0} cy={0} r={7} fill="var(--bone)" />
      <circle cx={0} cy={0} r={13} fill="none" stroke="var(--bone)" strokeOpacity={0.2} />
      <text x={0} y={30} fill="var(--dim)" fontSize={13} textAnchor="middle">
        태양
      </text>
      <text x={left - pad + 4} y={half - 6} fill="var(--dim)" fontSize={12}>
        평면 투영 모식도 · 경사각 {raw(orbit.inclination_deg, 1)}° 생략
      </text>
    </svg>
  );
}

// ─── 크기 ─ 이중 원 + 익숙한 물체(롯데월드타워 555 m)와 나란히 ───────────
function SizeCompare({ min, max }: { min: number | null; max: number | null }) {
  if (min === null || max === null) {
    return <p className="py-8 text-center text-sm text-dim">NASA가 크기를 추정하지 못한 소행성이에요.</p>;
  }
  const TOWER = 555;
  const H = 150; // 그림 높이(px) = 둘 중 큰 값
  const unit = H / Math.max(max, TOWER);
  return (
    <div className="flex items-end justify-center gap-10 pt-2">
      <div className="flex flex-col items-center gap-2">
        <svg width={max * unit + 4} height={max * unit + 4} aria-hidden>
          <circle cx={(max * unit) / 2 + 2} cy={(max * unit) / 2 + 2} r={(max * unit) / 2} fill="none" stroke="var(--signal)" strokeDasharray="4 4" />
          <circle cx={(max * unit) / 2 + 2} cy={(max * unit) / 2 + 2} r={(min * unit) / 2} fill="var(--signal)" fillOpacity={0.25} stroke="var(--signal)" />
        </svg>
        <div className="text-center">
          <div className="font-mono text-sm">{diameterRange(min, max)} m</div>
          <div className="text-xs text-dim">이 소행성</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 rounded-t-sm bg-line" style={{ height: TOWER * unit }} />
        <div className="text-center">
          <div className="font-mono text-sm">555 m</div>
          <div className="text-xs text-dim">롯데월드타워</div>
        </div>
      </div>
    </div>
  );
}

// ─── 관측 기간 막대 ───────────────────────────────────────────────────
function ObservationSpan({ orbit }: { orbit: OrbitalData }) {
  return (
    <div>
      <div className="relative h-2 rounded-full bg-line">
        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-signal/70" />
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-dim">
        <span>{orbit.first_observation_date ?? DASH}</span>
        <span>{orbit.last_observation_date ?? DASH}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Field label="관측 기간" value={int(orbit.data_arc_days)} unit="일" />
        <Field label="관측 횟수" value={int(orbit.observations_used)} unit="회" />
        <Field label="궤도 해" value={orbit.orbit_id ?? DASH} sub={orbit.orbit_determination_datetime_utc ? `${kstDateTime(orbit.orbit_determination_datetime_utc).slice(0, 10)} 계산` : undefined} />
      </div>
    </div>
  );
}

// ─── 접근 기록 표 (ApproachTable) ─ 상세 5건 / 더 보기 전체가 같은 모양 ─────
// 모바일에서는 표를 카드로 바꾸지 않고 가로 스크롤 (03 문서 8장)
function ApproachTable({ rows }: { rows: NeoApproachRow[] }) {
  const pct = (ld: number) => {
    const c = Math.max(LD_MIN, Math.min(LD_MAX, ld));
    return ((Math.log10(c) - Math.log10(LD_MIN)) / (Math.log10(LD_MAX) - Math.log10(LD_MIN))) * 100;
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-dim">
            <th className="px-5 py-3 font-medium md:px-6">일시 (KST)</th>
            <th className="px-3 py-3 font-medium">대상</th>
            <th className="px-3 py-3 font-medium">거리</th>
            <th className="px-3 py-3 text-right font-medium">km</th>
            <th className="px-5 py-3 text-right font-medium md:px-6">상대속도</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.datetime_utc} className="border-b border-line last:border-b-0 hover:bg-line/30">
              <td className="px-5 py-3.5 font-mono md:px-6">{kstDateTime(r.datetime_utc)}</td>
              <td className="px-3 py-3.5">
                <Badge variant={r.orbiting_body === "Earth" ? "secondary" : "outline"}>{r.orbiting_body}</Badge>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-16 font-mono">{dec2(r.miss_distance_ld)} LD</span>
                  {/* 미니 로그 막대 ─ 달 거리 스케일과 같은 눈금 */}
                  {r.miss_distance_ld !== null && (
                    <span className="relative hidden h-1 w-24 rounded-full bg-line sm:block">
                      <span className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-dim" style={{ left: `${pct(1)}%` }} />
                      <span className="absolute top-1/2 size-2 -translate-1/2 rounded-full bg-signal" style={{ left: `${pct(r.miss_distance_ld)}%` }} />
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-dim">{int(r.miss_distance_km)}</td>
              <td className="px-5 py-3.5 text-right font-mono md:px-6">{dec2(r.velocity_km_s)} km/s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NeoDetail;
