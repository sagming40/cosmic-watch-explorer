// UndoToast.tsx ─ 삭제 직후 화면 아래에 뜨는 "실행 취소" 알림 (03 문서 시나리오 4 ─ 5초 노출)
// role="status" ─ 화면 낭독기가 "○○을(를) 삭제했어요"를 읽어 준다(초점은 옮기지 않는다).
// 카운트다운·닫기 타이머는 부모(WatchlistPage)가 쥐고, 이 부품은 보여주기만 한다.

import { CircleAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UndoToastProps {
  name: string;
  secondsLeft: number;
  busy: boolean;
  error: string | null; // 삭제·되돌리기 실패 문구 ─ 있으면 실행 취소 버튼 대신 보여준다
  onUndo: () => void;
}

function UndoToast({ name, secondsLeft, busy, error, onUndo }: UndoToastProps) {
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full items-center gap-4 rounded-full border border-line bg-panel py-2 pr-2 pl-5 text-sm">
        {error ? (
          <span className="flex items-center gap-2 py-1.5 pr-3">
            <CircleAlert className="size-4 shrink-0" />
            {error}
          </span>
        ) : (
          <>
            <span className="min-w-0 truncate">
              <span className="font-medium">{name}</span> 을(를) 삭제했어요
            </span>
            <Button size="sm" variant="secondary" className="shrink-0 rounded-full" onClick={onUndo} disabled={busy}>
              <Undo2 /> 실행 취소 <span className="font-mono text-dim">{secondsLeft}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default UndoToast;
