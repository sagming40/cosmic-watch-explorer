// ═══════════════════════════════════════════════════════════════════
// NeoDetailPage.tsx ─ Path = '/neo/:id' (03 문서 6.2절, 04 문서 5.2·5.3절)
// 10-27 /mockup 디자인 + 실제 API로 구현.
// - 처음 보는 소행성이면 서버가 이 순간 NASA Lookup을 부른다 → 몇 초 걸릴 수 있다 (3초 안내)
// - "다음 접근 5건"은 미래 기준 (5.2 설계 결정 ③), 전체 기록은 과거→미래 순 (5.3)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowUpRight, CalendarClock, ChevronDown, ChevronLeft, Eye, Ruler, Sparkles, TriangleAlert } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { Panel, PanelTitle } from "@/components/common/Panel";
import StatCard from "@/components/common/StatCard";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import WatchlistButton from "@/components/common/WatchlistButton";
import ApproachTable from "@/components/neo/ApproachTable";
import NeoSizePanel from "@/components/neo/NeoSizePanel";
import ObservationPanel from "@/components/neo/ObservationPanel";
import OrbitPanel from "@/components/neo/OrbitPanel";
import { Button } from "@/components/ui/button";
import type { NeoApproachListResponse, NeoApproachRow, NeoDetailResponse } from "@/types/api";
import { formatDate } from "@/utils/date";
import { DASH, daysFrom, dec2, diameterRange, int, kstDate, untilLabel } from "@/utils/format";

const RECENT_LIMIT = 5; // 상세 응답의 recent_approaches 개수 (백엔드 RECENT_APPROACH_LIMIT과 같은 값)

type Loaded = { key: string; data: NeoDetailResponse; error: null } | { key: string; data: null; error: AppError };

