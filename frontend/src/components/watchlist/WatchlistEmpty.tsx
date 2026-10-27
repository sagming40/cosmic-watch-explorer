// WatchlistEmpty.tsx ─ 저장한 천체가 없을 때. 빈 화면은 막다른 길이 아니라 다음 행동을 안내하는 자리 (03 문서 7.1절)

import type { ReactNode } from "react";
import { Link } from "react-router";

import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";

interface WatchlistEmptyProps {
  icon: ReactNode;
  text: string;
  to: string;
  action: string;
}

function WatchlistEmpty({ icon, text, to, action }: WatchlistEmptyProps) {
  return (
    <Panel className="flex flex-col items-center py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-line text-dim">{icon}</span>
      <p className="mt-4 font-medium">{text}</p>
      <p className="mt-1 text-sm text-dim">상세 화면의 ☆ 저장 버튼으로 추가할 수 있어요.</p>
      <Button variant="outline" className="mt-6" asChild>
        <Link to={to} className="text-bone">
          {action}
        </Link>
      </Button>
    </Panel>
  );
}

export default WatchlistEmpty;
