// next.ts ─ 로그인 뒤 돌아갈 주소(?next=) 다루기 (03 문서 4.3절)
//
// ⚠️ ?next= 값은 주소창에 누구나 넣을 수 있다. "/login?next=https://나쁜사이트" 링크를 받아 로그인하면
//    그대로 밖으로 튕겨 나가는 공격(오픈 리다이렉트)이 된다 → 우리 앱 안 경로("/"로 시작, "//"는 아님)만 허용한다.

export function safeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw.startsWith("/login") || raw.startsWith("/signup")) return "/"; // 로그인 화면으로 다시 돌아가는 고리 방지
  return raw;
}

/** 지금 주소를 next로 붙인 로그인 주소 */
export function loginPath(current: string, page: "/login" | "/signup" = "/login"): string {
  return `${page}?next=${encodeURIComponent(current)}`;
}

/** 돌아갈 곳 안내 문구 ─ "로그인하면 보던 ○○로 돌아가요" */
export function nextLabel(next: string): string | null {
  if (next === "/") return null;
  if (next.startsWith("/neo/")) return "보던 소행성 페이지";
  if (next.startsWith("/exoplanets/")) return "보던 외계행성 페이지";
  if (next.startsWith("/exoplanets")) return "보던 외계행성 검색 결과";
  if (next.startsWith("/watchlist")) return "내 관심 천체";
  if (next.startsWith("/compare")) return "크기 비교";
  return "보던 페이지";
}
