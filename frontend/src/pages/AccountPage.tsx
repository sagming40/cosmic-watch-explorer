// ═══════════════════════════════════════════════════════════════════
// AccountPage.tsx ─ Path = '/account' 마이페이지 (04 문서 4.6절, 10-28 추가)
// 한 페이지에 4칸: ① 내 정보 ② 표시 설정 ③ 비밀번호 변경 ④ 계정 삭제
// 헤더의 머리글자 동그라미가 입구. 로그인 필요(App.tsx의 ProtectedRoute 아래)
//
// 아이디·이메일·설정은 AuthProvider가 이미 들고 있다(/me/) → 화면은 바로 그린다.
// 관심 천체 개수만 /api/account/에서 따로 받는다 (못 받아도 나머지 칸은 쓸 수 있게 "—")
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";

import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import DeleteAccountSection from "@/components/account/DeleteAccountSection";
import PasswordSection from "@/components/account/PasswordSection";
import PreferencesSection from "@/components/account/PreferencesSection";
import ProfileSection from "@/components/account/ProfileSection";
import type { AccountSummary } from "@/types/api";

function AccountPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<AccountSummary["watchlist_counts"] | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .get<AccountSummary>("/account/")
      .then((res) => {
        if (!ignore) setCounts(res.data.watchlist_counts);
      })
      .catch(() => {}); // 개수는 곁가지 ─ 실패하면 "—"로 두고 나머지 칸은 그대로 쓴다
    return () => {
      ignore = true;
    };
  }, []);

  if (!user) return null; // ProtectedRoute 아래라 실제로는 오지 않는다 (탈퇴 직후 한 순간)

  return (
    <>
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">내 계정</h1>
        <p className="mt-3 text-dim">계정 정보와 대시보드 표시 방식을 관리해요.</p>
      </section>
      <div className="grid max-w-3xl gap-3">
        <ProfileSection user={user} counts={counts} />
        <PreferencesSection user={user} />
        <PasswordSection />
        <DeleteAccountSection username={user.username} />
      </div>
    </>
  );
}

export default AccountPage;
