// ProfileMenu.tsx ─ 헤더 프로필 원을 누르면 뜨는 미니 메뉴 (10-28, 03 문서 6.x)
//
// 마우스를 올리면(hover) 열리는 방식이 아니라 "클릭" ─ 휴대폰엔 올리기가 없고 키보드로도 못 연다(M5 접근성 규칙).
// shadcn dropdown-menu(Radix): 방향키로 이동, Enter로 선택, Esc로 닫기, 닫히면 초점이 프로필 원으로 돌아온다.
// 로그아웃이 메뉴 안으로 들어와서, 헤더의 로그아웃 아이콘(휴대폰에선 공간 때문에 숨겼던 것)은 없앴다.

import { useState } from "react";
import { Link, useLocation } from "react-router";
import { LogOut, Star, UserRound } from "lucide-react";

import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import UserAvatar from "@/components/common/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AccountSummary, AuthUser } from "@/types/api";

function ProfileMenu({ user }: { user: AuthUser }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [counts, setCounts] = useState<AccountSummary["watchlist_counts"] | null>(null);

  // 관심 천체 개수는 메뉴를 열 때마다 새로 받는다 ─ 다른 화면에서 저장·삭제했을 수 있어서. 못 받으면 개수만 안 보인다
  function handleOpenChange(open: boolean) {
    if (!open) return;
    api
      .get<AccountSummary>("/account/")
      .then((res) => setCounts(res.data.watchlist_counts))
      .catch(() => setCounts(null));
  }

  const onAccount = pathname.startsWith("/account");

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className={cn(
          "rounded-full p-0.5 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          onAccount ? "bg-signal" : "hover:bg-line", // 마이페이지에 있으면 신호색 테두리
        )}
        aria-label={`내 계정 메뉴 (${user.username})`}
      >
        <UserAvatar username={user.username} src={user.avatar_url} className="size-8 text-sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
          <UserAvatar username={user.username} src={user.avatar_url} className="size-10 text-base" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-bone">{user.username}</span>
            <span className="block truncate text-xs text-dim">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="text-bone">
            <UserRound /> 내 계정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/watchlist" className="text-bone">
            <Star /> 내 관심 천체
            {counts && (
              <span className="ml-auto font-mono text-xs text-dim" aria-label={`소행성 ${counts.neo}개, 외계행성 ${counts.exoplanet}개`}>
                {counts.neo} · {counts.exoplanet}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut /> 로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ProfileMenu;
