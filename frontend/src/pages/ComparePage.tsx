// ═══════════════════════════════════════════════════════════════════
// ComparePage.tsx ─ Path = '/compare' (03 문서 6.4절, 01 문서 4.5절). 디자인은 /mockup?screen=compare 였다 (목업 폴더는 10-27 삭제 ─ git 기록에 있음)
//
// - 비교 대상은 주소에: /compare?exo=72,6400&neo=2099942 (utils/compareQuery.ts)
// - 전용 API 없음 → 대상마다 상세 API(#7 /neo/{id}/, #10 /exoplanets/{id}/)를 부른다 (04 문서 3.1절)
//   목록에서 고른 대상은 크기를 이미 알고 있으니 미리 넣어 둔다(cache) → 상세 API를 다시 안 부른다.
//   ⚠️ NEO 상세는 처음 열 때 NASA Lookup을 불러 스로틀(30회/시간)에 걸린다 → 아낄 수 있으면 아낀다
// - 지구는 항상 있다. 그림: 행성끼리 / 소행성끼리만 실제 비율, 둘 사이는 로그 눈금 한 줄로 잇는다
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Info, Plus } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { Panel } from "@/components/common/Panel";
import AddTargetPanel from "@/components/compare/AddTargetPanel";
import CompareTable from "@/components/compare/CompareTable";
import LogScaleStrip from "@/components/compare/LogScaleStrip";
import { AsteroidGroup, PlanetGroup } from "@/components/compare/SizeGroups";
import TargetChip from "@/components/compare/TargetChip";
import { earthToAsteroidRatio, type AsteroidTarget, type PlanetTarget } from "@/components/compare/types";
import { Button } from "@/components/ui/button";
import type { ExoplanetDetailResponse, NeoDetailResponse } from "@/types/api";
import { compareSearch, EARTH_RADIUS_KM, MAX_PER_GROUP, parseCompare, type CompareIds, type Kind } from "@/utils/compareQuery";

type Entry<T> = { ok: true; data: T } | { ok: false; error: AppError };
type Cache = { exo: Record<string, Entry<PlanetTarget>>; neo: Record<string, Entry<AsteroidTarget>> };

// 실패 칩 문구 ─ 왜 빠졌는지 짧게
function failLabel(kind: Kind, id: string, err: AppError): string {
  const what = kind === "exo" ? "외계행성" : "소행성";
  if (err.code === "NOT_FOUND") return `없는 ${what} (${id})`;
  if (err.code === "RATE_LIMITED") return `요청이 많아 잠시 멈춤 (${id})`;
  return `불러오지 못함 (${id})`;
}

/** 지구 ÷ 소행성 배수 → "약 1.3만 배" / "약 850배" */
function timesLabel(n: number): string {
  if (n >= 10_000) return `약 ${(n / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만 배`;
  return `약 ${Math.round(n).toLocaleString("ko-KR")}배`;
}

