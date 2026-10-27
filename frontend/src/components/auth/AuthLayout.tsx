// AuthLayout.tsx ─ 로그인·회원가입 공통 틀: 왼쪽 소개 패널(넓은 화면만) + 오른쪽 폼
// 03 문서 4.3절 ─ ?next= 로 들어왔으면 폼 위에 "로그인하면 보던 ○○로 돌아가요"를 먼저 보여준다.

import type { ReactNode } from "react";
import { ArrowLeft, Check, Orbit } from "lucide-react";

import { nextLabel } from "@/auth/next";
import { cn } from "@/lib/utils";

function AuthLayout({ next, action = "로그인", children }: { next: string; action?: "로그인" | "가입"; children: ReactNode }) {
  const label = nextLabel(next);
  return (
    <div className="grid gap-3 pt-10 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden rounded-xl border border-line bg-panel/60 p-10 lg:flex lg:flex-col">
        <span className="accent-tint grid size-11 place-items-center rounded-xl">
          <Orbit className="size-5.5" />
        </span>
        <h2 className="mt-auto pt-16 text-4xl leading-tight font-bold tracking-tight">
          오늘 지구 곁을
          <br />
          지나는 것들을
          <br />
          <span className="text-signal">지켜보세요.</span>
        </h2>
        <ul className="mt-8 space-y-3 text-sm text-dim">
          <li className="flex gap-2">
            <Check className="size-4 text-signal" /> 오늘 접근하는 소행성 · 외계행성 6,000여 개 탐색
          </li>
          <li className="flex gap-2">
            <Check className="size-4 text-signal" /> 관심 천체 저장, 다음 접근일을 한곳에서
          </li>
          <li className="flex gap-2">
            <Check className="size-4 text-signal" /> 가입 즉시 로그인, 보던 페이지로 바로 복귀
          </li>
        </ul>
        {/* 장식 ─ 달 거리 스케일을 닮은 점선 */}
        <div className="relative mt-10 h-10" aria-hidden>
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          <div className="absolute top-1/2 left-[28%] h-6 w-px -translate-y-1/2 border-l border-dashed border-dim" />
          {[12, 41, 55, 63, 70, 78, 86].map((x, i) => (
            <span key={x} className={cn("absolute top-1/2 size-2 -translate-1/2 rounded-full", i === 0 ? "bg-bone" : "bg-signal/80")} style={{ left: `${x}%` }} />
          ))}
        </div>
      </aside>

      <div className="flex justify-center rounded-xl border border-line bg-panel/80 px-5 py-10 backdrop-blur md:px-10">
        <div className="w-full max-w-sm">
          {label && (
            <div className="mb-8 flex items-center gap-2 rounded-lg border border-line bg-line/30 px-3 py-2.5 text-sm text-dim">
              <ArrowLeft className="size-4 shrink-0" />
              <span>
                {action}하면 <span className="font-medium text-bone">{label}</span>로 돌아가요
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
