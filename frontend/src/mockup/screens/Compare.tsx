// ═══════════════════════════════════════════════════════════════════
// Compare.tsx ─ 목업 화면 5: 크기 비교 (/compare) ─ 03 문서 6.4절
// - 지구는 항상 있다(뺄 수 없는 기준)
// - 소행성은 이중 원(최소/최대) ─ 불확실성 자체를 보여준다
// - 그룹 안은 실제 비율, 두 그룹 사이는 실제 비율이 아님을 화면에 밝힌다
// 전용 API 없음 → 상세 API(#7, #10)를 대상 수만큼 호출 (04 문서 3.1절)
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Info, Lock, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DASH, dec2, diameterRange } from "../format";
import { PageShell, Panel, PanelTitle } from "../parts";

interface PlanetTarget {
  id: string;
  name: string;
  radiusEarth: number | null; // 지구 = 1
}
interface AsteroidTarget {
  id: string;
  name: string;
  minM: number | null;
  maxM: number | null;
}


const INIT_PLANETS: PlanetTarget[] = [
  { id: "4401", name: "TRAPPIST-1 e", radiusEarth: 0.92 },
  { id: "5121", name: "Teegarden's Star b", radiusEarth: 1.02 },
  { id: "4733", name: "LHS 1140 c", radiusEarth: 1.27 },
];
const INIT_ASTEROIDS: AsteroidTarget[] = [
  { id: "2357621", name: "357621 (2005 EG94)", minM: 455.57, maxM: 1018.67 },
  { id: "2099942", name: "99942 Apophis", minM: 310.2, maxM: 693.6 },
  { id: "3843128", name: "(2019 TU1)", minM: 21.3, maxM: 47.6 },
];

