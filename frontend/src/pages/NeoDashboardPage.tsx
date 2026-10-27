// ═══════════════════════════════════════════════════════════════════
// NeoDashboardPage.tsx ─ Path = '/' (03 문서 6.1절, 04 문서 5.1절)
// 10-27 /mockup 디자인으로 다시 씀. "다음 접근까지" 카운트다운은 이 값을 주는 API가 아직 없어 뺐다.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CircleAlert, Database, RotateCw } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { Panel } from "@/components/common/Panel";
import DateNavigator from "@/components/neo/DateNavigator";
import LunarDistanceBar from "@/components/neo/LunarDistanceBar";
import NeoFaq from "@/components/neo/NeoFaq";
import NeoListItem, { type SubUnit } from "@/components/neo/NeoListItem";
import NeoScatterChart from "@/components/neo/NeoScatterChart";
import NeoSummary from "@/components/neo/NeoSummary";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { NeoDashboardItem, NeoDashboardResponse } from "@/types/api";
import { addDays, formatDate, parseDateString } from "@/utils/date";
import { kstDateTime } from "@/utils/format";

type SortKey = "distance" | "velocity" | "size";
interface ViewOptions {
  sort: SortKey;
  subUnit: SubUnit;
  hazardOnly: boolean;
}

// 정렬은 서버를 다시 부르지 않고 받아 둔 배열로 한다 (04 문서 8.1절 ─ 하루치는 5~20건)
// 값이 없는(null) 항목은 오름·내림 상관없이 항상 뒤로 (외계행성 정렬과 같은 원칙)
const SORTERS: Record<SortKey, (n: NeoDashboardItem) => number> = {
  distance: (n) => n.approach.miss_distance_ld ?? Infinity,
  velocity: (n) => -(n.approach.velocity_km_s ?? -Infinity),
  size: (n) => -(n.diameter_max_m ?? -Infinity),
};

// 요청 한 번의 결과. key = "날짜:재시도 횟수" ─ 지금 화면이 원하는 key와 다르면 "로딩 중"이다.
type Loaded =
  | { key: string; data: NeoDashboardResponse; error: null }
  | { key: string; data: null; error: AppError };

