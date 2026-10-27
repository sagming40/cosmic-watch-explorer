// HostStarPanel.tsx ─ 모항성 정보 (01 문서 4.4절, 03 문서 10장)
// 값이 없는 항목은 "—" (NASA가 모든 항성을 다 측정하지 않았다, 02 문서 1.1절)

import Field from "@/components/common/Field";
import { Panel, PanelTitle } from "@/components/common/Panel";
import { Badge } from "@/components/ui/badge";
import type { HostStarDetail } from "@/types/api";
import { DASH, dec2, int, raw } from "@/utils/format";

function HostStarPanel({ star }: { star: HostStarDetail }) {
  return (
    <Panel>
      <PanelTitle
        title="모항성"
        sub={star.name}
        right={
          <Badge variant="outline" className="font-mono" title="분광형">
            {star.spectral_type ?? DASH}
          </Badge>
        }
      />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <Field label="표면 온도" value={int(star.temperature_k)} unit="K" sub="태양 약 5,800 K" />
        <Field label="반지름" value={raw(star.radius_solar, 3)} unit="× 태양" />
        <Field label="질량" value={raw(star.mass_solar, 3)} unit="× 태양" />
        <Field label="금속 함량" value={raw(star.metallicity, 2)} unit="[Fe/H]" sub="0 = 태양과 같음" />
        <Field label="표면 중력" value={raw(star.surface_gravity, 2)} unit="log g" />
        <Field label="거리" value={dec2(star.distance_ly)} unit="광년" sub={star.distance_pc === null ? undefined : `${raw(star.distance_pc, 3)} pc`} />
      </div>
    </Panel>
  );
}

export default HostStarPanel;
