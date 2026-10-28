// OrbitPanel.tsx ─ 궤도 정보 (03 문서 6.2절): 궤도 모식도 + 궤도 요소 6개
//
// 모식도는 태양을 초점에 둔 타원(소행성 궤도)과 반지름 1 AU 원(지구 궤도)을 같은 축척으로 그린 "평면 투영"이다.
// 경사각은 생략한다(화면에 명시). 그림을 위한 위치 계산이지 도메인 값 계산이 아니다 ─ 수치는 서버가 준 그대로.

import { CircleAlert, RotateCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Field from "@/components/common/Field";
import { Panel, PanelTitle } from "@/components/common/Panel";
import type { OrbitalData, OrbitStatus } from "@/types/api";
import { dec2, raw } from "@/utils/format";

interface OrbitPanelProps {
  orbit: OrbitalData | null;
  status: OrbitStatus;
  onRetry: () => void;
}

// 궤도가 없을 때의 문구 ─ "없다"와 "못 가져왔다"는 다르다 (10-28 결정 A)
// 못 가져온 경우만 다시 시도 버튼을 준다. NASA에 원래 없는 건 다시 눌러도 같다.
const EMPTY_TEXT: Record<Exclude<OrbitStatus, "ok">, string> = {
  missing: "NASA가 아직 이 소행성의 궤도를 계산하지 않았어요.",
  unavailable: "NASA에 연결하지 못해 궤도 정보를 가져오지 못했어요. 나머지 정보는 저장된 데이터로 보여드려요.",
  rate_limited: "요청이 많아 궤도 정보 조회를 잠시 멈췄어요. 잠시 후 다시 시도해 주세요.",
};

function OrbitPanel({ orbit, status, onRetry }: OrbitPanelProps) {
  return (
    <Panel>
      <PanelTitle
        title="궤도"
        sub={orbit?.orbit_class_description ?? undefined}
        right={
          orbit?.orbit_class_type && (
            <Badge variant="outline" className="font-mono">
              {orbit.orbit_class_type}
            </Badge>
          )
        }
      />
      {orbit ? (
        <>
          <OrbitDiagram orbit={orbit} />
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
            <Field label="이심률" value={raw(orbit.eccentricity, 4)} sub="0 = 원, 1에 가까울수록 길쭉" />
            <Field label="장반경" value={raw(orbit.semi_major_axis_au, 4)} unit="AU" />
            <Field label="경사각" value={raw(orbit.inclination_deg, 2)} unit="°" />
            <Field label="공전 주기" value={dec2(orbit.orbital_period_days)} unit="일" />
            <Field label="근일점" value={raw(orbit.perihelion_distance_au, 4)} unit="AU" sub="태양에 가장 가까울 때" />
            <Field label="원일점" value={raw(orbit.aphelion_distance_au, 4)} unit="AU" sub="태양에서 가장 멀 때" />
          </div>
        </>
      ) : (
        // 값이 없으면 없는 대로 (02 문서 1.1절). 오류색(hazard)은 쓰지 않는다 ─ 위험 표시 전용
        <div className="flex flex-col items-center py-10 text-center" role={status === "missing" ? undefined : "status"}>
          {status !== "missing" && <CircleAlert className="mb-3 size-5 text-dim" aria-hidden />}
          <p className="max-w-sm text-sm text-dim">{EMPTY_TEXT[status === "ok" ? "missing" : status]}</p>
          {(status === "unavailable" || status === "rate_limited") && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              <RotateCw /> 다시 시도
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}

function OrbitDiagram({ orbit }: { orbit: OrbitalData }) {
  const a = orbit.semi_major_axis_au;
  const e = orbit.eccentricity;
  if (a === null || e === null || e >= 1) {
    return <p className="py-10 text-center text-sm text-dim">궤도 요소가 부족해 그림을 그릴 수 없어요.</p>;
  }
  const S = 100; // 1 AU = 100 (SVG 단위)
  const c = a * e; // 태양(초점) ↔ 타원 중심 거리
  const b = a * Math.sqrt(1 - e * e);
  const left = (-c - a) * S;
  const right = Math.max((a - c) * S, S);
  const half = Math.max(b * S, S) + 18;
  const pad = 24;
  const labelRoom = 110; // 오른쪽 "근일점 0.95" 글자 자리

  return (
    <svg
      viewBox={`${left - pad} ${-half} ${right - left + pad * 2 + labelRoom} ${half * 2}`}
      className="mx-auto h-auto max-h-80 w-full"
      role="img"
      aria-label={`궤도 모식도: 근일점 ${raw(orbit.perihelion_distance_au, 2)} AU, 원일점 ${raw(orbit.aphelion_distance_au, 2)} AU, 지구 궤도는 1 AU`}
    >
      {/* 지구 궤도 */}
      <circle cx={0} cy={0} r={S} fill="none" stroke="var(--dim)" strokeDasharray="3 5" strokeWidth={1} />
      <circle cx={0} cy={-S} r={4} fill="var(--bone)" />
      <text x={6} y={-S - 8} fill="var(--dim)" fontSize={13}>
        지구 궤도 (1 AU)
      </text>
      {/* 소행성 궤도 */}
      <ellipse cx={-c * S} cy={0} rx={a * S} ry={b * S} fill="none" stroke="var(--signal)" strokeWidth={1.75} />
      <circle cx={(a - c) * S} cy={0} r={3.5} fill="var(--signal)" />
      <text x={(a - c) * S + 8} y={-6} fill="var(--signal)" fontSize={13}>
        근일점 {raw(orbit.perihelion_distance_au, 2)}
      </text>
      <circle cx={(-c - a) * S} cy={0} r={3.5} fill="var(--signal)" />
      <text x={(-c - a) * S + 8} y={-6} fill="var(--signal)" fontSize={13}>
        원일점 {raw(orbit.aphelion_distance_au, 2)} AU
      </text>
      {/* 태양 */}
      <circle cx={0} cy={0} r={7} fill="var(--bone)" />
      <circle cx={0} cy={0} r={13} fill="none" stroke="var(--bone)" strokeOpacity={0.2} />
      <text x={0} y={30} fill="var(--dim)" fontSize={13} textAnchor="middle">
        태양
      </text>
      <text x={left - pad + 4} y={half - 6} fill="var(--dim)" fontSize={12}>
        평면 투영 모식도 · 경사각 {raw(orbit.inclination_deg, 1)}° 생략
      </text>
    </svg>
  );
}

export default OrbitPanel;
