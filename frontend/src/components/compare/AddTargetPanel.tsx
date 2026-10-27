// AddTargetPanel.tsx ─ 비교 대상 추가 (03 문서 6.4절 [+ 소행성 추가] [+ 외계행성 추가])
//
// - 외계행성: 이름으로 검색 ─ 카탈로그 목록 API(#9)의 name 조건을 그대로 쓴다 (0.3초 기다렸다가)
// - 소행성: 소행성 "이름 검색" API는 없다 → 오늘 지구에 접근하는 소행성(#6 대시보드)에서 고른다.
//   다른 소행성은 상세 화면의 "크기 비교" 링크로 넣는다. 검색 API를 새로 만들지 않는 이유: 04 문서 3.1절(전용 API 없음)
// 목록에서 고르면 크기 정보가 이미 손에 있으므로 상세 API를 다시 부르지 않는다 (onAdd에 대상 그대로 넘김).

import { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { api, type AppError } from "@/api/client";
import type { AsteroidTarget, PlanetTarget } from "@/components/compare/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExoplanetListResponse, NeoDashboardResponse } from "@/types/api";
import { formatDate } from "@/utils/date";
import { DASH, dec2, diameterRange } from "@/utils/format";

const ERROR_TEXT = "목록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.";

interface AddTargetPanelProps {
  kind: "exo" | "neo";
  added: string[]; // 이미 들어간 id ─ "추가됨"으로 막는다
  full: boolean; // 그룹이 꽉 찼으면(MAX_PER_GROUP) 추가 버튼을 전부 끈다
  onAddPlanet: (p: PlanetTarget) => void;
  onAddAsteroid: (a: AsteroidTarget) => void;
  onClose: () => void;
}

function AddTargetPanel({ kind, added, full, onAddPlanet, onAddAsteroid, onClose }: AddTargetPanelProps) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{kind === "exo" ? "외계행성 추가" : "소행성 추가"}</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="추가 닫기">
          <X />
        </Button>
      </div>
      {kind === "exo" ? <ExoSearch added={added} full={full} onAdd={onAddPlanet} /> : <TodayAsteroids added={added} full={full} onAdd={onAddAsteroid} />}
    </div>
  );
}

// ─── 외계행성: 이름 검색 ─────────────────────────────────────────────
type ExoResult = { q: string; items: PlanetTarget[]; total: number } | { q: string; error: true };

