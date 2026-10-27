// StateViews.tsx ─ 로딩 / 오류 화면 (03 문서 7장 ─ 외부 API에 의존하는 화면에서 이 둘은 예외가 아니라 일상)
// 대시보드·상세가 같이 쓴다.

import type { ReactNode } from "react";
import { CircleAlert, RotateCw } from "lucide-react";

import type { AppError } from "@/api/client";
import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── 로딩 ─ 스피너 대신 자리표시자(스켈레톤). 화면이 비어 보이지 않게 (7.2절) ─────
// blocks = 자리표시자 높이 목록(Tailwind 클래스). 화면마다 실제 배치와 비슷하게 넘긴다.
export function LoadingState({ slow, blocks }: { slow: boolean; blocks: string[] }) {
  const block = "rounded-xl border border-line bg-panel/60 motion-safe:animate-pulse";
  return (
    <div aria-busy="true" aria-live="polite">
      {/* 3초가 넘으면 왜 기다리는지 알려준다 ─ 체감 대기 시간이 줄어든다 */}
      {slow && <p className="mb-3 text-sm text-dim">NASA에서 데이터를 가져오는 중입니다. 처음 조회하는 항목은 몇 초 걸릴 수 있어요.</p>}
      <div className="grid gap-3">
        {blocks.map((h, i) => (
          <div key={i} className={cn(block, h)} />
        ))}
      </div>
    </div>
  );
}

// 오류 코드 → 화면 문구. 사과하지 않는다 ─ 무슨 일이 있었고 지금 무엇을 할 수 있는지 (7.3절)
const MESSAGE: Partial<Record<AppError["code"], string>> = {
  INVALID_DATE: "주소의 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)",
  NOT_FOUND: "찾는 항목이 없습니다. 주소를 확인해 주세요.",
  RATE_LIMITED: "요청이 많아 잠시 멈췄어요. 잠시 후 다시 시도해 주세요.",
  UPSTREAM_ERROR: "NASA 데이터 서버에 연결할 수 없습니다. 저장된 데이터도 없는 항목이에요.",
  NETWORK_ERROR: "서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.",
  UNKNOWN_ERROR: "서버에 연결할 수 없습니다.",
};

// ─── 오류 ─ action을 넘기면 그 버튼을, 안 넘기면 "다시 시도"를 보여준다 ─────
export function ErrorState({ error, onRetry, action }: { error: AppError; onRetry: () => void; action?: ReactNode }) {
  return (
    <Panel className="flex flex-col items-center py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-line text-bone">
        <CircleAlert className="size-5" />
      </span>
      <p role="alert" className="mt-4 font-medium">
        {MESSAGE[error.code] ?? error.message}
      </p>
      <p className="mt-1 font-mono text-xs text-dim">{error.code}</p>
      <div className="mt-6 flex gap-2">
        {action ?? (
          <Button onClick={onRetry}>
            <RotateCw /> 다시 시도
          </Button>
        )}
      </div>
    </Panel>
  );
}
