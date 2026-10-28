import { NavLink, useLocation } from "react-router";
import { LogOut, Orbit, Star } from "lucide-react";

import { useAuth } from "@/auth/useAuth";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 메뉴 목록이 array인 이유
// 추후 메뉴 하나를 추가/삭제할 때 JSX를 여러 군데 수정하지 않고
// array 한 줄만 추가/삭제 되도록 구현 ─ 편의성
const NAV_ITEMS = [
  { to: "/", label: "소행성", end: true },
  // end: true ─ "/"는 다른 모든 경로의 접두사라, 없으면 어느 페이지에서든 "소행성"이 현재 페이지로 표시된다
  // (화면 읽기 프로그램에 aria-current="page"로 전달되는 값도 이것).
  // 다만 소행성 상세("/neo/...")에서도 메뉴가 켜져 보여야 해서, 색만 아래 isNeoPath로 따로 판정한다.
  { to: "/exoplanets", label: "외계행성", end: false },
  { to: "/compare", label: "크기 비교", end: false },
];

// "/"(대시보드)와 "/neo/2357621"(상세)은 둘 다 "소행성" 메뉴 소속이다.
function isNeoPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/neo/");
}

function Header() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 md:px-8">
        {/* 로고 = 홈 링크. 거의 모든 웹사이트의 암묵적 약속이라 별도 안내 없이도 통한다. */}
        <NavLink to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap text-bone">
          <span className="accent-tint grid size-8 place-items-center rounded-lg">
            <Orbit className="size-4.5" />
          </span>
          <span className="hidden sm:inline">Cosmic Watch</span>
        </NavLink>

        {/* 메뉴는 로그인했을 때만 ─ 비로그인이면 어느 메뉴를 눌러도 로그인 화면으로 튕기기만 한다 (10-27 화면 잠금) */}
        {user && (
        <nav className="flex items-center gap-0.5 rounded-full border border-line bg-panel/70 p-1 sm:ml-2 sm:gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              // NavLink는 className에 함수를 넘기면 { isActive }를 알려준다.
              // 소행성 메뉴만은 위 isNeoPath로 판정을 덮어쓴다.
              className={({ isActive }) => {
                const active = item.to === "/" ? isNeoPath(pathname) : isActive;
                return cn(
                  "rounded-full px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-4",
                  active ? "bg-signal text-ink" : "text-dim hover:text-bone",
                );
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        )}

        <AuthArea />
      </div>
    </header>
  );
}

// ─── 오른쪽 끝: 로그인 상태에 따라 (04 문서 4.2절 /me/) ─────────────────
// 확인 중: 빈자리(버튼이 "로그인"→"이름"으로 깜빡이지 않게) / 비로그인: 로그인 / 로그인: 내 관심 천체·이름·로그아웃
function AuthArea() {
  const { status, user, logout } = useAuth();
  const { pathname, search } = useLocation();
  // 로그아웃 뒤 이동은 따로 안 한다 ─ 로그인 상태가 지워지면 ProtectedRoute가 /login?next=지금 주소 로 보낸다
  // (같은 사람이 다시 로그인하면 보던 화면으로. 여기서 navigate("/login")을 해도 문지기의 이동이 나중에 덮어썼다)

  if (status === "loading") return <div className="ml-auto h-8 w-20" aria-hidden />;

  if (!user) {
    // 비로그인이면 로그인·회원가입 화면에만 있을 수 있다(나머지는 ProtectedRoute가 보냄)
    // → 지금 화면의 반대쪽을 보여준다. ?next=는 그대로 들고 간다
    const toSignup = pathname === "/login";
    return (
      <Button variant="outline" size="sm" className="ml-auto" asChild>
        <NavLink to={(toSignup ? "/signup" : "/login") + search} className="text-bone">
          {toSignup ? "회원가입" : "로그인"}
        </NavLink>
      </Button>
    );
  }


  return (
    <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
      <Button variant="ghost" size="sm" asChild>
        <NavLink to="/watchlist" className="text-bone" aria-label="내 관심 천체">
          <Star />
          <span className="hidden lg:inline">내 관심 천체</span>
        </NavLink>
      </Button>
      {/* 머리글자 원 = 마이페이지 입구 (10-28). 휴대폰 폭에선 공간이 모자라(375px에서 8px 넘침) 이 원 대신 로그아웃 아이콘을 숨긴다
          ─ 로그아웃은 마이페이지 안에도 있다 */}
      <NavLink
        to="/account"
        className={({ isActive }) =>
          cn("grid size-8 place-items-center rounded-full text-sm font-semibold text-bone uppercase transition-colors", isActive ? "bg-signal text-ink" : "bg-line hover:bg-dim/40")
        }
        title="내 계정"
        aria-label={`내 계정 (${user.username})`}
      >
        {user.username[0]}
      </NavLink>
      <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex" onClick={logout} aria-label="로그아웃" title="로그아웃">
        <LogOut />
      </Button>
    </div>
  );
}

export default Header;
