// ═══════════════════════════════════════════════════════════════════
// WatchlistPage.tsx ─ Path = '/watchlist' (로그인 필요 ─ App.tsx의 ProtectedRoute)
// 03 문서 시나리오 4, 04 문서 7장. 디자인은 /mockup?screen=watchlist 였다 (목업 폴더는 10-27 삭제 ─ git 기록에 있음)
//
// - 소행성 / 외계행성 탭 ─ 지금 탭은 주소(?tab=exo)에 둔다 (새로고침·뒤로 가기에도 그 탭)
// - 삭제: 확인창 없이 즉시 DELETE + "실행 취소" 5초
//   실행 취소 = 같은 대상으로 POST를 다시 보낸다 (DELETE가 항상 200이라 가능 ─ 04 문서 7.4절)
//   ⚠️ 그래서 되돌린 항목의 saved_at은 "방금"이 된다 ─ 화면에선 원래 자리에 돌려놓지만,
//      새로고침하면 서버 정렬(최근 저장순)대로 맨 위로 올라간다.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Orbit, Rocket } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { loginPath } from "@/auth/next";
import { useAuth } from "@/auth/useAuth";
import { Panel } from "@/components/common/Panel";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExoWatchItem from "@/components/watchlist/ExoWatchItem";
import NeoWatchItem from "@/components/watchlist/NeoWatchItem";
import UndoToast from "@/components/watchlist/UndoToast";
import WatchlistEmpty from "@/components/watchlist/WatchlistEmpty";
import type { ExoplanetWatchlistItem, NeoWatchlistItem, WatchlistResponse } from "@/types/api";
import { formatDate } from "@/utils/date";

const UNDO_SECONDS = 5;

type Lists = { neo: NeoWatchlistItem[]; exo: ExoplanetWatchlistItem[] };
type Loaded = { key: string; lists: Lists; error: null } | { key: string; lists: null; error: AppError };

// 지운 항목 ─ 실행 취소 때 "무엇을, 어느 자리에" 돌려놓을지 기억해 둔다
type Entry = { kind: "neo"; item: NeoWatchlistItem; index: number } | { kind: "exo"; item: ExoplanetWatchlistItem; index: number };
type Removed = Entry & {
  id: number; // 토스트 구분용 ─ 연달아 지우면 타이머를 새로 시작한다
  deleting: Promise<unknown>; // 실행 취소는 이 DELETE가 끝난 뒤에 POST한다 (순서가 뒤집히면 되살린 걸 DELETE가 다시 지운다)
  error: string | null;
};

let toastSeq = 0;

