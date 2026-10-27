import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() ─ className을 조건부로 합치고, 겹치는 Tailwind 클래스는 뒤의 것만 남긴다.
// 예: cn("px-2 text-dim", isActive && "text-sodium") → "px-2 text-sodium"
// shadcn/ui 컴포넌트가 전부 이 함수를 쓴다.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
