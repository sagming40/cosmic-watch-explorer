// LogScaleStrip.tsx ─ 두 그룹 사이를 잇는 로그 눈금 (03 문서 6.4절 "두 그룹 사이는 로그 스케일로 배치")
//
// 위의 그림은 그룹마다 따로 확대했다 → 지구와 소행성이 "얼마나" 차이 나는지는 그림만으로 알 수 없다.
// 그래서 모든 천체를 지름 기준 한 자(눈금 하나 = 10배)에 올린다. 한 줄에 하나씩이라 이름이 겹치지 않는다.
// 소행성은 점이 아니라 최솟값~최댓값 막대 (크기를 모른다는 사실까지 그대로).

import type { AsteroidTarget, PlanetTarget } from "@/components/compare/types";
import { asteroidSized, EARTH_D_M } from "@/components/compare/types";
import { cn } from "@/lib/utils";


type Mark = { key: string; name: string; from: number; to: number; kind: "earth" | "planet" | "asteroid" };

/** 10^k m → "100 m" / "1 km" / "10,000 km" */
function meterLabel(exp: number): string {
  const m = 10 ** exp;
  if (m < 1000) return `${m} m`;
  const km = m / 1000;
  if (km >= 1_000_000) return `${(km / 10_000).toLocaleString("ko-KR")}만 km`; // 10,000,000 km → 1,000만 km (자리 줄이기)
  return `${km.toLocaleString("ko-KR")} km`;
}

function LogScaleStrip({ planets, asteroids }: { planets: PlanetTarget[]; asteroids: AsteroidTarget[] }) {
  const marks: Mark[] = [{ key: "earth", name: "지구", from: EARTH_D_M, to: EARTH_D_M, kind: "earth" }];
  for (const p of planets) {
    if (p.radiusEarth !== null && p.radiusEarth > 0) {
      const d = p.radiusEarth * EARTH_D_M;
      marks.push({ key: `exo:${p.id}`, name: p.name, from: d, to: d, kind: "planet" });
    }
  }
  for (const a of asteroids) {
    if (asteroidSized(a) && a.minM > 0) marks.push({ key: `neo:${a.id}`, name: a.name, from: a.minM, to: a.maxM, kind: "asteroid" });
  }
  if (marks.length < 2) return null; // 지구 혼자면 비교할 게 없다

  const lo = Math.floor(Math.log10(Math.min(...marks.map((m) => m.from))));
  const hi = Math.ceil(Math.log10(Math.max(...marks.map((m) => m.to))));
  const span = Math.max(1, hi - lo);
  const pos = (v: number) => ((Math.log10(v) - lo) / span) * 100;
  const ticks = Array.from({ length: span + 1 }, (_, i) => lo + i);

  return (
    <figure className="mt-6 rounded-lg border border-line p-4">
      <figcaption className="mb-3 text-xs text-dim">한 자에 놓고 보기 · 지름 · 로그 눈금 (한 칸 = 10배)</figcaption>
      <ul className="grid gap-2">
        {marks.map((m) => (
          <li key={m.key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <span className={cn("truncate text-xs", m.kind === "earth" ? "text-dim" : "text-bone")} title={m.name}>
              {m.name}
            </span>
            <span className="relative h-4">
              <span className="absolute inset-x-0 top-1/2 border-t border-line" />
              {m.kind === "asteroid" ? (
                <span
                  className="absolute top-1/2 h-2.5 min-w-1.5 -translate-y-1/2 rounded-full border border-signal bg-signal/30"
                  style={{ left: `${pos(m.from)}%`, width: `${pos(m.to) - pos(m.from)}%` }}
                />
              ) : (
                <span
                  className={cn("absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full", m.kind === "earth" ? "border border-dim bg-line" : "bg-signal")}
                  style={{ left: `${pos(m.from)}%` }}
                />
              )}
            </span>
          </li>
        ))}
      </ul>
      {/* 눈금 ─ 이름 칸만큼 띄우고 같은 폭으로. 10배마다 선, 글자는 자리가 될 때만:
          4칸 이하면 전부, 넘으면 1,000배마다(1 m · 1 km · 1,000 km …), 휴대폰 폭(약 150px)에서 6칸이 넘으면 그중 하나 걸러 ─ 9칸 글자가 겹쳤다 */}
      <div className="mt-1 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]" aria-hidden>
        <span />
        <span className="relative h-6 font-mono text-[10px] text-dim">
          {ticks.map((t, i) => {
            const left = `${(i / span) * 100}%`;
            const labeled = span <= 4 || t % 3 === 0;
            const phoneHidden = span > 6 && labeled && (t / 3) % 2 !== 0; // 6칸 넘으면 휴대폰에선 그중 하나 걸러 (1 m · 1,000 km …)
            return (
              <span key={t}>
                <span className="absolute top-0 h-1.5 border-l border-dim/60" style={{ left }} />
                {labeled && (
                  <span
                    className={cn("absolute top-2 whitespace-nowrap", phoneHidden && "hidden sm:inline", i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2")}
                    style={{ left }}
                  >
                    {meterLabel(t)}
                  </span>
                )}
              </span>
            );
          })}
        </span>
      </div>
    </figure>
  );
}

export default LogScaleStrip;
