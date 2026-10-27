// NeoFaq.tsx ─ "알아두면 좋은 것" (03 문서 6.1절 ─ API 호출 없는 정적 콘텐츠)
// 세 번째 항목은 데이터의 출처뿐 아니라 한계(실제 충돌 예측용 아님)도 숨기지 않는다.

import { ChevronRight } from "lucide-react";

const ITEMS = [
  { q: "달 거리(LD)가 뭔가요?", a: "지구에서 달까지의 평균 거리(약 38만 km)예요. 12 LD면 달보다 12배 멀다는 뜻이에요." },
  { q: "잠재적 위험 소행성이란?", a: "지구 궤도에 0.05 AU(약 19.5 LD) 이내로 다가올 수 있고, 지름이 약 140 m 이상인 천체예요. 지금 위험하다는 뜻은 아니에요." },
  { q: "데이터는 어디서 오나요?", a: "NASA NeoWs API예요. 학습·포트폴리오 목적이며 실제 충돌 예측에 사용하지 마세요." },
];

function NeoFaq() {
  return (
    <div className="rounded-xl border border-line bg-panel/80 p-2 backdrop-blur">
      {ITEMS.map((it) => (
        <details key={it.q} className="group rounded-lg px-3 py-2.5 open:bg-line/40">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
            {it.q}
            <ChevronRight className="size-4 text-dim transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-dim">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

export default NeoFaq;
