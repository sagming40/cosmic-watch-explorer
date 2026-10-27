// ═══════════════════════════════════════════════════════════════════
// ExoplanetDetailPage.tsx ─ Path = '/exoplanets/:id' (01 문서 4.4절, 04 문서 6.2절)
// 03 문서엔 와이어프레임이 없던 화면 → 10-27 /mockup에서 설계한 모양으로 구현.
// NASA를 부르지 않는 순수 DB 조회라 대체로 빠르다.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ChevronLeft, Orbit, Ruler, Scale, Thermometer } from "lucide-react";

import { api, type AppError } from "@/api/client";
import StatCard from "@/components/common/StatCard";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import WatchlistButton from "@/components/common/WatchlistButton";
import HostStarPanel from "@/components/exoplanet/HostStarPanel";
import PlanetSizePanel from "@/components/exoplanet/PlanetSizePanel";
import SiblingPlanets from "@/components/exoplanet/SiblingPlanets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExoplanetDetailResponse } from "@/types/api";
import { comparePath } from "@/utils/compareQuery";
import { DASH, dec2, int, raw } from "@/utils/format";

type Loaded = { key: string; data: ExoplanetDetailResponse; error: null } | { key: string; data: null; error: AppError };

function ExoplanetDetailPage() {
  const { id = "" } = useParams();
  const [retry, setRetry] = useState(0);
  const key = `${id}:${retry}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .get<ExoplanetDetailResponse>(`/exoplanets/${encodeURIComponent(id)}/`)
      .then((res) => {
        if (!ignore) setLoaded({ key, data: res.data, error: null });
      })
      .catch((err: AppError) => {
        if (!ignore) setLoaded({ key, data: null, error: err });
      });
    const slow = setTimeout(() => setSlowKey(key), 3000);
    return () => {
      ignore = true;
      clearTimeout(slow);
    };
  }, [id, key]);

  const isLoading = loaded?.key !== key;
  const planet = !isLoading ? loaded?.data ?? null : null;
  const error = !isLoading ? loaded?.error ?? null : null;

  return (
    <>
      <div className="pt-8">
        <BackButton />
      </div>
      {isLoading && <LoadingState slow={slowKey === key} blocks={["h-28", "h-32", "h-80"]} />}
      {error && (
        <div className="pt-6">
          <ErrorState error={error} onRetry={() => setRetry((n) => n + 1)} />
        </div>
      )}
      {planet && <ExoplanetDetail key={planet.id} planet={planet} />}
    </>
  );
}

// 카탈로그에서 왔으면 검색 조건 그대로 돌아가고(뒤로 가기), 주소로 바로 들어왔으면 카탈로그 첫 화면으로
function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromApp = location.key !== "default";
  return (
    <button
      type="button"
      onClick={() => (cameFromApp ? navigate(-1) : navigate("/exoplanets"))}
      className="inline-flex items-center gap-1 text-sm text-dim transition-colors hover:text-bone"
    >
      <ChevronLeft className="size-4" />
      외계행성 카탈로그
    </button>
  );
}

function ExoplanetDetail({ planet: p }: { planet: ExoplanetDetailResponse }) {
  const star = p.host_star;
  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-6 pt-6 pb-8">
        <div className="min-w-0">
          <div className="mb-3 flex gap-2">
            <Badge variant="secondary">{p.discovery_method ?? DASH}</Badge>
            <Badge variant="outline" className="font-mono">
              {p.discovery_year ?? DASH} 발견
            </Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight wrap-break-word md:text-5xl">{p.planet_name}</h1>
          <p className="mt-3 text-dim">
            {star.name} 계 ·{" "}
            {/* 값이 없을 때 "— 광년"처럼 단위만 남지 않게 */}
            {star.distance_ly === null ? (
              "거리 미측정"
            ) : (
              <>
                <span className="font-mono text-bone">{dec2(star.distance_ly)}</span> 광년
                {star.distance_pc !== null && <span className="font-mono"> ({raw(star.distance_pc, 3)} pc)</span>}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <WatchlistButton target={{ kind: "exoplanet", id: p.id }} initialSaved={p.is_watchlisted} />
          {/* 이 행성을 고른 채로 크기 비교에 들어간다 (03 문서 시나리오 2 ⑥) */}
          <Button variant="outline" asChild>
            <Link to={comparePath("exo", p.id)} className="text-bone">
              지구와 크기 비교
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Ruler className="size-4" />} label="반지름" value={dec2(p.radius_earth)} unit="× 지구" sub="지구 = 1" />
        <StatCard icon={<Scale className="size-4" />} label="질량" value={dec2(p.mass_earth)} unit="× 지구" sub="지구 = 1" />
        <StatCard icon={<Thermometer className="size-4" />} label="평형 온도" value={int(p.equilibrium_temp_k)} unit="K" sub="참고: 물 어는점 273 K" />
        <StatCard icon={<Orbit className="size-4" />} label="공전 주기" value={dec2(p.orbital_period_days)} unit="일" sub="지구는 365.25일" />
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <PlanetSizePanel radius={p.radius_earth} name={p.planet_name} />
        <HostStarPanel star={star} />
      </section>

      <div className="mt-3">
        <SiblingPlanets current={{ id: p.id, planet_name: p.planet_name, radius_earth: p.radius_earth }} siblings={p.sibling_planets} starName={star.name} />
      </div>
    </>
  );
}

export default ExoplanetDetailPage;
