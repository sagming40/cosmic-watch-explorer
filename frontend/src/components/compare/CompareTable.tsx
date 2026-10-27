// CompareTable.tsx ─ "수치로 보기" ─ 그림은 눈대중, 정확한 값은 표로 (그림은 aria-hidden이라 화면 낭독기는 이 표를 읽는다)

import { Link } from "react-router";

import { Panel, PanelTitle } from "@/components/common/Panel";
import type { AsteroidTarget, PlanetTarget } from "@/components/compare/types";
import { EARTH_RADIUS_KM } from "@/utils/compareQuery";
import { DASH, dec2, diameterRange } from "@/utils/format";

function CompareTable({ planets, asteroids }: { planets: PlanetTarget[]; asteroids: AsteroidTarget[] }) {
  return (
    <Panel className="mt-3 p-0 md:p-0">
      <div className="p-5 pb-0 md:p-6 md:pb-0">
        <PanelTitle title="수치로 보기" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-130 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-dim">
              <th className="px-5 py-3 font-medium md:px-6">이름</th>
              <th className="px-3 py-3 font-medium">종류</th>
              <th className="px-5 py-3 text-right font-medium md:px-6">크기</th>
            </tr>
          </thead>
          <tbody>
            <Row name="지구" kind="기준" size={`반지름 ${EARTH_RADIUS_KM.toLocaleString("ko-KR")} km`} />
            {planets.map((p) => (
              <Row key={p.id} name={p.name} to={`/exoplanets/${p.id}`} kind="외계행성" size={p.radiusEarth === null ? DASH : `지구 반지름의 ${dec2(p.radiusEarth)}배`} />
            ))}
            {asteroids.map((a) => {
              const range = diameterRange(a.minM, a.maxM);
              return <Row key={a.id} name={a.name} to={`/neo/${a.id}`} kind="소행성" size={range === null ? DASH : `지름 ${range} m`} />;
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Row({ name, to, kind, size }: { name: string; to?: string; kind: string; size: string }) {
  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-5 py-3 font-medium md:px-6">
        {to ? (
          <Link to={to} className="text-bone hover:underline">
            {name}
          </Link>
        ) : (
          name
        )}
      </td>
      <td className="px-3 py-3 text-dim">{kind}</td>
      <td className="px-5 py-3 text-right font-mono md:px-6">{size}</td>
    </tr>
  );
}

export default CompareTable;