function ExoSearch({ added, full, onAdd }: { added: string[]; full: boolean; onAdd: (p: PlanetTarget) => void }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<ExoResult | null>(null);
  const query = q.trim();

  useEffect(() => {
    if (!query) return;
    let ignore = false;
    const t = setTimeout(() => {
      api
        .get<ExoplanetListResponse>("/exoplanets/", { params: { name: query, page_size: 8 } })
        .then((res) => {
          const items = res.data.results.map((r) => ({ id: String(r.id), name: r.planet_name, radiusEarth: r.radius_earth }));
          if (!ignore) setResult({ q: query, items, total: res.data.count });
        })
        .catch(() => {
          if (!ignore) setResult({ q: query, error: true });
        });
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [query]);

  const shown = result?.q === query ? result : null;
  return (
    <div>
      <label className="relative block">
        <span className="sr-only">외계행성 이름</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="행성 이름 (예: TRAPPIST, Kepler-62)" className="pl-9" />
      </label>
      <div className="mt-2" aria-live="polite">
        {!query && <p className="py-2 text-sm text-dim">이름 일부만 입력해도 돼요.</p>}
        {query && !shown && <p className="py-2 text-sm text-dim">찾는 중…</p>}
        {shown && "error" in shown && <p className="py-2 text-sm text-dim">{ERROR_TEXT}</p>}
        {shown && "items" in shown && (
          <>
            {shown.items.length === 0 ? (
              <p className="py-2 text-sm text-dim">"{query}"이(가) 들어간 행성이 없어요.</p>
            ) : (
              <ul className="grid gap-1 sm:grid-cols-2">
                {shown.items.map((p) => (
                  <PickRow
                    key={p.id}
                    name={p.name}
                    sub={p.radiusEarth === null ? "반지름 미측정" : `반지름 ${dec2(p.radiusEarth)} × 지구`}
                    added={added.includes(p.id)}
                    full={full}
                    onAdd={() => onAdd(p)}
                  />
                ))}
              </ul>
            )}
            {shown.total > shown.items.length && <p className="mt-2 text-xs text-dim">{shown.total.toLocaleString("ko-KR")}건 중 8건 ─ 이름을 더 입력해 좁혀 보세요.</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── 소행성: 오늘 접근하는 소행성에서 고르기 ───────────────────────────
type NeoResult = { items: AsteroidTarget[] } | { error: AppError };

function TodayAsteroids({ added, full, onAdd }: { added: string[]; full: boolean; onAdd: (a: AsteroidTarget) => void }) {
  const [result, setResult] = useState<NeoResult | null>(null);
  const [filter, setFilter] = useState("");
  const today = formatDate(new Date());

  useEffect(() => {
    let ignore = false;
    api
      .get<NeoDashboardResponse>("/neo/", { params: { date: today } })
      .then((res) => {
        // 같은 소행성이 하루에 두 번 나올 수는 없지만(접근 1건 = 줄 1개), 혹시 몰라 nasa_id로 한 번 거른다
        const seen = new Set<string>();
        const items = res.data.results
          .filter((r) => (seen.has(r.nasa_id) ? false : (seen.add(r.nasa_id), true)))
          .map((r) => ({ id: r.nasa_id, name: r.name, minM: r.diameter_min_m, maxM: r.diameter_max_m }));
        if (!ignore) setResult({ items });
      })
      .catch((error: AppError) => {
        if (!ignore) setResult({ error });
      });
    return () => {
      ignore = true;
    };
  }, [today]);

  const f = filter.trim().toLowerCase();
  return (
    <div>
      <p className="mb-2 text-sm text-dim">
        오늘(<span className="font-mono">{today}</span>) 지구에 접근하는 소행성이에요. 다른 소행성은 상세 화면의 "크기 비교"로 넣을 수 있어요.
      </p>
      {!result && <p className="py-2 text-sm text-dim">불러오는 중… (처음 조회하는 날짜는 NASA에서 받아와 몇 초 걸려요)</p>}
      {result && "error" in result && <p className="py-2 text-sm text-dim">{ERROR_TEXT}</p>}
      {result && "items" in result && (
        <>
          {result.items.length > 6 && (
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="이름으로 거르기" className="mb-2" aria-label="소행성 이름으로 거르기" />
          )}
          {result.items.length === 0 ? (
            <p className="py-2 text-sm text-dim">오늘은 접근하는 소행성이 없어요.</p>
          ) : (
            <ul className="grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2">
              {result.items
                .filter((a) => !f || a.name.toLowerCase().includes(f))
                .map((a) => (
                  <PickRow
                    key={a.id}
                    name={a.name}
                    sub={diameterRange(a.minM, a.maxM) === null ? `지름 ${DASH}` : `지름 ${diameterRange(a.minM, a.maxM)} m`}
                    added={added.includes(a.id)}
                    full={full}
                    onAdd={() => onAdd(a)}
                  />
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function PickRow({ name, sub, added, full, onAdd }: { name: string; sub: string; added: boolean; full: boolean; onAdd: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-line/40">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block font-mono text-xs text-dim">{sub}</span>
      </span>
      <Button size="sm" variant={added ? "ghost" : "outline"} disabled={added || full} onClick={onAdd} aria-label={added ? `${name} 추가됨` : `${name} 추가`}>
        {added ? "추가됨" : <><Plus /> 추가</>}
      </Button>
    </li>
  );
}

export default AddTargetPanel;
