// ObservationPanel.tsx ─ 데이터 신뢰도 (03 문서 6.2절: "이 데이터를 얼마나 믿을 수 있나")
// 425회 관측된 궤도와 12회 관측된 궤도는 신뢰도가 다르다 → 관측 기간·횟수를 숨기지 않는다.

import Field from "@/components/common/Field";
import { Panel, PanelTitle } from "@/components/common/Panel";
import type { OrbitalData } from "@/types/api";
import { DASH, int, kstDate } from "@/utils/format";

function ObservationPanel({ orbit }: { orbit: OrbitalData }) {
  return (
    <Panel>
      <PanelTitle title="데이터 신뢰도" sub="관측 기간이 길고 횟수가 많을수록 궤도 예측이 정확해요" />
      <div className="h-2 rounded-full bg-signal/70" aria-hidden />
      <div className="mt-2 flex justify-between font-mono text-xs text-dim">
        <span>{orbit.first_observation_date ?? DASH}</span>
        <span>{orbit.last_observation_date ?? DASH}</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <Field label="관측 기간" value={int(orbit.data_arc_days)} unit="일" />
        <Field label="관측 횟수" value={int(orbit.observations_used)} unit="회" />
        <Field
          label="궤도 해"
          value={orbit.orbit_id ?? DASH}
          sub={orbit.orbit_determination_datetime_utc ? `${kstDate(orbit.orbit_determination_datetime_utc)} 계산` : undefined}
        />
      </div>
    </Panel>
  );
}

export default ObservationPanel;
