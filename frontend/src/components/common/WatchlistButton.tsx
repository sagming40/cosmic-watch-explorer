// WatchlistButton ─ 관심 천체 저장/해제 (03 문서 10장, 04 문서 7장)
// - 토글 API가 아니라 POST(저장) / DELETE(해제)로 나뉜다 → 지금 상태(saved)를 보고 어느 쪽을 부를지 정한다 (7.1절)
// - 비로그인이면 서버가 401(AUTH_REQUIRED) → /login?next=지금 주소 로 보낸다 (03 문서 4.3절)
// ⚠️ M4 작업(WatchlistButton)을 M3 NEO 상세에서 앞당겨 구현 (10-27). 로그인 화면은 아직 스텁.

import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Star } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Target = { kind: "neo"; nasaId: string } | { kind: "exoplanet"; id: number };

function WatchlistButton({ target, initialSaved }: { target: Target; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function toggle() {
    setBusy(true);
    try {
      if (target.kind === "neo") {
        if (saved) await api.delete(`/watchlist/neo/${target.nasaId}/`);
        else await api.post("/watchlist/neo/", { nasa_id: target.nasaId });
      } else {
        if (saved) await api.delete(`/watchlist/exoplanets/${target.id}/`);
        else await api.post("/watchlist/exoplanets/", { exoplanet_id: target.id });
      }
      setSaved(!saved);
    } catch (e) {
      const err = e as AppError;
      if (err.code === "AUTH_REQUIRED") {
        navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      } else if (err.code === "ALREADY_EXISTS") {
        setSaved(true); // 다른 탭에서 이미 저장한 경우 ─ 결과적으로 "저장됨"이 맞다
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={saved ? "secondary" : "default"} onClick={toggle} disabled={busy} aria-pressed={saved}>
      <Star className={cn(saved && "fill-current")} />
      {saved ? "저장됨" : "관심 천체에 저장"}
    </Button>
  );
}

export default WatchlistButton;
