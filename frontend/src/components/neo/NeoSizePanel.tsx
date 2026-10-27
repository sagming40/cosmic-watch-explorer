// NeoSizePanel.tsx ─ 크기 (03 문서 6.2절)
// 소행성 크기는 정확히 모른다 → 안쪽 원 = 최솟값, 바깥 원 = 최댓값 (불확실성 자체를 보여준다, 6.4절)
// 옆에 익숙한 물체(롯데월드타워 높이 555 m)를 같은 축척으로 세워 감을 잡게 한다.

import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

import { Panel, PanelTitle } from "@/components/common/Panel";
import { comparePath } from "@/utils/compareQuery";
import { diameterRange } from "@/utils/format";

const TOWER_M = 555; // 롯데월드타워 높이 (비교용 고정 참고값)

function NeoSizePanel({ nasaId, min, max }: { nasaId: string; min: number | null; max: number | null }) {
  return (
    <Panel>
      <PanelTitle title="크기" sub="안쪽 원 = 최솟값, 바깥 원 = 최댓값" />
      {min === null || max === null ? (
        <p className="py-8 text-center text-sm text-dim">NASA가 크기를 추정하지 못한 소행성이에요.</p>
      ) : (
        <Figure min={min} max={max} />
      )}
      <Link to={comparePath("neo", nasaId)} className="mt-4 inline-flex items-center gap-1 text-sm text-signal hover:underline">
        크기 비교에서 자세히 보기 <ArrowUpRight className="size-4" />
      </Link>
    </Panel>
  );
}

function Figure({ min, max }: { min: number; max: number }) {
  const H = 150; // 둘 중 큰 쪽 = 150px
  const unit = H / Math.max(max, TOWER_M);
  const D = max * unit;
  return (
    <div className="flex items-end justify-center gap-10 pt-2">
      <div className="flex flex-col items-center gap-2">
        <svg width={D + 4} height={D + 4} aria-hidden>
          <circle cx={D / 2 + 2} cy={D / 2 + 2} r={D / 2} fill="none" stroke="var(--signal)" strokeDasharray="4 4" />
          <circle cx={D / 2 + 2} cy={D / 2 + 2} r={Math.max(1.5, (min * unit) / 2)} fill="var(--signal)" fillOpacity={0.25} stroke="var(--signal)" />
        </svg>
        <div className="text-center">
          <div className="font-mono text-sm">{diameterRange(min, max)} m</div>
          <div className="text-xs text-dim">이 소행성</div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 rounded-t-sm bg-line" style={{ height: TOWER_M * unit }} />
        <div className="text-center">
          <div className="font-mono text-sm">555 m</div>
          <div className="text-xs text-dim">롯데월드타워</div>
        </div>
      </div>
    </div>
  );
}

export default NeoSizePanel;
