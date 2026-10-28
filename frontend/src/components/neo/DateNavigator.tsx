// DateNavigator.tsx ─ 날짜 이동 알약: ◀ [달력 2026-10-26 (월)] ▶ | 오늘
// 이 컴포넌트는 날짜 상태를 직접 갖지 않는다 ─ "지금 몇 일인지"는 부모가 URL(?date=)에 들고 있고,
// 여기서는 "바뀌었다"는 사실만 위로 알려준다. (리모컨이 채널 값을 갖지 않고 "다음 채널"만 요청하는 것)

import type { ChangeEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addDays, formatDate, parseDateString } from "@/utils/date";

interface DateNavigatorProps {
  date: string; // "YYYY-MM-DD"
  onChange: (newDate: string) => void;
}

const weekdayFmt = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });

function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const parsed = parseDateString(date);
  const valid = !Number.isNaN(parsed.getTime()) && formatDate(parsed) === date; // 2026-13-99 같은 값 걸러내기
  const today = formatDate(new Date());

  function moveByDays(delta: number) {
    // 주소가 잘못된 날짜면 오늘을 기준으로 이동한다
    onChange(formatDate(addDays(valid ? parsed : new Date(), delta)));
  }

  // <input type="date">는 브라우저 기본 달력. 값을 고르면 그대로 위로 전달한다.
  // ⚠️ 알려진 동작: 달력 팝업에서 월 이동 화살표만 눌러도 onChange가 생긴다 (DEVLOG 10-27, M5에서 판단)
  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value) onChange(e.target.value);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-panel/80 p-1 backdrop-blur">
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="이전 날짜" onClick={() => moveByDays(-1)}>
        <ChevronLeft />
      </Button>
      <label className="flex items-center gap-2 rounded-full px-2 py-1 font-mono text-sm hover:bg-line/60">
        <span className="sr-only">조회 날짜</span>
        {/* min/max ─ 서버가 받는 범위(NASA/JPL 예측 범위)와 같게. 범위 밖을 고르면 서버가 INVALID_DATE (10-28) */}
        <input type="date" min="1900-01-01" max="2200-12-31" value={valid ? date : ""} onChange={handlePick} className="bg-transparent outline-none" />
        {valid && <span className="text-dim">({weekdayFmt.format(parsed)})</span>}
      </label>
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="다음 날짜" onClick={() => moveByDays(1)}>
        <ChevronRight />
      </Button>
      <span className="mx-1 h-5 w-px bg-line" />
      <button
        type="button"
        onClick={() => onChange(today)}
        disabled={date === today}
        className="rounded-full px-3 py-1 text-sm text-signal hover:bg-line/60 disabled:text-dim disabled:hover:bg-transparent"
      >
        오늘
      </button>
    </div>
  );
}

export default DateNavigator;