function NeoDetailPage() {
  // useParams = 주소 "/neo/2357621"에서 :id 자리 값(2357621)을 꺼낸다
  const { id = "" } = useParams();
  const [retry, setRetry] = useState(0);
  const key = `${id}:${retry}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);

  // 대시보드와 같은 방식 ─ 로딩 여부는 "받아 둔 결과의 key ≠ 지금 key"로 계산 (effect 안에서 바로 setState 하지 않는다)
  useEffect(() => {
    let ignore = false;
    api
      .get<NeoDetailResponse>(`/neo/${encodeURIComponent(id)}/`)
      .then((res) => {
        if (!ignore) setLoaded({ key, data: res.data, error: null });
      })
      .catch((err: AppError) => {
        if (!ignore) setLoaded({ key, data: null, error: err });
      });
    const slow = setTimeout(() => setSlowKey(key), 3000);
    return () => {
      ignore = true;
      clearTimeout(slow);
    };
  }, [id, key]);

  const isLoading = loaded?.key !== key;
  const neo = !isLoading ? loaded?.data ?? null : null;
  const error = !isLoading ? loaded?.error ?? null : null;

  return (
    <>
      <div className="pt-8">
        <BackButton />
      </div>
      {isLoading && <LoadingState slow={slowKey === key} blocks={["h-28", "h-32", "h-96", "h-72"]} />}
      {error && <div className="pt-6"><ErrorState error={error} onRetry={() => setRetry((n) => n + 1)} /></div>}
      {/* key={id} ─ 다른 소행성으로 넘어가면 "전체 기록 펼침" 같은 안쪽 상태를 새로 시작 */}
      {neo && <NeoDetail key={neo.nasa_id} neo={neo} />}
    </>
  );
}

// 대시보드에서 들어왔으면 보던 날짜로 돌아가고(뒤로 가기), 주소로 바로 들어왔으면 대시보드로
function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromApp = location.key !== "default";
  return (
    <button
      type="button"
      onClick={() => (cameFromApp ? navigate(-1) : navigate("/"))}
      className="inline-flex items-center gap-1 text-sm text-dim transition-colors hover:text-bone"
    >
      <ChevronLeft className="size-4" />
      소행성 목록
    </button>
  );
}

function NeoDetail({ neo }: { neo: NeoDetailResponse }) {
  const next = neo.recent_approaches[0] ?? null;
  const today = formatDate(new Date());
  const diameter = diameterRange(neo.diameter_min_m, neo.diameter_max_m);

  return (
    <>
      {/* ─── 제목 ─── */}
      <section className="flex flex-wrap items-end justify-between gap-6 pt-6 pb-8">
        <div className="min-w-0">
          {neo.is_hazardous && (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-hazard/40 px-3 py-1 text-sm text-hazard">
              <TriangleAlert className="size-4" />
              잠재적 위험 소행성 (PHA)
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight break-words md:text-5xl">{neo.name}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm text-dim">
            <span>NASA ID {neo.nasa_id}</span>
            <span>명칭 {neo.designation ?? DASH}</span>
            <span>Sentry 감시 {neo.is_sentry_object ? "대상" : "아님"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <WatchlistButton target={{ kind: "neo", nasaId: neo.nasa_id }} initialSaved={neo.is_watchlisted} />
          {/* 데이터의 출처를 숨기지 않는다 ─ 원본 링크는 항상 노출 (03 문서 6.2절) */}
          {neo.jpl_url && (
            <Button variant="outline" asChild>
              <a href={neo.jpl_url} target="_blank" rel="noreferrer" className="text-bone">
                NASA/JPL 원본 <ArrowUpRight />
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
          sub={next ? `${untilLabel(daysFrom(today, kstDate(next.datetime_utc)))} · ${dec2(next.miss_distance_ld)} LD · ${next.orbiting_body}` : "예정된 접근 없음"}
        />
        <StatCard
          icon={<Eye className="size-4" />}
          label="관측"
          value={int(neo.orbital_data?.observations_used ?? null)}
          unit="회"
          sub={neo.orbital_data ? `${int(neo.orbital_data.data_arc_days)}일 동안` : DASH}
        />
      </section>

      {/* ─── 궤도 / 크기·신뢰도 ─── */}
      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <OrbitPanel orbit={neo.orbital_data} />
        <div className="flex flex-col gap-3">
          <NeoSizePanel nasaId={neo.nasa_id} min={neo.diameter_min_m} max={neo.diameter_max_m} />
          {neo.orbital_data && <ObservationPanel orbit={neo.orbital_data} />}
        </div>
      </section>

      {/* ─── 다음 접근 5건 + 전체 기록 ─── */}
      <Panel className="mt-3 p-0 md:p-0">
        <div className="p-5 pb-0 md:p-6 md:pb-0">
          <PanelTitle
            title={neo.recent_approaches.length > 0 ? `다음 접근 ${neo.recent_approaches.length}건` : "다음 접근"}
            sub={`오늘 이후 가까운 순, 최대 ${RECENT_LIMIT}건 (지구 외 행성 접근 포함)`}
          />
        </div>
        {neo.recent_approaches.length > 0 ? (
          <ApproachTable rows={neo.recent_approaches} />
        ) : (
          <p className="px-6 pb-8 text-sm text-dim">오늘 이후 예정된 접근이 없어요. 지난 기록은 전체 기록에서 볼 수 있어요.</p>
        )}
        {/* "더 보기"는 전체 기록이 5건보다 많을 때만 (04 문서 5.2절 설계 결정 ② / M3 완료 기준) */}
        {neo.approach_count > RECENT_LIMIT && <ApproachHistory nasaId={neo.nasa_id} total={neo.approach_count} />}
      </Panel>
    </>
  );
}

// ─── 전체 접근 기록 ─ 펼친 뒤 20건씩 이어 불러오기 (GET /api/neo/{id}/approaches/?page=N) ─────
// 요청은 버튼을 누를 때만 나간다 ─ 상세를 열 때마다 수백 건을 받지 않는다.
function ApproachHistory({ nasaId, total }: { nasaId: string; total: number }) {
  const [rows, setRows] = useState<NeoApproachRow[] | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  async function loadPage(n: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.get<NeoApproachListResponse>(`/neo/${encodeURIComponent(nasaId)}/approaches/`, { params: { page: n } });
      setRows((prev) => [...(n === 1 ? [] : prev ?? []), ...res.data.results]);
      setPage(res.data.page);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      setError(e as AppError);
    } finally {
      setBusy(false);
    }
  }

  if (rows === null) {
    return (
      <div className="border-t border-line p-4 text-center">
        <Button variant="ghost" onClick={() => loadPage(1)} disabled={busy}>
          <ChevronDown /> 전체 접근 기록 {int(total)}건 보기
        </Button>
        {error && <p className="mt-2 text-sm text-dim">기록을 불러오지 못했어요. 다시 눌러 주세요.</p>}
      </div>
    );
  }

  return (
    <div className="border-t border-line">
      <div className="p-5 pb-0 md:p-6 md:pb-0">
        <PanelTitle title={`전체 접근 기록 ${int(total)}건`} sub="과거 → 미래 순" />
      </div>
      <ApproachTable rows={rows} />
      <div className="flex items-center justify-center gap-3 border-t border-line p-4 text-sm text-dim">
        <span className="font-mono">
          {int(rows.length)} / {int(total)}
        </span>
        {page < totalPages && (
          <Button variant="ghost" onClick={() => loadPage(page + 1)} disabled={busy}>
            더 불러오기
          </Button>
        )}
        {error && <span>불러오지 못했어요. 다시 눌러 주세요.</span>}
      </div>
    </div>
  );
}

export default NeoDetailPage;
