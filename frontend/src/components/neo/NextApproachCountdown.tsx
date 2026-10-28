// NextApproachCountdown.tsx ─ "다음 근접 접근까지 02일 14시간 22분 08초" (03 문서 6.1절 와이어프레임, 10-28 M6)
// 대시보드가 "오늘"을 볼 때만 붙는다 ─ 다른 날짜를 보는 중엔 "다음 접근까지"가 뜻이 없다 (03 문서 6.1절 설계 결정)
//
// 데이터는 대시보드(/neo/?date=)와 따로 받는다 → 카운트다운이 실패해도 목록·차트는 멀쩡하다.
// 서버가 주는 건 "언제(UTC)"뿐이고 남은 시간은 여기서 1초마다 다시 잰다 ─ 매초 서버를 부르지 않는다.
// 비유: 버스 도착 예정 시각만 한 번 받아 두고, 남은 시간은 내 손목시계로 세는 것.

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { RotateCw, Timer } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NextApproach, NextApproachResponse } from "@/types/api";
import { dec2, kstDateTime } from "@/utils/format";

// 다음 접근 시각이 되면 2초 뒤 다시 받아 "그다음 접근"으로 넘어간다.
// setTimeout은 약 24.8일(2^31-1 ms)보다 길면 바로 실행돼 버린다 → 그보다 멀면 예약하지 않는다(그 사이 화면을 다시 열 테니)
const REFETCH_AFTER_PASS_MS = 2000;
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

type Loaded = { key: number; data: NextApproachResponse; error: null } | { key: number; data: null; error: AppError };

function NextApproachCountdown() {
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let ignore = false;
    api
      .get<NextApproachResponse>("/neo/next-approach/")
      .then((res) => !ignore && setLoaded({ key: retry, data: res.data, error: null }))
      .catch((err: AppError) => !ignore && setLoaded({ key: retry, data: null, error: err }));
    return () => {
      ignore = true;
    };
  }, [retry]);

  // 1초마다 손목시계 ─ setState는 effect 안에서 바로가 아니라 타이머 콜백에서만
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = loaded?.data?.next_approach?.approach_datetime_utc ?? null;
  useEffect(() => {
    if (!target) return;
    const ms = new Date(target).getTime() - Date.now() + REFETCH_AFTER_PASS_MS;
    if (ms > MAX_TIMEOUT_MS) return;
    const id = setTimeout(() => setRetry((n) => n + 1), Math.max(ms, 0));
    return () => clearTimeout(id);
  }, [target]);

  // 다시 받는 중에도 이전 값을 그대로 보여 준다(깜빡임 없이). 처음 한 번만 자리 표시
  if (!loaded) {
    return <Panel className="h-[136px] animate-pulse">{null}</Panel>;
  }

  if (loaded.error) {
    return (
      <Panel className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-dim py-4">
        <p className="text-sm text-dim">다음 근접 접근 예보를 불러오지 못했어요. (NASA/JPL 응답 없음 ─ 아래 목록은 그대로 볼 수 있어요)</p>
        <Button variant="outline" size="sm" onClick={() => setRetry((n) => n + 1)}>
          <RotateCw /> 다시 시도
        </Button>
      </Panel>
    );
  }

  const { next_approach: next, criteria } = loaded.data;
  const criteriaLabel = `지구에서 ${criteria.max_distance_au} AU(${dec2(criteria.max_distance_ld)} LD) 안쪽 기준`;

  return (
    <Panel className="border-l-4 border-l-signal">
      <div className="flex items-center gap-2 text-label font-medium tracking-[0.12em] text-dim uppercase">
        <Timer className="size-3.5 text-signal" />
        다음 근접 접근까지
        <span className="tracking-normal normal-case">· {criteriaLabel}</span>
      </div>
      {next ? (
        <Upcoming next={next} remainingMs={new Date(next.approach_datetime_utc).getTime() - now} />
      ) : (
        <p className="mt-3 text-sm text-dim">
          앞으로 {criteria.window_days}일 안에 이 거리 안쪽으로 지나갈 것으로 예측된 소행성이 없어요.
        </p>
      )}
      <p className="mt-3 text-xs text-dim">데이터: {loaded.data.source} · 궤도 예측값이라 새 관측이 들어오면 바뀔 수 있어요</p>
    </Panel>
  );
}

