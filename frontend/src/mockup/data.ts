// 목업용 가짜 데이터 ─ 실제 API 응답 타입(NeoDashboardResponse)과 같은 모양으로 만든다.
// 그래야 디자인 확정 후 이 자리에 api.get() 결과를 그대로 꽂을 수 있다.
// 값은 2026-10-26 실제 응답을 바탕으로, 화면 상태를 다 보여주기 위해 일부를 지어냈다
// (1 LD 안쪽 접근 1건, 직경 미상 1건).

import type { NeoDashboardResponse } from "@/types/api";

export const MOCK_DASHBOARD: NeoDashboardResponse = {
  date: "2026-10-26",
  summary: {
    total_count: 9,
    hazardous_count: 1,
    closest_ld: 0.62,
    closest_km: 238328.4,
    largest_diameter_m: 1164.2332,
    largest_diameter_name: "(2002 TA69)",
  },
  cache: { is_cached: true, fetched_at: "2026-10-26T00:12:33Z" },
  results: [
    {
      nasa_id: "54401812",
      name: "(2026 UQ3)",
      is_hazardous: false,
      diameter_min_m: 6.1,
      diameter_max_m: 13.7,
      approach: {
        datetime_utc: "2026-10-26T14:42:00Z",
        miss_distance_km: 238328.4,
        miss_distance_au: 0.00159314,
        miss_distance_ld: 0.62,
        velocity_km_s: 9.4182,
        velocity_km_h: 33905.5,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3843128",
      name: "(2019 TU1)",
      is_hazardous: false,
      diameter_min_m: 21.3,
      diameter_max_m: 47.6,
      approach: {
        datetime_utc: "2026-10-26T03:05:00Z",
        miss_distance_km: 2847193.1,
        miss_distance_au: 0.01903239,
        miss_distance_ld: 7.41,
        velocity_km_s: 6.0247,
        velocity_km_h: 21688.9,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "2516396",
      name: "516396 (2002 TA69)",
      is_hazardous: true,
      diameter_min_m: 520.6,
      diameter_max_m: 1164.2332,
      approach: {
        datetime_utc: "2026-10-26T21:18:00Z",
        miss_distance_km: 12978705.597,
        miss_distance_au: 0.08675858,
        miss_distance_ld: 33.76,
        velocity_km_s: 21.3561,
        velocity_km_h: 76881.9,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3989261",
      name: "(2020 SV4)",
      is_hazardous: false,
      diameter_min_m: null,
      diameter_max_m: null,
      approach: {
        datetime_utc: "2026-10-26T08:51:00Z",
        miss_distance_km: 18530112.4,
        miss_distance_au: 0.12386791,
        miss_distance_ld: 48.21,
        velocity_km_s: 12.7703,
        velocity_km_h: 45973.2,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3771633",
      name: "(2017 FU102)",
      is_hazardous: false,
      diameter_min_m: 104.2,
      diameter_max_m: 232.9,
      approach: {
        datetime_utc: "2026-10-26T11:27:00Z",
        miss_distance_km: 27411862.5,
        miss_distance_au: 0.18323982,
        miss_distance_ld: 71.31,
        velocity_km_s: 15.0921,
        velocity_km_h: 54331.6,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3735431",
      name: "(2015 VA1)",
      is_hazardous: false,
      diameter_min_m: 36.5,
      diameter_max_m: 81.6,
      approach: {
        datetime_utc: "2026-10-26T17:09:00Z",
        miss_distance_km: 35022091.8,
        miss_distance_au: 0.23411097,
        miss_distance_ld: 91.11,
        velocity_km_s: 10.4418,
        velocity_km_h: 37590.5,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3654291",
      name: "(2013 UH10)",
      is_hazardous: false,
      diameter_min_m: 61.0,
      diameter_max_m: 136.4,
      approach: {
        datetime_utc: "2026-10-26T05:33:00Z",
        miss_distance_km: 46118572.0,
        miss_distance_au: 0.30828632,
        miss_distance_ld: 119.98,
        velocity_km_s: 18.8126,
        velocity_km_h: 67725.4,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3102581",
      name: "(2001 UY4)",
      is_hazardous: false,
      diameter_min_m: 167.1,
      diameter_max_m: 373.6,
      approach: {
        datetime_utc: "2026-10-26T19:44:00Z",
        miss_distance_km: 58830476.2,
        miss_distance_au: 0.39325998,
        miss_distance_ld: 153.05,
        velocity_km_s: 24.5517,
        velocity_km_h: 88386.1,
        orbiting_body: "Earth",
      },
    },
    {
      nasa_id: "3797812",
      name: "(2018 DT1)",
      is_hazardous: false,
      diameter_min_m: 12.9,
      diameter_max_m: 28.8,
      approach: {
        datetime_utc: "2026-10-26T23:58:00Z",
        miss_distance_km: 72869193.7,
        miss_distance_au: 0.48710291,
        miss_distance_ld: 189.56,
        velocity_km_s: 7.2265,
        velocity_km_h: 26015.4,
        orbiting_body: "Earth",
      },
    },
  ],
};

// 카운트다운용 ─ "다음 접근" (실제로는 백엔드에 아직 없는 값. 구현 시 API 필요 → 목업 확정 후 결정)
export const MOCK_NEXT_APPROACH = {
  name: "(2026 UQ3)",
  miss_distance_ld: 0.62,
  // 목업을 연 시각 기준으로 2일 14시간 뒤
  at: Date.now() + ((2 * 24 + 14) * 60 + 22) * 60 * 1000,
};
