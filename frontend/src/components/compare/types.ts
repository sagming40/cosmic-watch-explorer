// 크기 비교 화면이 쓰는 "비교 대상" ─ 상세 API(#7, #10) 응답에서 크기에 필요한 것만 뽑은 모양.
// 목록(검색 결과·오늘의 소행성)에서 추가할 때도 같은 모양으로 바로 만들 수 있다 → 상세 API를 다시 부르지 않는다.

import { EARTH_RADIUS_KM } from "@/utils/compareQuery";

/** 지구 지름 (m) ─ 행성(지구 반지름 배수)과 소행성(m)을 한 자에 놓을 때 */
export const EARTH_D_M = EARTH_RADIUS_KM * 2 * 1000;

export interface PlanetTarget {
  id: string;
  name: string;
  radiusEarth: number | null; // 지구 = 1. NASA 원본 null 그대로
}

export interface AsteroidTarget {
  id: string;
  name: string;
  minM: number | null; // 추정 지름 최솟값 (m)
  maxM: number | null;
}

/** 둘 다 있어야 크기를 그릴 수 있다 (하나만 있는 경우도 "모름"으로 본다 ─ diameterRange와 같은 기준) */
export function asteroidSized(a: AsteroidTarget): a is AsteroidTarget & { minM: number; maxM: number } {
  return a.minM !== null && a.maxM !== null;
}

/** 지구 지름 ÷ 가장 큰 소행성 지름(최댓값) ─ 그룹 사이 안내 문구용. 소행성 크기를 하나도 모르면 null */
export function earthToAsteroidRatio(asteroids: AsteroidTarget[]): number | null {
  const largest = Math.max(0, ...asteroids.filter(asteroidSized).map((a) => a.maxM));
  return largest > 0 ? EARTH_D_M / largest : null;
}