function Upcoming({ next, remainingMs }: { next: NextApproach; remainingMs: number }) {
  const near = next.is_within_lunar_distance;
  const range =
    next.miss_distance_min_ld !== null && next.miss_distance_max_ld !== null
      ? `${dec2(next.miss_distance_min_ld)}~${dec2(next.miss_distance_max_ld)}`
      : null;

  return (
    <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      {/* role="timer"는 기본이 aria-live="off" ─ 화면 낭독기가 1초마다 읽지 않는다 (필요할 때 직접 읽으러 오면 지금 값) */}
      <div role="timer" className="font-mono text-3xl font-medium tabular-nums md:text-4xl">
        {remainingMs > 0 ? (
          <Countdown ms={remainingMs} />
        ) : (
          <span className="font-sans text-2xl">지금 지나는 중 · 다음 예보 불러오는 중</span>
        )}
      </div>

      <div className="text-right">
        {/* 상세는 우리 DB에 있는 소행성만 열린다 → 없으면 그날 대시보드로 (거기서 NASA 목록을 받아 오면 상세도 열린다) */}
        {next.nasa_id ? (
          <Link to={`/neo/${next.nasa_id}`} className="font-semibold text-bone underline-offset-4 hover:underline">
            {next.name}
          </Link>
        ) : (
          <span className="font-semibold">
            {next.name}{" "}
            <Link to={`/?date=${next.approach_date}`} className="ml-1 text-sm font-normal underline-offset-4 hover:underline">
              그날 목록 보기
            </Link>
          </span>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 text-sm text-dim">
          {/* 1 LD 안쪽은 색 + 고리 점 + 글자 3중 표시 (03 문서 9장 ─ 대시보드 스케일 바와 같은 표시) */}
          {near && (
            <span className="flex items-center gap-1.5 text-hazard">
              <span className="size-2 rounded-full bg-hazard ring-2 ring-hazard ring-offset-2 ring-offset-panel" />
              달보다 가까이
            </span>
          )}
          <span>
            <span className={cn("font-mono", near ? "text-hazard" : "text-bone")}>{dec2(next.miss_distance_ld)} LD</span> 예정
            {range && <span className="font-mono text-xs"> (오차 범위 {range})</span>}
          </span>
        </div>
        <div className="mt-1 text-xs text-dim">
          {kstDateTime(next.approach_datetime_utc)} KST
          {next.time_sigma_minutes !== null && ` · 시각 오차 ${sigmaText(next.time_sigma_minutes)}`}
        </div>
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 남은 ms → 02일 14시간 22분 08초 (하루 안쪽이면 일 생략)
 *  숫자는 크게(font-mono, 자릿수 고정), 단위는 작게(font-sans = Pretendard) ─ 요약 카드의 "11.03 LD"와 같은 모양.
 *  (10-28: 단위까지 큰 mono로 쓰니 한글만 덩그러니 커 보였다) */
function Countdown({ ms }: { ms: number }) {
  const total = Math.floor(ms / 1000);
  const parts: [number, string][] = [
    [Math.floor(total / 86400), "일"],
    [Math.floor((total % 86400) / 3600), "시간"],
    [Math.floor((total % 3600) / 60), "분"],
    [total % 60, "초"],
  ];
  const shown = parts[0][0] > 0 ? parts : parts.slice(1);
  return (
    <span className="flex flex-wrap items-baseline gap-x-3">
      {shown.map(([value, unit]) => (
        <span key={unit}>
          {pad(value)}
          <span className="ml-1 font-sans text-base font-normal text-dim">{unit}</span>
        </span>
      ))}
    </span>
  );
}

/** 오차(분) → "1분 미만" / "±37분" / "±5시간 41분" / "±2일 19시간" */
function sigmaText(min: number): string {
  if (min === 0) return "1분 미만";
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `±${d}일${h ? ` ${h}시간` : ""}`;
  if (h > 0) return `±${h}시간${m ? ` ${m}분` : ""}`;
  return `±${m}분`;
}

export default NextApproachCountdown;
