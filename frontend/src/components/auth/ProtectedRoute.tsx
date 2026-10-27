// ProtectedRoute.tsx ─ 로그인해야 볼 수 있는 화면의 문지기 (03 문서 4장 "인증 필요": /watchlist)
// 비로그인이면 /login?next=지금 주소 로 보낸다. 로그인 상태를 아직 확인 중이면(새로고침 직후) 잠깐 기다린다
// ─ 기다리지 않으면 로그인한 사람도 새로고침할 때마다 로그인 화면으로 튕긴다.

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { loginPath } from "@/auth/next";
import { useAuth } from "@/auth/useAuth";
import { LoadingState } from "@/components/common/StateViews";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <div className="pt-10"><LoadingState slow={false} blocks={["h-40"]} /></div>;
  if (!user) return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
