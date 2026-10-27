// 목업용 가짜 데이터 ─ 실제 API 응답 타입(NeoDashboardResponse)과 같은 모양으로 만든다.
// 그래야 디자인 확정 후 이 자리에 api.get() 결과를 그대로 꽂을 수 있다.
// 값은 2026-10-26 실제 응답을 바탕으로, 화면 상태를 다 보여주기 위해 일부를 지어냈다
// (1 LD 안쪽 접근 1건, 직경 미상 1건).

import type {
  ExoplanetDetailResponse,
  ExoplanetListResponse,
  ExoplanetMetaResponse,
  ExoplanetWatchlistItem,
  NeoDashboardResponse,
  NeoDetailResponse,
  NeoWatchlistItem,
} from "@/types/api";

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

// "오늘" 기준일 ─ 목업은 2026-10-26 데이터를 보여준다
export const MOCK_TODAY = "2026-10-26";

// ─── NEO 상세 (04 문서 5.2절 예시 기반) ─────────────────────────────
export const MOCK_NEO_DETAIL: NeoDetailResponse = {
  nasa_id: "2357621",
  name: "357621 (2005 EG94)",
  designation: "357621",
  absolute_magnitude: 18.5,
  diameter_min_m: 455.57,
  diameter_max_m: 1018.67,
  is_hazardous: true,
  is_sentry_object: false,
  jpl_url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2357621",
  is_watchlisted: false,
  orbital_data: {
    orbit_id: "42",
    orbit_determination_datetime_utc: "2026-08-16T06:18:55Z",
    first_observation_date: "2005-03-08",
    last_observation_date: "2026-08-15",
    data_arc_days: 7830,
    observations_used: 425,
    eccentricity: 0.5836871,
    semi_major_axis_au: 1.8271,
    inclination_deg: 9.1274,
    orbital_period_days: 902.41,
    perihelion_distance_au: 0.7607,
    aphelion_distance_au: 2.8935,
    orbit_class_type: "APO",
    orbit_class_description: "Near-Earth asteroid orbits which cross the Earth's orbit similar to that of 1862 Apollo",
  },
  recent_approaches: [
    { datetime_utc: "2031-03-14T22:05:00Z", approach_date: "2031-03-14", miss_distance_km: 3152240.1, miss_distance_au: 0.02107172, miss_distance_ld: 8.2, velocity_km_s: 17.9412, velocity_km_h: 64588.3, orbiting_body: "Earth" },
    { datetime_utc: "2033-09-02T07:41:00Z", approach_date: "2033-09-02", miss_distance_km: 16410332.7, miss_distance_au: 0.10969745, miss_distance_ld: 42.69, velocity_km_s: 19.0237, velocity_km_h: 68485.3, orbiting_body: "Earth" },
    { datetime_utc: "2036-01-21T13:12:00Z", approach_date: "2036-01-21", miss_distance_km: 9902114.5, miss_distance_au: 0.06619215, miss_distance_ld: 25.76, velocity_km_s: 18.3305, velocity_km_h: 65989.8, orbiting_body: "Earth" },
    { datetime_utc: "2038-07-09T02:56:00Z", approach_date: "2038-07-09", miss_distance_km: 41250880.3, miss_distance_au: 0.27574548, miss_distance_ld: 107.31, velocity_km_s: 21.4467, velocity_km_h: 77208.1, orbiting_body: "Venus" },
    { datetime_utc: "2040-11-30T18:23:00Z", approach_date: "2040-11-30", miss_distance_km: 5873301.9, miss_distance_au: 0.03926024, miss_distance_ld: 15.28, velocity_km_s: 18.1124, velocity_km_h: 65204.6, orbiting_body: "Earth" },
  ],
  approach_count: 87,
};

// ─── 외계행성 메타 / 목록 / 상세 (04 문서 6장) ──────────────────────
export const MOCK_EXO_META: ExoplanetMetaResponse = {
  discovery_methods: [
    { value: "Transit", count: 4402 },
    { value: "Radial Velocity", count: 1172 },
    { value: "Microlensing", count: 247 },
    { value: "Imaging", count: 89 },
    { value: "Transit Timing Variations", count: 34 },
  ],
  ranges: {
    radius_earth: { min: 0.3, max: 77.34 },
    mass_earth: { min: 0.02, max: 9534.9 },
    discovery_year: { min: 1992, max: 2026 },
    distance_ly: { min: 4.24, max: 27700 },
  },
  total_count: 6451,
};

const host = (name: string, pc: number, ly: number) => ({ name, distance_pc: pc, distance_ly: ly });

