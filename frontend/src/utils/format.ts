// 화면 표시용 포맷 함수 모음 (10-27 목업에서 옮겨 옴)
// 원칙: 값이 null이면 "—"(또는 null)을 돌려준다 → NASA가 측정하지 못한 값과 0을 구분 (NULL 보존, 02 문서 1.1절)
// ⚠️ 단위 환산(km → LD, pc → ly)은 여기서 하지 않는다 ─ 서버가 계산해서 준다 (units.py)

export const DASH = "—";

const nf0 = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function int(v: number | null): string {
  return v === null ? DASH : nf0.format(v);
}

export function dec2(v: number | null): string {
  return v === null ? DASH : nf2.format(v);
}

/** 유효숫자 그대로(서버가 준 자릿수) ─ 궤도 요소처럼 정밀도가 의미 있는 값 */
export function raw(v: number | null, digits = 4): string {
  return v === null ? DASH : v.toFixed(digits);
}

export function diameterRange(min: number | null, max: number | null): string | null {
  if (min === null || max === null) return null;
  return `${nf0.format(min)} ~ ${nf0.format(max)}`;
}

/** UTC ISO → 한국 시각 "2026-10-26 14:42" */
export function kstDateTime(iso: string): string {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function kstTime(iso: string): string {
  return kstDateTime(iso).slice(11);
}

/** "YYYY-MM-DD" 기준 오늘부터 며칠 뒤인지 ─ D-day 표시용 */
export function daysFrom(today: string, target: string): number {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = target.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** 남은 날 → "D-12" / "약 4.4년 뒤" (두 달 넘게 남으면 D-1,600 같은 숫자는 감이 안 온다) */
export function untilLabel(days: number): string {
  if (days <= 60) return `D-${days}`;
  return `약 ${(days / 365.25).toFixed(1)}년 뒤`;
}

/** UTC ISO → 한국 날짜 "YYYY-MM-DD" ─ 화면의 날짜는 전부 한국 시각 기준으로 통일 */
export function kstDate(iso: string): string {
  return kstDateTime(iso).slice(0, 10);
}
