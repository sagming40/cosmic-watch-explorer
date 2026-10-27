// exoplanetQuery.ts ─ 외계행성 검색 조건 ↔ 주소(쿼리스트링) 변환
//
// 검색 조건은 주소에 둔다 (03 문서 6.3절) ─ 결과를 그대로 공유·북마크할 수 있고, 뒤로 가기가 자연스럽다.
// 파라미터 이름은 백엔드(04 문서 6.1절, filters.py)와 똑같이 쓴다 → 주소를 그대로 API에 넘긴다.

/** 범위 조건 6종 ─ meta가 있으면 ExoplanetMetaResponse.ranges의 키 (입력칸에 "데이터 범위" 힌트) */
export const RANGE_FIELDS = [
  { label: "반지름", unit: "지구=1", min: "radius_min", max: "radius_max", meta: "radius_earth" },
  { label: "질량", unit: "지구=1", min: "mass_min", max: "mass_max", meta: "mass_earth" },
  { label: "거리", unit: "광년", min: "distance_min_ly", max: "distance_max_ly", meta: "distance_ly" },
  { label: "평형 온도", unit: "K", min: "temp_min", max: "temp_max", meta: null },
  { label: "공전 주기", unit: "일", min: "period_min", max: "period_max", meta: null },
  { label: "발견 연도", unit: null, min: "year_min", max: "year_max", meta: "discovery_year" },
] as const;

export const TEXT_FIELDS = [
  { key: "name", label: "행성 이름", placeholder: "예: TRAPPIST" },
  { key: "host", label: "모항성 이름", placeholder: "예: Kepler-62" },
] as const;

/** 검색 조건 키 전부 (sort·page는 조건이 아니라 표시 방법이라 따로) */
export const FILTER_KEYS = [
  ...TEXT_FIELDS.map((f) => f.key),
  ...RANGE_FIELDS.flatMap((f) => [f.min, f.max]),
  "method",
] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Draft = Record<FilterKey, string>;

/** 정렬 ─ 앞에 "-"면 내림차순. 값이 없는(null) 행성은 서버가 항상 뒤로 보낸다 (04 문서 6.1 설계 결정 ④) */
export const SORT_OPTIONS = [
  { value: "", label: "이름순" },
  { value: "distance", label: "가까운 순" },
  { value: "-distance", label: "먼 순" },
  { value: "radius", label: "반지름 작은 순" },
  { value: "-radius", label: "반지름 큰 순" },
  { value: "mass", label: "질량 작은 순" },
  { value: "-mass", label: "질량 큰 순" },
  { value: "-year", label: "최근 발견 순" },
  { value: "year", label: "오래된 발견 순" },
] as const;

export function draftFromParams(params: URLSearchParams): Draft {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ""])) as Draft;
}

/** 입력칸 → 새 주소. 빈 칸은 빼고, page는 1페이지로 돌아가게 지운다. sort는 유지 */
export function paramsFromDraft(draft: Draft, sort: string | null): URLSearchParams {
  const next = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = draft[k].trim();
    if (v) next.set(k, v);
  }
  if (sort) next.set("sort", sort);
  return next;
}

/** 서버가 돌려준 applied_filters 한 칸 → 칩 문구 */
const CHIP: Record<string, (v: string | number) => string> = {
  name: (v) => `이름 "${v}"`,
  host: (v) => `모항성 "${v}"`,
  method: (v) => `발견: ${v}`,
};
for (const f of RANGE_FIELDS) {
  const unit = f.unit && f.unit !== "지구=1" ? f.unit : "";
  CHIP[f.min] = (v) => `${f.label} ≥ ${v}${unit}`;
  CHIP[f.max] = (v) => `${f.label} ≤ ${v}${unit}`;
}

export function chipLabel(key: string, value: string | number): string {
  return CHIP[key]?.(value) ?? `${key}: ${value}`;
}

/** 필드 키 → 사람이 읽는 이름 (400 오류에서 "어느 칸이 틀렸는지" 안내용) */
export function fieldLabel(key: string): string {
  const text = TEXT_FIELDS.find((f) => f.key === key);
  if (text) return text.label;
  const range = RANGE_FIELDS.find((f) => f.min === key || f.max === key);
  if (range) return `${range.label} ${range.min === key ? "최소" : "최대"}`;
  return key;
}

export interface Chip {
  keys: string[]; // 칩 하나를 지우면 빠지는 파라미터들 (범위는 최소·최대를 한 칩으로)
  label: string;
}

/** applied_filters → 칩 목록. 같은 항목의 최소·최대는 "반지름 0.8 ~ 1.5" 칩 하나로 합친다 (03 문서 6.3절 와이어프레임) */
export function chipsFrom(applied: Record<string, string | number>): Chip[] {
  const chips: Chip[] = [];
  const used = new Set<string>();
  for (const f of RANGE_FIELDS) {
    const min = applied[f.min];
    const max = applied[f.max];
    if (min === undefined && max === undefined) continue;
    const unit = f.unit && f.unit !== "지구=1" ? f.unit : "";
    const label =
      min !== undefined && max !== undefined ? `${f.label} ${min} ~ ${max}${unit}` : min !== undefined ? chipLabel(f.min, min) : chipLabel(f.max, max as string | number);
    const keys = [f.min, f.max].filter((k) => applied[k] !== undefined);
    keys.forEach((k) => used.add(k));
    chips.push({ keys, label });
  }
  for (const [k, v] of Object.entries(applied)) {
    if (!used.has(k)) chips.unshift({ keys: [k], label: chipLabel(k, v) });
  }
  return chips;
}