function ComparePage() {
  const [params, setParams] = useSearchParams();
  const ids = parseCompare(params);
  const exoKey = ids.exo.join(",");
  const neoKey = ids.neo.join(",");

  const [cache, setCache] = useState<Cache>({ exo: {}, neo: {} });
  const inflight = useRef(new Set<string>()); // "exo:72" ─ 같은 대상을 두 번 부르지 않게
  const [adding, setAdding] = useState<Kind | null>(null);

  // ─── 주소에 있는데 아직 모르는 대상만 상세 API로 받아 온다 ───
  useEffect(() => {
    const want: [Kind, string][] = [...exoKey.split(",").map((id) => ["exo", id] as [Kind, string]), ...neoKey.split(",").map((id) => ["neo", id] as [Kind, string])];
    for (const [kind, id] of want) {
      const k = `${kind}:${id}`;
      if (!id || cache[kind][id] || inflight.current.has(k)) continue;
      inflight.current.add(k);
      const req =
        kind === "exo"
          ? api.get<ExoplanetDetailResponse>(`/exoplanets/${id}/`).then((r): PlanetTarget => ({ id, name: r.data.planet_name, radiusEarth: r.data.radius_earth }))
          : api.get<NeoDetailResponse>(`/neo/${id}/`).then((r): AsteroidTarget => ({ id, name: r.data.name, minM: r.data.diameter_min_m, maxM: r.data.diameter_max_m }));
      req
        .then((data) => setCache((c) => ({ ...c, [kind]: { ...c[kind], [id]: { ok: true, data } } })))
        .catch((error: AppError) => setCache((c) => ({ ...c, [kind]: { ...c[kind], [id]: { ok: false, error } } })))
        .finally(() => inflight.current.delete(k));
    }
  }, [exoKey, neoKey, cache]);

  function setIds(next: CompareIds) {
    setParams(compareSearch(next), { replace: true });
  }

  function addPlanet(p: PlanetTarget) {
    if (ids.exo.includes(p.id) || ids.exo.length >= MAX_PER_GROUP) return;
    setCache((c) => ({ ...c, exo: { ...c.exo, [p.id]: { ok: true, data: p } } }));
    setIds({ ...ids, exo: [...ids.exo, p.id] });
  }
  function addAsteroid(a: AsteroidTarget) {
    if (ids.neo.includes(a.id) || ids.neo.length >= MAX_PER_GROUP) return;
    setCache((c) => ({ ...c, neo: { ...c.neo, [a.id]: { ok: true, data: a } } }));
    setIds({ ...ids, neo: [...ids.neo, a.id] });
  }
  function remove(kind: Kind, id: string) {
    setIds({ ...ids, [kind]: ids[kind].filter((x) => x !== id) });
  }
  // 실패한 대상 다시 부르기 ─ 캐시에서 지우면 위 useEffect가 다시 받아 온다
  function retry(kind: Kind, id: string) {
    setCache((c) => {
      const rest = { ...c[kind] };
      delete rest[id];
      return { ...c, [kind]: rest };
    });
  }

  // 그림·표에는 "받아 온" 대상만, 주소 순서대로
  const planets = ids.exo.flatMap((id) => {
    const e = cache.exo[id];
    return e?.ok ? [e.data] : [];
  });
  const asteroids = ids.neo.flatMap((id) => {
    const e = cache.neo[id];
    return e?.ok ? [e.data] : [];
  });
  const ratio = earthToAsteroidRatio(asteroids);

  return (
    <>
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">크기 비교</h1>
        <p className="mt-3 text-dim">지구를 기준으로 외계행성과 소행성의 크기를 나란히 놓아 봐요.</p>
      </section>

      {/* ─── 비교 대상 ─── */}
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-dim">비교 대상</span>
          <TargetChip label="지구" kind="earth" />
          {(["exo", "neo"] as const).flatMap((kind) =>
            ids[kind].map((id) => {
              const e = cache[kind][id];
              const chipKind = kind === "exo" ? "planet" : "asteroid";
              if (!e) return <TargetChip key={`${kind}:${id}`} label="불러오는 중…" kind={chipKind} state="loading" onRemove={() => remove(kind, id)} />;
              if (!e.ok)
                return (
                  <TargetChip
                    key={`${kind}:${id}`}
                    label={failLabel(kind, id, e.error)}
                    kind={chipKind}
                    state="error"
                    onRemove={() => remove(kind, id)}
                    onRetry={e.error.code === "NOT_FOUND" ? undefined : () => retry(kind, id)}
                  />
                );
              return <TargetChip key={`${kind}:${id}`} label={e.data.name} kind={chipKind} onRemove={() => remove(kind, id)} />;
            }),
          )}
          <div className="ml-auto flex gap-2">
            <AddButton label="외계행성" full={ids.exo.length >= MAX_PER_GROUP} active={adding === "exo"} onClick={() => setAdding(adding === "exo" ? null : "exo")} />
            <AddButton label="소행성" full={ids.neo.length >= MAX_PER_GROUP} active={adding === "neo"} onClick={() => setAdding(adding === "neo" ? null : "neo")} />
          </div>
        </div>
        {adding && (
          <AddTargetPanel
            key={adding}
            kind={adding}
            added={ids[adding]}
            full={ids[adding].length >= MAX_PER_GROUP}
            onAddPlanet={addPlanet}
            onAddAsteroid={addAsteroid}
            onClose={() => setAdding(null)}
          />
        )}
        {adding && ids[adding].length >= MAX_PER_GROUP && <p className="mt-2 text-xs text-dim">한 그룹에 {MAX_PER_GROUP}개까지 비교할 수 있어요. 하나를 빼면 더 넣을 수 있어요.</p>}
      </Panel>

      {/* ─── 그림 ─── */}
      <Panel className="mt-3">
        {/* 넓은 화면: 가로로 나란히 / 좁은 화면: 위아래로 (가로 스크롤 안에 소행성 그룹이 숨지 않게) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <PlanetGroup planets={planets} />

          {/* 두 그룹 사이 ─ 실제 비율이 아님을 숨기지 않는다 */}
          <div className="flex items-center gap-2 lg:flex-col lg:justify-center lg:px-2">
            <div className="h-px flex-1 border-t border-dashed border-line lg:h-auto lg:w-px lg:border-t-0 lg:border-l" />
            <div className="rounded-full border border-line px-3 py-1 text-center text-xs text-dim lg:max-w-28">
              {ratio === null ? "비율 아님" : <>지구가 {timesLabel(ratio)} · 비율 아님</>}
            </div>
            <div className="h-px flex-1 border-t border-dashed border-line lg:h-auto lg:w-px lg:border-t-0 lg:border-l" />
          </div>

          <AsteroidGroup asteroids={asteroids} />
        </div>

        <LogScaleStrip planets={planets} asteroids={asteroids} />

        <div className="mt-6 flex items-start gap-2 rounded-lg bg-line/40 p-3 text-sm text-dim">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            지구 반지름은 {EARTH_RADIUS_KM.toLocaleString("ko-KR")} km, 소행성은 수백 m 수준이라 실제 비율로 그리면 소행성이 1픽셀도 안 돼요. 그래서
            <span className="text-bone"> 행성끼리, 소행성끼리만 실제 비율</span>로 그리고 두 그룹은 따로 확대했어요. 둘 사이 차이는 아래
            <span className="text-bone"> 로그 눈금</span>(한 칸 = 10배)으로 보세요. 소행성은 정확한 크기를 몰라
            <span className="text-bone"> 안쪽 원 = 최솟값, 바깥 원 = 최댓값</span>으로 그립니다.
          </p>
        </div>
      </Panel>

      {/* ─── 표 ─── */}
      <CompareTable planets={planets} asteroids={asteroids} />
    </>
  );
}

function AddButton({ label, full, active, onClick }: { label: string; full: boolean; active: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? "secondary" : "outline"} size="sm" onClick={onClick} aria-expanded={active} disabled={full && !active} title={full ? `${label}은 ${MAX_PER_GROUP}개까지` : undefined}>
      <Plus /> {label}
    </Button>
  );
}

export default ComparePage;
