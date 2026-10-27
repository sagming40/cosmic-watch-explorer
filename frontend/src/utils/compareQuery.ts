// compareQuery.ts ─ 크기 비교 대상 ↔ 주소(쿼리스트링) 변환
//
// 비교 대상은 주소에 둔다: /compare?exo=72,6400&neo=2099942
// ─ 상세 화면의 "크기 비교" 링크가 그 천체를 고른 채로 들어올 수 있고(03 문서 시나리오 2 ⑥), 새로고침·공유해도 그대로.
// 지구는 주소에 없다 ─ 항상 있는 기준이라 뺄 수도, 넣을 수도 없다 (03 문서 6.4절).

export type Kind = "exo" | "neo";

/** 그룹마다 최대 4개 ─ 04 문서 3.1절 "비교 대상은 보통 2~4개". 더 많으면 원이 너무 작아져 비교가 안 된다 */
export const MAX_PER_GROUP = 4;

/**
 * 지구 반지름 (km) ─ 지구는 NASA 데이터가 아니라 "고정 기준"이라 화면 쪽 상수로 둔다
 * (NeoSizePanel의 롯데월드타워 555 m와 같은 성격). 384400(LD)처럼 NASA 값을 환산하는 데 쓰는 상수가 아니다.
 * 쓰는 곳: 로그 눈금에 행성(지구 반지름 배수)과 소행성(m)을 한 자로 놓을 때뿐.
 */
export const EARTH_RADIUS_KM = 6371;

export interface CompareIds {
  exo: string[];
  neo: string[];
}

/** "72,6400,abc,72" → ["72","6400"] ─ 숫자가 아닌 것·중복은 버리고, 그룹 최대 개수까지만 */
function parseList(raw: string | null): string[] {
  if (!raw) return [];
  const ids = raw.split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  return [...new Set(ids)].slice(0, MAX_PER_GROUP);
}

export function parseCompare(params: URLSearchParams): CompareIds {
  return { exo: parseList(params.get("exo")), neo: parseList(params.get("neo")) };
}

/** 빈 그룹은 주소에서 뺀다 (/compare?exo= 처럼 빈 값이 남지 않게) */
export function compareSearch(ids: CompareIds): Record<string, string> {
  const out: Record<string, string> = {};
  if (ids.exo.length) out.exo = ids.exo.join(",");
  if (ids.neo.length) out.neo = ids.neo.join(",");
  return out;
}

/** 상세 화면 → 크기 비교 링크 */
export function comparePath(kind: Kind, id: string | number): string {
  return `/compare?${kind}=${id}`;
}
