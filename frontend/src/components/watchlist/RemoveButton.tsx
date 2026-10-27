// RemoveButton.tsx ─ 관심 천체 한 줄의 삭제(휴지통) 버튼. 확인창 없이 바로 지운다 (03 문서 시나리오 4)
// 아이콘만 있는 버튼이라 aria-label에 "무엇을" 지우는지까지 넣는다 ─ 화면 낭독기에선 "삭제, 삭제, 삭제…"만 들리면 안 된다.

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`${label} 삭제`} title="삭제" onClick={onClick} className="text-dim hover:text-bone">
      <Trash2 />
    </Button>
  );
}

export default RemoveButton;