export const MOCK_EXO_LIST: ExoplanetListResponse = {
  count: 47,
  page: 1,
  page_size: 20,
  total_pages: 3,
  applied_filters: { radius_min: 0.8, radius_max: 1.5, distance_max_ly: 100 },
  results: [
    { id: 5121, planet_name: "Teegarden's Star b", radius_earth: 1.02, mass_earth: 1.05, equilibrium_temp_k: 264, orbital_period_days: 4.91, discovery_year: 2019, discovery_method: "Radial Velocity", host_star: host("Teegarden's Star", 3.832, 12.5) },
    { id: 4877, planet_name: "GJ 357 b", radius_earth: 1.22, mass_earth: 1.84, equilibrium_temp_k: 525, orbital_period_days: 3.93, discovery_year: 2019, discovery_method: "Transit", host_star: host("GJ 357", 9.44, 30.79) },
    { id: 4902, planet_name: "L 98-59 c", radius_earth: 1.35, mass_earth: 2.22, equilibrium_temp_k: 517, orbital_period_days: 3.69, discovery_year: 2019, discovery_method: "Transit", host_star: host("L 98-59", 10.62, 34.64) },
    { id: 4398, planet_name: "TRAPPIST-1 b", radius_earth: 1.12, mass_earth: 1.37, equilibrium_temp_k: 400, orbital_period_days: 1.51, discovery_year: 2016, discovery_method: "Transit", host_star: host("TRAPPIST-1", 12.467, 40.66) },
    { id: 4401, planet_name: "TRAPPIST-1 e", radius_earth: 0.92, mass_earth: 0.69, equilibrium_temp_k: 250, orbital_period_days: 6.1, discovery_year: 2017, discovery_method: "Transit", host_star: host("TRAPPIST-1", 12.467, 40.66) },
    { id: 4402, planet_name: "TRAPPIST-1 f", radius_earth: 1.05, mass_earth: 1.04, equilibrium_temp_k: 219, orbital_period_days: 9.21, discovery_year: 2017, discovery_method: "Transit", host_star: host("TRAPPIST-1", 12.467, 40.66) },
    { id: 4733, planet_name: "LHS 1140 c", radius_earth: 1.27, mass_earth: 1.91, equilibrium_temp_k: 438, orbital_period_days: 3.78, discovery_year: 2019, discovery_method: "Transit", host_star: host("LHS 1140", 14.993, 48.9) },
    { id: 5833, planet_name: "LP 791-18 d", radius_earth: 1.03, mass_earth: null, equilibrium_temp_k: 395, orbital_period_days: 2.75, discovery_year: 2023, discovery_method: "Transit", host_star: host("LP 791-18", 26.492, 86.4) },
  ],
};

export const MOCK_EXO_DETAIL: ExoplanetDetailResponse = {
  id: 4401,
  planet_name: "TRAPPIST-1 e",
  radius_earth: 0.92,
  mass_earth: 0.69,
  equilibrium_temp_k: 250,
  orbital_period_days: 6.1,
  discovery_year: 2017,
  discovery_method: "Transit",
  is_watchlisted: true,
  host_star: {
    id: 3120,
    name: "TRAPPIST-1",
    distance_pc: 12.467,
    distance_ly: 40.66,
    spectral_type: "M8V",
    temperature_k: 2566,
    radius_solar: 0.1192,
    mass_solar: 0.0898,
    metallicity: 0.04,
    surface_gravity: 5.24,
  },
  sibling_planets: [
    { id: 4398, planet_name: "TRAPPIST-1 b", radius_earth: 1.12 },
    { id: 4399, planet_name: "TRAPPIST-1 c", radius_earth: 1.1 },
    { id: 4400, planet_name: "TRAPPIST-1 d", radius_earth: 0.79 },
    { id: 4402, planet_name: "TRAPPIST-1 f", radius_earth: 1.05 },
    { id: 4403, planet_name: "TRAPPIST-1 g", radius_earth: 1.13 },
    { id: 4404, planet_name: "TRAPPIST-1 h", radius_earth: null },
  ],
};

// ─── Watchlist (04 문서 7장) ────────────────────────────────────────
export const MOCK_WATCH_NEO: NeoWatchlistItem[] = [
  {
    nasa_id: "2099942",
    name: "99942 Apophis (2004 MN4)",
    is_hazardous: true,
    diameter_min_m: 310.2,
    diameter_max_m: 693.6,
    saved_at: "2026-10-20T11:02:00Z",
    next_approach: { datetime_utc: "2029-04-13T21:46:00Z", miss_distance_ld: 0.1 },
  },
  {
    nasa_id: "2357621",
    name: "357621 (2005 EG94)",
    is_hazardous: true,
    diameter_min_m: 455.57,
    diameter_max_m: 1018.67,
    saved_at: "2026-10-18T09:30:00Z",
    next_approach: { datetime_utc: "2031-03-14T22:05:00Z", miss_distance_ld: 8.2 },
  },
  {
    nasa_id: "3843128",
    name: "(2019 TU1)",
    is_hazardous: false,
    diameter_min_m: 21.3,
    diameter_max_m: 47.6,
    saved_at: "2026-10-26T03:15:00Z",
    next_approach: null, // 오늘 이후 지구 접근 예정 없음
  },
];

export const MOCK_WATCH_EXO: ExoplanetWatchlistItem[] = [
  { id: 4401, planet_name: "TRAPPIST-1 e", radius_earth: 0.92, saved_at: "2026-10-21T14:00:00Z", host_star: { name: "TRAPPIST-1", distance_ly: 40.66 } },
  { id: 1042, planet_name: "Proxima Cen b", radius_earth: null, saved_at: "2026-10-19T08:12:00Z", host_star: { name: "Proxima Cen", distance_ly: 4.24 } },
];
