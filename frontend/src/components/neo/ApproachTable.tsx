// ApproachTable.tsx ─ 접근 기록 표 (03 문서 10장)
// 상세의 "다음 접근 5건"과 "전체 접근 기록"이 같은 표를 쓴다 ─ 그래서 백엔드도 두 응답의 행 모양을
// ApproachRowSerializer 하나로 통일했다 (DEVLOG 9/2).
// 모바일에서는 표를 카드로 바꾸지 않고 가로 스크롤 (03 문서 8장 ─ 값끼리 비교가 돼야 한다)

import { Badge } from "@/components/ui/badge";
import type { NeoApproachRow } from "@/types/api";
import { dec2, int, kstDateTime } from "@/utils/format";

import { LD_MAX, LD_MIN, NEAR_MOON_LD, clampLd } from "./chart";

// 미니 로그 막대 위 위치(0~100%) ─ 달 거리 스케일과 같은 눈금
function pct(ld: number) {
  return ((Math.log10(clampLd(ld)) - Math.log10(LD_MIN)) / (Math.log10(LD_MAX) - Math.log10(LD_MIN))) * 100;
}

function ApproachTable({ rows }: { rows: NeoApproachRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-dim">
            <th className="px-5 py-3 font-medium md:px-6">일시 (KST)</th>
            <th className="px-3 py-3 font-medium">대상</th>
            <th className="px-3 py-3 font-medium">거리</th>
            <th className="px-3 py-3 text-right font-medium">km</th>
            <th className="px-5 py-3 text-right font-medium md:px-6">상대속도</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const near = r.miss_distance_ld !== null && r.miss_distance_ld < NEAR_MOON_LD;
            return (
              <tr key={`${r.datetime_utc}-${r.orbiting_body}`} className="border-b border-line last:border-b-0 hover:bg-line/30">
                <td className="px-5 py-3.5 font-mono md:px-6">{kstDateTime(r.datetime_utc)}</td>
                <td className="px-3 py-3.5">
                  <Badge variant={r.orbiting_body === "Earth" ? "secondary" : "outline"}>{r.orbiting_body}</Badge>
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={near ? "w-20 font-mono text-hazard" : "w-20 font-mono"}>{dec2(r.miss_distance_ld)} LD</span>
                    {r.miss_distance_ld !== null && (
                      <span className="relative hidden h-1 w-24 rounded-full bg-line sm:block" aria-hidden>
                        <span className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-dim" style={{ left: `${pct(1)}%` }} />
                        <span
                          className={near ? "absolute top-1/2 size-2 -translate-1/2 rounded-full bg-hazard" : "absolute top-1/2 size-2 -translate-1/2 rounded-full bg-signal"}
                          style={{ left: `${pct(r.miss_distance_ld)}%` }}
                        />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3.5 text-right font-mono text-dim">{int(r.miss_distance_km)}</td>
                <td className="px-5 py-3.5 text-right font-mono md:px-6">{dec2(r.velocity_km_s)} km/s</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ApproachTable;
