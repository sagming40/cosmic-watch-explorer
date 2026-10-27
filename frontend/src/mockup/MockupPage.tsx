// ═══════════════════════════════════════════════════════════════════
// MockupPage.tsx ─ /mockup (개발 서버에서만 열림)
//
// 화면 8개 디자인 목업. 하단 막대에서 화면을 바꿔 본다. 주소는 /mockup?screen=neo-detail 처럼
// 바뀌어서 새로고침해도 같은 화면이 유지된다.
// 색은 10-27 C 그래파이트로 확정 → index.css 토큰을 그대로 쓴다.
// 데이터는 가짜(data.ts)지만 실제 API 응답 타입과 같은 모양 → 확정되면 화면별 코드를
// pages/로 옮기고, mockup 폴더는 통째로 지운다.
// ═══════════════════════════════════════════════════════════════════

import { useSearchParams } from "react-router";

import { cn } from "@/lib/utils";

import NeoDashboard from "./screens/NeoDashboard";
import NeoDetail from "./screens/NeoDetail";
import ExoplanetCatalog from "./screens/ExoplanetCatalog";
import ExoplanetDetail from "./screens/ExoplanetDetail";
import Compare from "./screens/Compare";
import { Login, Signup } from "./screens/Auth";
import Watchlist from "./screens/Watchlist";
import "./mockup.css";

const SCREENS = [
  { id: "dashboard", label: "대시보드", el: <NeoDashboard /> },
  { id: "neo-detail", label: "NEO 상세", el: <NeoDetail /> },
  { id: "exoplanets", label: "외계행성", el: <ExoplanetCatalog /> },
  { id: "exoplanet-detail", label: "외계행성 상세", el: <ExoplanetDetail /> },
  { id: "compare", label: "크기 비교", el: <Compare /> },
  { id: "login", label: "로그인", el: <Login /> },
  { id: "signup", label: "회원가입", el: <Signup /> },
  { id: "watchlist", label: "Watchlist", el: <Watchlist /> },
] as const;

function MockupPage() {
  const [params, setParams] = useSearchParams();
  const current = SCREENS.find((s) => s.id === params.get("screen")) ?? SCREENS[0];

  return (
    <div className="mock-root mock-backdrop min-h-screen text-bone">
      {current.el}

      {/* 하단 화면 전환 막대 (목업 전용) */}
      <div className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-panel/90 p-1.5 backdrop-blur-xl">
          <span className="shrink-0 px-3 text-xs text-dim">화면</span>
          {SCREENS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setParams({ screen: s.id });
                window.scrollTo({ top: 0 });
              }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                current.id === s.id ? "bg-signal text-ink" : "text-dim hover:text-bone",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MockupPage;
