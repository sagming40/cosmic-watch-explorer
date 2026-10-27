import { NavLink, useLocation } from "react-router";
import { Orbit } from "lucide-react";

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

        {/* 로그인 상태 분기(이름·내 관심 천체·로그아웃)는 M4의 AuthProvider 이후. 지금은 항상 "로그인" */}
        <Button variant="outline" size="sm" className="ml-auto" asChild>
          <NavLink to="/login">로그인</NavLink>
        </Button>
      </div>
    </header>
  );
}

export default Header;