function insertAt<T>(list: T[], index: number, item: T): T[] {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

function WatchlistPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "exo" ? "exo" : "neo";

  const [retry, setRetry] = useState(0);
  const key = String(retry);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);

  const [removed, setRemoved] = useState<Removed | null>(null);
  const [left, setLeft] = useState(UNDO_SECONDS);
  const [undoing, setUndoing] = useState(false);

  // 세션이 만료된 경우(401) ─ 화면의 로그인 상태부터 지운다.
  // 안 지우면 로그인 화면이 "이미 로그인됨"으로 보고 next(/watchlist)로 바로 돌려보내 둘이 핑퐁한다.
  async function sessionExpired() {
    await logout().catch(() => {});
    navigate(loginPath("/watchlist"), { replace: true });
  }

  // ─── 목록 두 개를 한 번에 ─ 탭 숫자(소행성 3 · 외계행성 2)를 처음부터 보여주려고 ───
  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get<WatchlistResponse<NeoWatchlistItem>>("/watchlist/neo/"),
      api.get<WatchlistResponse<ExoplanetWatchlistItem>>("/watchlist/exoplanets/"),
    ])
      .then(([neo, exo]) => {
        if (!ignore) setLoaded({ key, lists: { neo: neo.data.results, exo: exo.data.results }, error: null });
      })
      .catch((err: AppError) => {
        if (ignore) return;
        if (err.code === "AUTH_REQUIRED") {
          logout()
            .catch(() => {})
            .then(() => navigate(loginPath("/watchlist"), { replace: true }));
          return;
        }
        setLoaded({ key, lists: null, error: err });
      });
    const slow = setTimeout(() => setSlowKey(key), 3000);
    return () => {
      ignore = true;
      clearTimeout(slow);
    };
  }, [key, logout, navigate]);

  // ─── 실행 취소 카운트다운 ─ 5초 뒤 토스트를 닫는다 (DELETE는 이미 클릭 즉시 나갔다) ───
  const toastId = removed?.id;
  useEffect(() => {
    if (toastId === undefined) return;
    const tick = setInterval(() => setLeft((s) => Math.max(1, s - 1)), 1000);
    const close = setTimeout(() => setRemoved((r) => (r?.id === toastId ? null : r)), UNDO_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(close);
    };
  }, [toastId]);

  const isLoading = loaded?.key !== key;
  const lists = !isLoading ? loaded?.lists ?? null : null;
  const error = !isLoading ? loaded?.error ?? null : null;

  function updateLists(fn: (l: Lists) => Lists) {
    setLoaded((prev) => (prev && prev.lists ? { ...prev, lists: fn(prev.lists) } : prev));
  }

  // 화면에 다시 끼워 넣기 (실행 취소 성공 / 삭제 실패 둘 다)
  function restore(r: Entry) {
    if (r.kind === "neo") updateLists((l) => ({ ...l, neo: insertAt(l.neo, r.index, r.item) }));
    else updateLists((l) => ({ ...l, exo: insertAt(l.exo, r.index, r.item) }));
  }

  function remove(target: { kind: "neo"; index: number } | { kind: "exo"; index: number }) {
    if (!lists) return;
    const id = ++toastSeq;
    const base =
      target.kind === "neo"
        ? ({ kind: "neo", item: lists.neo[target.index] } as const)
        : ({ kind: "exo", item: lists.exo[target.index] } as const);
    const url = base.kind === "neo" ? `/watchlist/neo/${base.item.nasa_id}/` : `/watchlist/exoplanets/${base.item.id}/`;

    const deleting = api.delete(url).catch((err: AppError) => {
      if (err.code === "AUTH_REQUIRED") return sessionExpired();
      // 서버엔 남아 있다 ─ 화면도 되돌리고 알린다
      restore({ ...base, index: target.index });
      setRemoved((r) => (r?.id === id ? { ...r, error: "삭제하지 못했어요. 잠시 후 다시 시도해 주세요." } : r));
    });

    if (base.kind === "neo") updateLists((l) => ({ ...l, neo: l.neo.filter((_, i) => i !== target.index) }));
    else updateLists((l) => ({ ...l, exo: l.exo.filter((_, i) => i !== target.index) }));
    setRemoved({ ...base, id, index: target.index, deleting, error: null });
    setLeft(UNDO_SECONDS);
  }

  async function undo() {
    if (!removed) return;
    const r = removed;
    setUndoing(true);
    try {
      await r.deleting;
      if (r.kind === "neo") {
        const res = await api.post<{ saved_at: string }>("/watchlist/neo/", { nasa_id: r.item.nasa_id });
        restore({ ...r, item: { ...r.item, saved_at: res.data.saved_at } });
      } else {
        const res = await api.post<{ saved_at: string }>("/watchlist/exoplanets/", { exoplanet_id: r.item.id });
        restore({ ...r, item: { ...r.item, saved_at: res.data.saved_at } });
      }
      setRemoved((cur) => (cur?.id === r.id ? null : cur));
    } catch (e) {
      const err = e as AppError;
      if (err.code === "AUTH_REQUIRED") return sessionExpired();
      if (err.code === "ALREADY_EXISTS") {
        restore(r); // 다른 탭에서 다시 저장한 경우 ─ 결과적으로 "저장돼 있음"이 맞다
        setRemoved((cur) => (cur?.id === r.id ? null : cur));
      } else {
        setRemoved((cur) => (cur?.id === r.id ? { ...cur, error: "되돌리지 못했어요. 상세 화면에서 다시 저장해 주세요." } : cur));
      }
    } finally {
      setUndoing(false);
    }
  }

  const today = formatDate(new Date());

  return (
    <>
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">내 관심 천체</h1>
        <p className="mt-3 text-dim">저장한 소행성의 다음 접근과 외계행성을 한곳에서 확인해요.</p>
      </section>

      {isLoading && <LoadingState slow={slowKey === key} blocks={["h-10 w-60", "h-64"]} />}
      {error && <ErrorState error={error} onRetry={() => setRetry((n) => n + 1)} />}

      {lists && (
        <Tabs value={tab} onValueChange={(v) => setParams(v === "exo" ? { tab: "exo" } : {}, { replace: true })}>
          <TabsList className="h-10 rounded-full p-1">
            <TabsTrigger value="neo" className="rounded-full px-4">
              소행성 <span className="ml-1 font-mono text-dim">{lists.neo.length}</span>
            </TabsTrigger>
            <TabsTrigger value="exo" className="rounded-full px-4">
              외계행성 <span className="ml-1 font-mono text-dim">{lists.exo.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="neo" className="mt-4">
            {lists.neo.length === 0 ? (
              <WatchlistEmpty icon={<Rocket className="size-6" />} text="저장한 소행성이 없습니다." to="/" action="오늘의 소행성 보기" />
            ) : (
              <Panel className="p-0 md:p-0">
                <ul>
                  {lists.neo.map((n, i) => (
                    <NeoWatchItem key={n.nasa_id} item={n} today={today} onRemove={() => remove({ kind: "neo", index: i })} />
                  ))}
                </ul>
              </Panel>
            )}
          </TabsContent>

          <TabsContent value="exo" className="mt-4">
            {lists.exo.length === 0 ? (
              <WatchlistEmpty icon={<Orbit className="size-6" />} text="저장한 외계행성이 없습니다." to="/exoplanets" action="외계행성 카탈로그 보기" />
            ) : (
              <Panel className="p-0 md:p-0">
                <ul>
                  {lists.exo.map((e, i) => (
                    <ExoWatchItem key={e.id} item={e} onRemove={() => remove({ kind: "exo", index: i })} />
                  ))}
                </ul>
              </Panel>
            )}
          </TabsContent>
        </Tabs>
      )}

      {removed && (
        <UndoToast
          name={removed.kind === "neo" ? removed.item.name : removed.item.planet_name}
          secondsLeft={left}
          busy={undoing}
          error={removed.error}
          onUndo={undo}
        />
      )}
    </>
  );
}

export default WatchlistPage;