function NeoDashboardPage() {
  // ── 조회 날짜는 URL 주소창에 둔다 ──
  // useSearchParams는 useState와 쓰는 모양이 거의 같지만, 값이 '주소창'에 저장된다.
  // 새로고침해도 남고, 뒤로가기·공유가 공짜로 된다.
  const [searchParams, setSearchParams] = useSearchParams();
  const today = formatDate(new Date());
  const date = searchParams.get("date") ?? today;
  const isToday = date === today;

  const [retry, setRetry] = useState(0);
  const key = `${date}:${retry}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  // 보기 설정 ─ 페이지에 둬야 날짜를 바꿔도(로딩 화면이 끼어도) 유지된다
  const [view, setView] = useState<ViewOptions>({ sort: "distance", subUnit: "km", hazardOnly: false });

  // ─────────────────────────────────────────────────────────────────
  // useEffect = "화면이 그려진 뒤에 할 일"을 예약하는 자리.
  // 이 안에서 setState를 "바로" 부르지 않는다(lint: set-state-in-effect).
  // → 로딩 여부는 상태로 따로 들지 않고, "받아 둔 결과의 key ≠ 지금 key"로 계산한다.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // ignore = "주문이 이미 취소되었습니다." ─ 날짜를 빠르게 바꾸면 응답 순서가 뒤바뀔 수 있어서
    let ignore = false;
    api
      .get<NeoDashboardResponse>("/neo/", { params: { date } })
      .then((res) => {
        if (!ignore) setLoaded({ key, data: res.data, error: null });
      })
      .catch((err: AppError) => {
        if (!ignore) setLoaded({ key, data: null, error: err });
      });
    // 3초가 넘으면 "NASA에서 가져오는 중" 안내 (03 문서 7.2절 ─ 왜 기다리는지 알려주면 덜 지루하다)
    const slow = setTimeout(() => setSlowKey(key), 3000);
    return () => {
      ignore = true;
      clearTimeout(slow);
    };
  }, [date, key]);

  const isLoading = loaded?.key !== key;
  const data = !isLoading ? loaded?.data ?? null : null;
  const error = !isLoading ? loaded?.error ?? null : null;

  function goTo(newDate: string) {
    setSearchParams(newDate === today ? {} : { date: newDate });
  }

  return (
    <>
      {/* ─── 히어로: 제목 + 날짜 이동 (로딩·오류 중에도 날짜는 옮길 수 있게 항상 보인다) ─── */}
      <section className="pt-10 pb-8">
        <div className="mb-4 flex items-center gap-2 text-label font-medium tracking-[0.12em] text-signal uppercase">
          {isToday && <span className="live-dot size-1.5 rounded-full bg-signal" />}
          {isToday ? "Live · " : ""}NASA NeoWs
        </div>
        <h1 className="text-4xl leading-tight font-bold tracking-tight md:text-5xl">
          {isToday ? "오늘" : date} 지구 곁을 지나는
          <br />
          <span className="text-signal">{data ? `소행성 ${data.summary.total_count}개` : "소행성"}</span>
        </h1>
        <div className="mt-6">
          <DateNavigator date={date} onChange={goTo} />
        </div>
      </section>

      {isLoading && <LoadingState slow={slowKey === key} />}
      {error && <ErrorState error={error} onRetry={() => setRetry((n) => n + 1)} onToday={() => goTo(today)} />}
      {data && (
        <Dashboard
          data={data}
          isToday={isToday}
          date={date}
          view={view}
          onViewChange={(patch) => setView((v) => ({ ...v, ...patch }))}
          onMove={(d) => goTo(formatDate(addDays(parseDateString(date), d)))}
        />
      )}
    </>
  );
}

// ─── 성공 화면 ──────────────────────────────────────────────────────
interface DashboardProps {
  data: NeoDashboardResponse;
  isToday: boolean;
  date: string;
  view: ViewOptions;
  onViewChange: (patch: Partial<ViewOptions>) => void;
  onMove: (delta: number) => void;
}

function Dashboard({ data, isToday, date, view, onViewChange, onMove }: DashboardProps) {
  const { sort, subUnit, hazardOnly } = view;
  // 목록 ↔ 차트 연결 ─ 한쪽에 마우스를 올리면 다른 쪽도 같이 강조된다
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = hazardOnly ? data.results.filter((n) => n.is_hazardous) : [...data.results];
    return list.sort((a, b) => SORTERS[sort](a) - SORTERS[sort](b));
  }, [data.results, hazardOnly, sort]);

  // 빈 화면은 막다른 길이 아니라 다음 행동을 안내하는 자리 (03 문서 7.1절)
  if (data.summary.total_count === 0) {
    return (
      <Panel className="flex flex-col items-center py-16 text-center">
        <p className="font-medium">{date}에는 지구에 접근하는 소행성이 없습니다.</p>
        <p className="mt-1 text-sm text-dim">NASA가 이날 기록한 지구 근접 접근이 0건이에요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => onMove(-1)}>
            전날 보기
          </Button>
          <Button variant="outline" onClick={() => onMove(1)}>
            다음 날 보기
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <NeoSummary summary={data.summary} isToday={isToday} />

      {/* ─── 시그니처: 달 거리 스케일 ─── */}
      <Panel className="mt-3">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">달 거리 스케일</h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-dim">
            <Legend className="bg-hazard ring-2 ring-hazard ring-offset-2 ring-offset-panel" label="달보다 가까이 (1 LD 안쪽)" />
            <Legend className="bg-signal" label="그 밖" />
            <Legend className="border border-signal" label="범위 밖 (끝에 표시)" />
          </div>
        </div>
        <p className="mb-2 text-sm text-dim">모든 거리를 지구–달 평균 거리(1 LD) 기준으로 놓은 로그 눈금. 점선 왼쪽이면 달보다 가까이 온 것이다.</p>
        <LunarDistanceBar results={data.results} hoveredId={hoveredId} onHover={setHoveredId} />
      </Panel>

      {/* ─── 목록 + 산점도·FAQ ─── */}
      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel className="p-0 md:p-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line px-5 py-4">
            <ToolbarGroup label="정렬">
              <ToggleGroup type="single" size="sm" variant="outline" value={sort} onValueChange={(v) => v && onViewChange({ sort: v as SortKey })}>
                <ToggleGroupItem value="distance">거리</ToggleGroupItem>
                <ToggleGroupItem value="velocity">속도</ToggleGroupItem>
                <ToggleGroupItem value="size">크기</ToggleGroupItem>
              </ToggleGroup>
            </ToolbarGroup>
            <ToolbarGroup label="보조 단위">
              <ToggleGroup type="single" size="sm" variant="outline" value={subUnit} onValueChange={(v) => v && onViewChange({ subUnit: v as SubUnit })}>
                <ToggleGroupItem value="km">km</ToggleGroupItem>
                <ToggleGroupItem value="au">AU</ToggleGroupItem>
              </ToggleGroup>
            </ToolbarGroup>
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-dim">
              <Switch checked={hazardOnly} onCheckedChange={(on) => onViewChange({ hazardOnly: on })} />
              위험 분류만
            </label>
          </div>

          <ul>
            {rows.map((neo) => (
              <NeoListItem key={neo.nasa_id} neo={neo} subUnit={subUnit} active={hoveredId === neo.nasa_id} onHover={setHoveredId} />
            ))}
            {rows.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-dim">
                이날은 위험 분류 소행성이 없습니다.
                <button className="ml-2 text-signal underline-offset-4 hover:underline" onClick={() => onViewChange({ hazardOnly: false })}>
                  전체 보기
                </button>
              </li>
            )}
          </ul>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel>
            <h2 className="text-lg font-semibold">거리 × 속도</h2>
            <p className="mb-3 text-sm text-dim">점이 클수록 큰 소행성. 왼쪽 위일수록 가깝고 빠르다.</p>
            <NeoScatterChart results={data.results} hoveredId={hoveredId} onHover={setHoveredId} />
          </Panel>
          <NeoFaq />
        </div>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 text-xs text-dim">
        <span className="flex items-center gap-1.5">
          <Database className="size-3.5" />
          데이터: NASA NeoWs ·{" "}
          {data.cache.is_cached ? `${kstDateTime(data.cache.fetched_at)} 수집 (저장된 데이터)` : "방금 NASA에서 가져옴"}
        </span>
        <span>학습·포트폴리오 목적이며 실제 충돌 예측에 사용하지 마세요.</span>
      </footer>
    </>
  );
}

// ─── 로딩 ─ 스피너 대신 자리표시자(스켈레톤). 화면이 비어 보이지 않게 (03 문서 7.2절) ─────
function LoadingState({ slow }: { slow: boolean }) {
  const block = "rounded-xl border border-line bg-panel/60 motion-safe:animate-pulse";
  return (
    <div aria-busy="true" aria-live="polite">
      {slow && <p className="mb-3 text-sm text-dim">NASA에서 데이터를 가져오는 중입니다. 처음 조회하는 날짜는 몇 초 걸릴 수 있어요.</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(block, "h-32")} />
        ))}
      </div>
      <div className={cn(block, "mt-3 h-44")} />
      <div className={cn(block, "mt-3 h-96")} />
    </div>
  );
}

// ─── 오류 ─ 사과하지 않는다. 무슨 일이 있었고 지금 무엇을 할 수 있는지 (03 문서 7.3절) ─────
function ErrorState({ error, onRetry, onToday }: { error: AppError; onRetry: () => void; onToday: () => void }) {
  const message: Partial<Record<AppError["code"], string>> = {
    INVALID_DATE: "주소의 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)",
    RATE_LIMITED: "요청이 많아 잠시 멈췄어요. 잠시 후 다시 시도해 주세요.",
    UPSTREAM_ERROR: "NASA 데이터 서버에 연결할 수 없습니다. 저장된 데이터가 없는 날짜예요.",
    NETWORK_ERROR: "서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.",
    UNKNOWN_ERROR: "서버에 연결할 수 없습니다.",
  };
  return (
    <Panel className="flex flex-col items-center py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-line text-bone">
        <CircleAlert className="size-5" />
      </span>
      <p role="alert" className="mt-4 font-medium">
        {message[error.code] ?? error.message}
      </p>
      <p className="mt-1 font-mono text-xs text-dim">{error.code}</p>
      <div className="mt-6 flex gap-2">
        {error.code === "INVALID_DATE" ? (
          <Button onClick={onToday}>오늘로 가기</Button>
        ) : (
          <Button onClick={onRetry}>
            <RotateCw /> 다시 시도
          </Button>
        )}
      </div>
    </Panel>
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

export default NeoDashboardPage;
