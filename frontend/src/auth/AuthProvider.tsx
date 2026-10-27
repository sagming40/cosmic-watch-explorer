// ═══════════════════════════════════════════════════════════════════
// AuthProvider.tsx ─ 로그인 상태를 한 곳에서 들고 있다가 앱 전체에 나눠 준다 (04 문서 4장, 8장)
//
// 앱이 뜰 때: GET /api/auth/csrf/ (쿠키 받기) → GET /api/auth/me/ (지금 로그인돼 있나?)
//   비유: 식당에 들어가면 번호표부터 뽑고(CSRF), 회원 카드가 있는지 확인(me)한다.
// 로그인·가입·로그아웃은 여기 함수로만 한다 → 헤더·저장 버튼이 같은 상태를 본다.
//
// 세션은 서버(httpOnly 쿠키)에 있고, 여기 user는 "화면 표시용 사본"이다.
// 새로고침하면 사본은 사라지지만 쿠키는 남아서, /me/로 다시 받아온다 (04 문서 4.2절).
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, ensureCsrf } from "@/api/client";
import type { AuthStatus, AuthUser } from "@/types/api";

import { AuthContext, type AuthContextValue } from "./context";

function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let ignore = false;
    // CSRF 쿠키가 먼저 있어야 이후 POST(로그인·저장)가 403 CSRF_FAILED로 튕기지 않는다 (04 문서 2.2절)
    ensureCsrf()
      .then(() => api.get<AuthStatus>("/auth/me/"))
      .then((res) => {
        if (!ignore) setUser(res.data.user);
      })
      .catch(() => {
        // 서버가 꺼져 있으면 "비로그인"으로 본다 ─ 공개 화면은 계속 쓸 수 있게
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setStatus("ready");
      });
    return () => {
      ignore = true;
    };
  }, []);

  // 오류는 여기서 삼키지 않는다 ─ 화면(로그인 폼)이 AppError.code/fields를 보고 문구를 고른다
  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<AuthStatus>("/auth/login/", { username, password });
    setUser(res.data.user);
  }, []);

  // 가입과 동시에 로그인된다 (04 문서 4.3절) → 가입 직후 바로 저장 가능
  const signup = useCallback(async (input: Parameters<AuthContextValue["signup"]>[0]) => {
    const res = await api.post<AuthStatus>("/auth/signup/", input);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      // 서버가 이미 세션을 잃었어도(401) 화면은 로그아웃 상태로
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ status, user, login, signup, logout }), [status, user, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
