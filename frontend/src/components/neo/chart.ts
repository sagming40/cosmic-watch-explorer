// 달 거리 스케일·산점도가 같이 쓰는 값과 변환 (컴포넌트가 아닌 것만 모아 둔 파일)
//
// ⚠️ 여기서 하는 계산은 "그림 위치"를 위한 것뿐이다. 거리(LD) 자체는 서버가 계산한 miss_distance_ld를 쓴다.
//    (프론트에서 km를 달 거리 기준값으로 나누지 않는다 ─ 04 문서 5.1절 설계 결정 ②)

import type { NeoDashboardItem } from "@/types/api";

// 고정 눈금 범위 (03 문서 3장, v1.2 ─ 0.1 ~ 500 LD)
export const LD_MIN = 0.1;
export const LD_MAX = 500;

// "1 LD 안쪽" = 달보다 가까이 왔다 → hazard 색. is_hazardous(NASA PHA 분류)와 다른 기준이다.
export const NEAR_MOON_LD = 1;

export interface ChartPoint {
  id: string;
  name: string;
  ld: number; // 진짜 거리 (말풍선용)
  x: number; // 그려질 위치 (범위 안으로 가둔 값)
  y: number;
  size: number; // 점 크기 = 추정 직경 최댓값
  clamped: boolean; // 범위 밖이라 끝에 붙여 그린 점 → 속이 빈 원
  nearMoon: boolean;
}

export function clampLd(ld: number): number {
  return Math.max(LD_MIN, Math.min(LD_MAX, ld));
}

/** API 목록 → 차트 점. 거리를 모르는(null) 접근은 자 위에 놓을 수 없어 뺀다. */
export function toPoints(results: NeoDashboardItem[], y: (n: NeoDashboardItem) => number): ChartPoint[] {
  return results.flatMap((n) => {
    const ld = n.approach.miss_distance_ld;
    if (ld === null) return [];
    return [
      {
        id: n.nasa_id,
        name: n.name,
        ld,
        x: clampLd(ld),
        y: y(n),
        size: n.diameter_max_m ?? 10,
        clamped: ld < LD_MIN || ld > LD_MAX,
        nearMoon: ld < NEAR_MOON_LD,
      },
    ];
  });
}

export const AXIS_TICK = { fill: "var(--dim)", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" };