function Compare() {
  const [planets, setPlanets] = useState(INIT_PLANETS);
  const [asteroids, setAsteroids] = useState(INIT_ASTEROIDS);

  return (
    <PageShell active="compare">
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">크기 비교</h1>
        <p className="mt-3 text-dim">지구를 기준으로 외계행성과 소행성의 크기를 나란히 놓아 봐요.</p>
      </section>

      {/* ─── 비교 대상 ─── */}
      <Panel className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-dim">비교 대상</span>
        <Chip label="지구" locked />
        {planets.map((p) => (
          <Chip key={p.id} label={p.name} onRemove={() => setPlanets((l) => l.filter((x) => x.id !== p.id))} />
        ))}
        {asteroids.map((a) => (
          <Chip key={a.id} label={a.name} asteroid onRemove={() => setAsteroids((l) => l.filter((x) => x.id !== a.id))} />
        ))}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <Plus /> 외계행성
          </Button>
          <Button variant="outline" size="sm">
            <Plus /> 소행성
          </Button>
        </div>
      </Panel>

      {/* ─── 그림 ─── */}
      <Panel className="mt-3">
        {/* 넓은 화면: 가로로 나란히 / 좁은 화면: 위아래로 (가로 스크롤 안에 소행성 그룹이 숨지 않게) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <PlanetGroup planets={planets} />

          {/* 두 그룹 사이 ─ 실제 비율이 아님을 숨기지 않는다 */}
          <div className="flex items-center gap-2 lg:flex-col lg:justify-center lg:px-2">
            <div className="h-px flex-1 border-t border-dashed border-line lg:h-auto lg:w-px lg:border-t-0 lg:border-l" />
            <div className="rounded-full border border-line px-3 py-1 text-xs whitespace-nowrap text-dim">≈ 1만 배 차이 · 비율 아님</div>
            <div className="h-px flex-1 border-t border-dashed border-line lg:h-auto lg:w-px lg:border-t-0 lg:border-l" />
          </div>

          <AsteroidGroup asteroids={asteroids} />
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-lg bg-line/40 p-3 text-sm text-dim">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            지구 반지름은 6,371 km, 소행성은 수백 m 수준이라 실제 비율로 그리면 소행성이 1픽셀도 안 돼요. 그래서
            <span className="text-bone"> 행성끼리, 소행성끼리만 실제 비율</span>로 그리고 두 그룹은 따로 확대했어요. 소행성은 정확한 크기를 몰라
            <span className="text-bone"> 안쪽 원 = 최솟값, 바깥 원 = 최댓값</span>으로 그립니다.
          </p>
        </div>
      </Panel>

      {/* ─── 표 ─── */}
      <Panel className="mt-3 p-0 md:p-0">
        <div className="p-5 pb-0 md:p-6 md:pb-0">
          <PanelTitle title="수치로 보기" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-130 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-dim">
                <th className="px-5 py-3 font-medium md:px-6">이름</th>
                <th className="px-3 py-3 font-medium">종류</th>
                <th className="px-5 py-3 text-right font-medium md:px-6">크기</th>
              </tr>
            </thead>
            <tbody>
              <Row name="지구" kind="기준" size="반지름 6,371 km" />
              {planets.map((p) => (
                <Row
                  key={p.id}
                  name={p.name}
                  kind="외계행성"
                  size={p.radiusEarth === null ? DASH : `지구 반지름의 ${dec2(p.radiusEarth)}배`}
                />
              ))}
              {asteroids.map((a) => (
                <Row key={a.id} name={a.name} kind="소행성" size={diameterRange(a.minM, a.maxM) ? `지름 ${diameterRange(a.minM, a.maxM)} m` : DASH} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>
  );
}

function Chip({ label, locked = false, asteroid = false, onRemove }: { label: string; locked?: boolean; asteroid?: boolean; onRemove?: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-line bg-line/40 py-1 pr-1.5 pl-3 text-sm">
      <span className={asteroid ? "size-2 rounded-full border border-signal" : "size-2 rounded-full bg-signal"} />
      {label}
      {locked ? (
        <span className="grid size-5 place-items-center text-dim" title="지구는 기준이라 뺄 수 없어요">
          <Lock className="size-3" />
        </span>
      ) : (
        <button onClick={onRemove} aria-label={`${label} 빼기`} className="grid size-5 place-items-center rounded-full text-dim hover:bg-line hover:text-bone">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

// 행성 그룹 ─ 지구 반지름 = 60px, 같은 축척
function PlanetGroup({ planets }: { planets: PlanetTarget[] }) {
  const UNIT = 48;
  return (
    <div className="min-w-0 lg:flex-1">
      <div className="mb-4 text-xs text-dim">행성 · 실제 비율</div>
      <div className="flex items-end gap-6 overflow-x-auto pb-1">
        <Disc r={UNIT} name="지구" sub="1.00" earth />
        {planets.map((p) =>
          p.radiusEarth === null ? (
            <Disc key={p.id} r={UNIT * 0.6} name={p.name} sub={DASH} unknown />
          ) : (
            <Disc key={p.id} r={UNIT * p.radiusEarth} name={p.name} sub={dec2(p.radiusEarth)} />
          ),
        )}
      </div>
    </div>
  );
}

// 소행성 그룹 ─ 가장 큰 최댓값이 반지름 60px이 되도록, 같은 축척
function AsteroidGroup({ asteroids }: { asteroids: AsteroidTarget[] }) {
  const largest = Math.max(1, ...asteroids.map((a) => a.maxM ?? 0));
  const unit = 96 / largest; // 지름 기준 (가장 큰 소행성 지름 = 96px)
  return (
    <div className="min-w-0 lg:flex-1">
      <div className="mb-4 text-xs text-dim">소행성 · 실제 비율</div>
      <div className="flex items-end gap-6 overflow-x-auto pb-1">
        {asteroids.length === 0 && <p className="text-sm text-dim">추가한 소행성이 없어요.</p>}
        {asteroids.map((a) => {
          if (a.minM === null || a.maxM === null) return <Disc key={a.id} r={20} name={a.name} sub={DASH} unknown />;
          const R = Math.max(2, (a.maxM * unit) / 2);
          const r = Math.max(1.5, (a.minM * unit) / 2);
          return (
            <div key={a.id} className="flex flex-col items-center gap-2">
              <svg width={R * 2 + 4} height={R * 2 + 4} aria-hidden>
                <circle cx={R + 2} cy={R + 2} r={R} fill="none" stroke="var(--signal)" strokeDasharray="4 3" />
                <circle cx={R + 2} cy={R + 2} r={r} fill="var(--signal)" fillOpacity={0.3} stroke="var(--signal)" />
              </svg>
              <Caption name={a.name} sub={`${diameterRange(a.minM, a.maxM)} m`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Disc({ r, name, sub, earth = false, unknown = false }: { r: number; name: string; sub: string; earth?: boolean; unknown?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={r * 2 + 4} height={r * 2 + 4} aria-hidden>
        <circle
          cx={r + 2}
          cy={r + 2}
          r={r}
          fill={earth ? "var(--line)" : unknown ? "none" : "var(--signal)"}
          fillOpacity={earth ? 1 : 0.25}
          stroke={earth ? "var(--dim)" : "var(--signal)"}
          strokeDasharray={unknown ? "3 3" : undefined}
        />
      </svg>
      <Caption name={name} sub={unknown ? "크기 미측정" : `${sub} × 지구`} />
    </div>
  );
}

function Caption({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="max-w-32 text-center">
      <div className="truncate text-sm font-medium">{name}</div>
      <div className="font-mono text-xs text-dim">{sub}</div>
    </div>
  );
}

function Row({ name, kind, size }: { name: string; kind: string; size: string }) {
  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-5 py-3 font-medium md:px-6">{name}</td>
      <td className="px-3 py-3 text-dim">{kind}</td>
      <td className="px-5 py-3 text-right font-mono md:px-6">{size}</td>
    </tr>
  );
}

export default Compare;
