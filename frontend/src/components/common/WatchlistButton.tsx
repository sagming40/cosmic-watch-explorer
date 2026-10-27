// WatchlistButton ─ 관심 천체 저장/해제 (03 문서 10장, 04 문서 7장)
// - 토글 API가 아니라 POST(저장) / DELETE(해제)로 나뉜다 → 지금 상태(saved)를 보고 어느 쪽을 부를지 정한다 (7.1절)
// - 10-27부터 상세 화면 자체가 로그인 필요라 보통은 로그인 상태에서만 보인다.
//   세션이 끝나 401이 오면 AuthProvider가 로그인 상태를 지우고 ProtectedRoute가 /login?next= 로 보낸다
// - 그래도 로그인 안 된 게 확실하면(AuthProvider) API를 부르지 않고 바로 로그인 화면으로 (안전장치)
// - 로그아웃하면 "저장됨" 표시도 바로 풀린다 (저장 목록은 "그 사람"의 것이라)

import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Star } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { loginPath } from "@/auth/next";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Target = { kind: "neo"; nasaId: string } | { kind: "exoplanet"; id: number };

function WatchlistButton({ target, initialSaved }: { target: Target; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user } = useAuth();
  const shownSaved = saved && user !== null;
  const goLogin = () => navigate(loginPath(location.pathname + location.search));

  async function toggle() {
    if (status === "ready" && !user) {
      goLogin();
      return;
    }
    setBusy(true);
    try {
      if (target.kind === "neo") {
        if (shownSaved) await api.delete(`/watchlist/neo/${target.nasaId}/`);
        else await api.post("/watchlist/neo/", { nasa_id: target.nasaId });
      } else {
        if (shownSaved) await api.delete(`/watchlist/exoplanets/${target.id}/`);
        else await api.post("/watchlist/exoplanets/", { exoplanet_id: target.id });
      }
      setSaved(!shownSaved);
    } catch (e) {
      const err = e as AppError;
      // AUTH_REQUIRED(세션 만료)는 AuthProvider가 로그인 상태를 지우고 ProtectedRoute가 로그인 화면으로 보낸다
      if (err.code === "ALREADY_EXISTS") {
        setSaved(true); // 다른 탭에서 이미 저장한 경우 ─ 결과적으로 "저장됨"이 맞다
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={shownSaved ? "secondary" : "default"} onClick={toggle} disabled={busy || status === "loading"} aria-pressed={shownSaved}>
      <Star className={cn(shownSaved && "fill-current")} />
      {shownSaved ? "저장됨" : "관심 천체에 저장"}
    </Button>
  );
}

export default WatchlistButton;
