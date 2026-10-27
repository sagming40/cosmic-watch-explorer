// ═══════════════════════════════════════════════════════════════════
// Watchlist.tsx ─ 목업 화면 8: 내 관심 천체 (/watchlist, 로그인 필요) ─ 03 문서 시나리오 4
// - 소행성 / 외계행성 탭
// - 삭제는 확인창 없이 즉시 + "실행 취소" 5초 (저위험 동작이라)
// 응답: WatchlistResponse<NeoWatchlistItem | ExoplanetWatchlistItem> (04 문서 7장)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { CalendarClock, Orbit, Rocket, Trash2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ExoplanetWatchlistItem, NeoWatchlistItem } from "@/types/api";

import { MOCK_TODAY, MOCK_WATCH_EXO, MOCK_WATCH_NEO } from "../data";
import { DASH, daysFrom, dec2, diameterRange, kstDate, untilLabel } from "../format";
import { HazardBadge, PageShell, Panel } from "../parts";

const UNDO_SECONDS = 5;

type Removed = { kind: "neo"; item: NeoWatchlistItem; index: number } | { kind: "exo"; item: ExoplanetWatchlistItem; index: number };

function Watchlist() {
  const [neos, setNeos] = useState(MOCK_WATCH_NEO);
  const [exos, setExos] = useState(MOCK_WATCH_EXO);
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [left, setLeft] = useState(UNDO_SECONDS);

  // 실행 취소 카운트다운 ─ 0이 되면 토스트를 닫는다 (실제로는 이때가 아니라 클릭 즉시 DELETE가 나간다)
  useEffect(() => {
    if (!removed) return;
    const tick = setInterval(() => setLeft((s) => Math.max(1, s - 1)), 1000);
    const close = setTimeout(() => setRemoved(null), UNDO_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(close);
    };
  }, [removed]);

  function removeNeo(i: number) {
    setRemoved({ kind: "neo", item: neos[i], index: i });
    setLeft(UNDO_SECONDS);
    setNeos((l) => l.filter((_, j) => j !== i));
  }
  function removeExo(i: number) {
    setRemoved({ kind: "exo", item: exos[i], index: i });
    setLeft(UNDO_SECONDS);
    setExos((l) => l.filter((_, j) => j !== i));
  }
  function undo() {
    if (!removed) return;
    // 실행 취소 = 같은 대상으로 POST를 다시 보낸다 (DELETE가 항상 200이라 가능 ─ 04 문서 7.4절)
    if (removed.kind === "neo") {
      const { item, index } = removed;
      setNeos((l) => [...l.slice(0, index), item, ...l.slice(index)]);
    } else {
      const { item, index } = removed;
      setExos((l) => [...l.slice(0, index), item, ...l.slice(index)]);
    }
    setRemoved(null);
  }

  return (
    <PageShell active={null} user="mingyu">
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">내 관심 천체</h1>
        <p className="mt-3 text-dim">저장한 소행성의 다음 접근과 외계행성을 한곳에서 확인해요.</p>
      </section>

      <Tabs defaultValue="neo">
        <TabsList className="h-10 rounded-full p-1">
          <TabsTrigger value="neo" className="rounded-full px-4">
            소행성 <span className="ml-1 font-mono text-dim">{neos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="exo" className="rounded-full px-4">
            외계행성 <span className="ml-1 font-mono text-dim">{exos.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="neo" className="mt-4">
          {neos.length === 0 ? (
            <Empty icon={<Rocket className="size-6" />} text="저장한 소행성이 없습니다." action="오늘의 소행성 보기" />
          ) : (
            <Panel className="p-0 md:p-0">
              <ul>
                {neos.map((n, i) => (
                  <NeoItem key={n.nasa_id} item={n} onRemove={() => removeNeo(i)} />
                ))}
              </ul>
            </Panel>
          )}
        </TabsContent>

        <TabsContent value="exo" className="mt-4">
          {exos.length === 0 ? (
            <Empty icon={<Orbit className="size-6" />} text="저장한 외계행성이 없습니다." action="외계행성 카탈로그 보기" />
          ) : (
            <Panel className="p-0 md:p-0">
              <ul>
                {exos.map((e, i) => (
                  <ExoItem key={e.id} item={e} onRemove={() => removeExo(i)} />
                ))}
              </ul>
            </Panel>
          )}
        </TabsContent>
      </Tabs>

      {/* 실행 취소 토스트 */}
      {removed && (
        <div role="status" className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-full border border-line bg-panel py-2 pr-2 pl-5 text-sm">
            <span>
              <span className="font-medium">{removed.kind === "neo" ? removed.item.name : removed.item.planet_name}</span> 을(를) 삭제했어요
            </span>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={undo}>
              <Undo2 /> 실행 취소 <span className="font-mono text-dim">{left}</span>
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function NeoItem({ item, onRemove }: { item: NeoWatchlistItem; onRemove: () => void }) {
  const next = item.next_approach;
  const nextDate = next ? kstDate(next.datetime_utc) : null;
  const nearMoon = next?.miss_distance_ld !== null && next?.miss_distance_ld !== undefined && next.miss_distance_ld < 1;
  return (
    <li className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 hover:bg-line/30 md:px-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <a href="#" className="truncate font-semibold text-bone hover:underline">
            {item.name}
          </a>
          {item.is_hazardous && <HazardBadge />}
        </div>
        <div className="mt-1 text-sm text-dim">
          추정 직경 <span className="font-mono text-bone">{diameterRange(item.diameter_min_m, item.diameter_max_m) ?? DASH}</span> m · 저장{" "}
          <span className="font-mono">{kstDate(item.saved_at)}</span>
        </div>
      </div>

      {/* 다음 접근 ─ 화면 6의 "다음 접근 예정일" */}
      <div className="text-right">
        {next && nextDate ? (
          <>
            <div className="flex items-center justify-end gap-1.5 text-xs text-dim">
              <CalendarClock className="size-3.5" />
              다음 접근 · {untilLabel(daysFrom(MOCK_TODAY, nextDate))}
            </div>
            <div className="mt-0.5 font-mono">
              {nextDate}{" "}
              <span className={cn(nearMoon ? "text-hazard" : "text-dim")}>
                {dec2(next.miss_distance_ld)} LD
              </span>
            </div>
          </>
        ) : (
          <div className="text-sm text-dim">예정된 지구 접근 없음</div>
        )}
      </div>

      <RemoveButton label={item.name} onClick={onRemove} />
    </li>
  );
}

function ExoItem({ item, onRemove }: { item: ExoplanetWatchlistItem; onRemove: () => void }) {
  return (
    <li className="group grid grid-cols-[48px_minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 hover:bg-line/30 md:px-6">
      <svg viewBox="-24 -24 48 48" className="size-12" aria-hidden>
        <circle r={10} fill="none" stroke="var(--dim)" strokeDasharray="2 3" />
        {item.radius_earth !== null && <circle r={Math.min(22, item.radius_earth * 10)} fill="var(--signal)" fillOpacity={0.25} stroke="var(--signal)" />}
      </svg>
      <div className="min-w-0">
        <a href="#" className="truncate font-semibold text-bone hover:underline">
          {item.planet_name}
        </a>
        <div className="mt-1 text-sm text-dim">
          {item.host_star.name} · <span className="font-mono">{dec2(item.host_star.distance_ly)}</span> 광년
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-dim">반지름</div>
        <div className="font-mono">{item.radius_earth === null ? DASH : `${dec2(item.radius_earth)} × 지구`}</div>
      </div>
      <RemoveButton label={item.planet_name} onClick={onRemove} />
    </li>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`${label} 삭제`} onClick={onClick} className="text-dim hover:text-bone">
      <Trash2 />
    </Button>
  );
}

// 빈 화면은 막다른 길이 아니라 다음 행동을 안내하는 자리 (03 문서 7.1절)
function Empty({ icon, text, action }: { icon: React.ReactNode; text: string; action: string }) {
  return (
    <Panel className="flex flex-col items-center py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-line text-dim">{icon}</span>
      <p className="mt-4 font-medium">{text}</p>
      <p className="mt-1 text-sm text-dim">상세 화면의 ☆ 저장 버튼으로 추가할 수 있어요.</p>
      <Button variant="outline" className="mt-6">
        {action}
      </Button>
    </Panel>
  );
}

export default Watchlist;
