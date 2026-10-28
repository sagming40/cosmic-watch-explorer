// ═══════════════════════════════════════════════════════════════════
// api.ts ─ 백엔드(Django) 응답 모양을 TypeScript로 옮겨 적은 "계약서"
//
// 출처: docs/04_api_specification.md + backend/apps/*/serializers.py (실제 구현 기준)
// 비유: 택배 상자에 붙은 내용물 목록표. 상자를 열기 전에(=실행 전에)
//       "이 상자엔 miss_distance_ld가 들어 있고, 비어 있을 수도 있다"를 알 수 있다.
//
// ⚠️ number | null 이 많은 이유 ─ NASA가 측정하지 못한 값은 null 그대로 내려온다.
//    (02 문서 1.1절 NULL 보존 원칙) 화면에서 "—"로 바꾸는 건 DataField의 몫이다.
// ⚠️ 필드 이름은 전부 snake_case ─ 04 문서 1.2절. 백엔드 이름 그대로 쓴다.
// ═══════════════════════════════════════════════════════════════════

// ─── 공통 ─────────────────────────────────────────────────────────

/** 04 문서 1.4절 오류 코드 목록 + client.ts가 붙이는 2종 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_DATE"
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "CSRF_FAILED"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "NETWORK_ERROR" // 서버까지 못 감 (client.ts)
  | "UNKNOWN_ERROR"; // 응답은 왔지만 봉투 형식이 아님 (client.ts)

/** 필드별 오류 ─ { "password": ["8자 이상 …"] } */
export type FieldErrors = Record<string, string[]>;

/** 04 문서 1.5절 페이징 형식 */
export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

// ─── NEO (04 문서 5장) ─────────────────────────────────────────────

/** 접근 사건 한 건 ─ ApproachDetailSerializer */
export interface NeoApproach {
  datetime_utc: string; // ISO 8601 UTC
  miss_distance_km: number | null;
  miss_distance_au: number | null;
  miss_distance_ld: number | null; // 서버가 계산 (units.py) ─ 프론트에서 km를 직접 나누지 않는다
  velocity_km_s: number | null;
  velocity_km_h: number | null;
  orbiting_body: string;
}

/** 상세·접근 기록 표 한 줄 ─ ApproachRowSerializer (날짜만 하나 더) */
export interface NeoApproachRow extends NeoApproach {
  approach_date: string; // "YYYY-MM-DD"
}

/** GET /api/neo/ 목록 한 줄 ─ NeoApproachSerializer */
export interface NeoDashboardItem {
  nasa_id: string;
  name: string;
  is_hazardous: boolean; // NASA PHA 분류 (스케일 바의 "1 LD 이내"와 다른 기준)
  diameter_min_m: number | null;
  diameter_max_m: number | null;
  approach: NeoApproach;
}

export interface NeoDashboardSummary {
  total_count: number;
  hazardous_count: number;
  closest_ld: number | null; // 접근 0건이면 null
  closest_km: number | null;
  largest_diameter_m: number | null; // 0건이거나 전부 직경 미상이면 null
  largest_diameter_name: string | null;
}

/** GET /api/neo/?date= ─ 5.1절 */
export interface NeoDashboardResponse {
  date: string;
  summary: NeoDashboardSummary;
  cache: {
    is_cached: boolean; // false = 이번 요청에서 NASA를 직접 불렀다
    fetched_at: string;
  };
  results: NeoDashboardItem[];
}

/** 궤도 정보 14필드 ─ OrbitalDataSerializer (전부 null 가능) */
export interface OrbitalData {
  orbit_id: string | null;
  orbit_determination_datetime_utc: string | null;
  first_observation_date: string | null;
  last_observation_date: string | null;
  data_arc_days: number | null;
  observations_used: number | null;
  eccentricity: number | null;
  semi_major_axis_au: number | null;
  inclination_deg: number | null;
  orbital_period_days: number | null;
  perihelion_distance_au: number | null;
  aphelion_distance_au: number | null;
  orbit_class_type: string | null;
  orbit_class_description: string | null;
}

/**
 * ok: 궤도 있음 / missing: NASA에도 없음 / unavailable: NASA 연결 실패 / rate_limited: 우리 쪽 NASA 호출 한도
 * unavailable·rate_limited여도 나머지(이름·크기·접근 기록)는 DB 값으로 정상 응답한다 (04 문서 5.2절)
 */
export type OrbitStatus = "ok" | "missing" | "unavailable" | "rate_limited";

/** GET /api/neo/{nasa_id}/ ─ 5.2절 */
export interface NeoDetailResponse {
  nasa_id: string;
  name: string;
  designation: string | null;
  absolute_magnitude: number | null;
  diameter_min_m: number | null;
  diameter_max_m: number | null;
  is_hazardous: boolean;
  is_sentry_object: boolean;
  jpl_url: string | null;
  is_watchlisted: boolean; // 비로그인이면 항상 false
  orbital_data: OrbitalData | null; // Lookup 404였던 소행성은 null
  orbit_status: OrbitStatus; // 궤도 칸이 비었다면 왜 비었는지 (10-28 결정 A)
  recent_approaches: NeoApproachRow[]; // "다음 접근 5건" (미래 기준, 5.2 설계 결정 ③)
  approach_count: number; // > 5 이면 "더 보기"
}

/** GET /api/neo/{nasa_id}/approaches/ ─ 5.3절 */
export type NeoApproachListResponse = Paginated<NeoApproachRow>;

