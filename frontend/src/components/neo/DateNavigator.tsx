// DateNavigator.tsx ─ 날짜 이동 알약: ◀ [📅 2026-10-26 (월)] ▶ | 오늘
// 이 컴포넌트는 날짜 상태를 직접 갖지 않는다 ─ "지금 몇 일인지"는 부모가 URL(?date=)에 들고 있고,
// 여기서는 "바뀌었다"는 사실만 위로 알려준다. (리모컨이 채널 값을 갖지 않고 "다음 채널"만 요청하는 것)
//
// 가운데 날짜 칸 = 달력 버튼 (10-28 M5 ─ CLAUDE.md "커스텀 달력(M5)" 확정 항목)
// 예전엔 브라우저 기본 <input type="date">였다:
//   ① 달력이 오른쪽 끝 작은 아이콘을 눌러야만 열려서 "날짜 칸을 눌러도 달력이 안 뜬다"로 보였고 (사용자 제보)
//   ② 기본 달력은 월 이동 화살표만 눌러도 날짜가 바뀐 것으로 처리돼, 달을 넘길 때마다 대시보드가 그 날짜를 불러왔다
//      (처음 보는 날짜면 NASA 호출까지). → 이제는 "날짜를 골라야만" 이동한다.

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { ko } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, formatDate, parseDateString } from "@/utils/date";

interface DateNavigatorProps {
  date: string; // "YYYY-MM-DD"
  onChange: (newDate: string) => void;
}

const weekdayFmt = new Intl.DateTimeFormat("ko-KR", { weekday: "short" });

// 고를 수 있는 범위 = 서버가 받는 범위(NASA/JPL 예측 범위, 04 문서 5.1절). 연·월 드롭다운도 이 안에서만
const FIRST_MONTH = new Date(1900, 0, 1);
const LAST_MONTH = new Date(2200, 11, 1);

function DateNavigator({ date, onChange }: DateNavigatorProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseDateString(date);
  const valid = !Number.isNaN(parsed.getTime()) && formatDate(parsed) === date; // 2026-13-99 같은 값 걸러내기
  const today = formatDate(new Date());

  function moveByDays(delta: number) {
    // 주소가 잘못된 날짜면 오늘을 기준으로 이동한다
    onChange(formatDate(addDays(valid ? parsed : new Date(), delta)));
  }

  function pick(day: Date | undefined) {
    // 이미 고른 날짜를 다시 누르면 react-day-picker가 undefined(선택 해제)를 준다 → 그냥 닫기만
    if (day) onChange(formatDate(day)); // formatDate = 로컬 날짜 그대로 (toISOString 금지 ─ UTC라 하루 밀린다)
    setOpen(false);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-panel/80 p-1 backdrop-blur">
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="이전 날짜" onClick={() => moveByDays(-1)}>
        <ChevronLeft />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full px-3 font-mono"
            aria-label={valid ? `조회 날짜 ${date}, 눌러서 달력 열기` : "조회 날짜 선택"}
          >
            <CalendarDays className="text-dim" />
            {valid ? (
              <>
                {date} <span className="text-dim">({weekdayFmt.format(parsed)})</span>
              </>
            ) : (
              <span className="font-sans">날짜 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            locale={ko}
            selected={valid ? parsed : undefined}
            defaultMonth={valid ? parsed : new Date()}
            onSelect={pick}
            captionLayout="dropdown"
            startMonth={FIRST_MONTH}
            endMonth={LAST_MONTH}
            autoFocus // 열리면 고른 날짜에 초점 ─ 화살표로 이동, Enter로 선택, Esc로 닫기
          />
        </PopoverContent>
      </Popover>

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