// ─── Exoplanet (04 문서 6장) ──────────────────────────────────────

export interface HostStarBrief {
  name: string;
  distance_pc: number | null;
  distance_ly: number | null; // 서버가 pc → ly 변환
}

export interface HostStarDetail extends HostStarBrief {
  id: number;
  spectral_type: string | null;
  temperature_k: number | null;
  radius_solar: number | null;
  mass_solar: number | null;
  metallicity: number | null;
  surface_gravity: number | null;
}

/** 목록 한 줄 ─ ExoplanetRowSerializer */
export interface ExoplanetRow {
  id: number;
  planet_name: string;
  radius_earth: number | null;
  mass_earth: number | null;
  equilibrium_temp_k: number | null;
  orbital_period_days: number | null;
  discovery_year: number | null;
  discovery_method: string | null;
  host_star: HostStarBrief;
}

/** GET /api/exoplanets/ ─ 6.1절. applied_filters = 서버가 실제로 적용한 조건 (필터 칩 재료) */
export interface ExoplanetListResponse extends Paginated<ExoplanetRow> {
  applied_filters: Record<string, string | number>;
}

export interface SiblingPlanet {
  id: number;
  planet_name: string;
  radius_earth: number | null;
}

/** GET /api/exoplanets/{id}/ ─ 6.2절 */
export interface ExoplanetDetailResponse extends Omit<ExoplanetRow, "host_star"> {
  host_star: HostStarDetail;
  is_watchlisted: boolean;
  sibling_planets: SiblingPlanet[];
}

export interface NumberRange {
  min: number | null;
  max: number | null;
}

/** GET /api/exoplanets/meta/ ─ 6.3절 */
export interface ExoplanetMetaResponse {
  discovery_methods: { value: string; count: number }[];
  ranges: {
    radius_earth: NumberRange;
    mass_earth: NumberRange;
    discovery_year: NumberRange;
    distance_ly: NumberRange;
  };
  total_count: number;
}

// ─── 인증 (04 문서 4장) ───────────────────────────────────────────

/** 마이페이지 "표시 설정" ─ 대시보드를 열 때 처음 보일 모양 (04 문서 4.6절, 10-28) */
export interface Preferences {
  distance_unit: "km" | "au"; // 목록의 보조 거리 단위 (기본 단위 LD는 고정)
  dashboard_sort: "distance" | "velocity" | "size";
  hazard_only: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  date_joined: string; // ISO 8601 UTC ─ 화면에선 KST 날짜로
  preferences: Preferences; // 설정을 한 번도 안 바꿨으면 서버 기본값
  avatar_url: string | null; // 프로필 사진 주소(?v=로 캐시 갱신). 없으면 null → 머리글자 (10-28)
}

/** GET /api/account/ ─ 마이페이지 "내 정보" */
export interface AccountSummary {
  user: AuthUser;
  watchlist_counts: { neo: number; exoplanet: number };
}

/** GET /api/auth/me/, POST signup·login 응답 */
export interface AuthStatus {
  is_authenticated: boolean;
  user: AuthUser | null;
}

// ─── Watchlist (04 문서 7장) ──────────────────────────────────────

/** Watchlist 목록은 페이징하지 않는다 (count + results만) */
export interface WatchlistResponse<T> {
  count: number;
  results: T[];
}

export interface NeoWatchlistItem {
  nasa_id: string;
  name: string;
  is_hazardous: boolean;
  diameter_min_m: number | null;
  diameter_max_m: number | null;
  saved_at: string;
  next_approach: { datetime_utc: string; miss_distance_ld: number | null } | null; // 오늘 이후 지구 접근
}

export interface ExoplanetWatchlistItem {
  id: number;
  planet_name: string;
  radius_earth: number | null;
  saved_at: string;
  host_star: { name: string; distance_ly: number | null };
}

export interface NeoWatchlistCreated {
  nasa_id: string;
  saved_at: string;
}

export interface ExoplanetWatchlistCreated {
  exoplanet_id: number;
  saved_at: string;
}

/** GET /api/neo/next-approach/ ─ 04 문서 5.4절 (10-28 카운트다운). 원본 NASA/JPL CAD, 환산은 서버(units.py) */
export interface NextApproach {
  designation: string; // "2025 UK9"
  name: string; // "(2025 UK9)" ─ NeoWs 이름과 같은 모양
  nasa_id: string | null; // 우리 DB에 있으면 상세 주소 /neo/:id. 없으면 null → 그날 대시보드(?date=approach_date)로
  approach_datetime_utc: string;
  approach_date: string; // UTC 날짜 "YYYY-MM-DD" ─ 대시보드 ?date= 와 같은 기준
  time_sigma_minutes: number | null; // 예측 시각 오차 ±분 (0 = 1분 미만)
  miss_distance_au: number;
  miss_distance_km: number;
  miss_distance_ld: number;
  miss_distance_min_ld: number | null; // 궤도 오차를 넣은 범위
  miss_distance_max_ld: number | null;
  is_within_lunar_distance: boolean;
  velocity_km_s: number | null;
  absolute_magnitude_h: number | null;
}

export interface NextApproachResponse {
  next_approach: NextApproach | null; // 기준 안에 예측이 없으면 null
  criteria: { max_distance_au: number; max_distance_ld: number; window_days: number };
  source: string;
  fetched_at: string;
}
