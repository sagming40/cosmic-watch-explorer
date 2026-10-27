// ═══════════════════════════════════════════════════════════════════
// AuthProvider.tsx ─ 로그인 상태를 한 곳에서 들고 있다가 앱 전체에 나눠 준다 (04 문서 4장, 8장)
//
// 앱이 뜰 때: GET /api/auth/csrf/ (쿠키 받기) → GET /api/auth/me/ (지금 로그인돼 있나?)
//   비유: 식당에 들어가면 번호표부터 뽑고(CSRF), 회원 카드가 있는지 확인(me)한다.
// 로그인·가입·로그아웃은 여기 함수로만 한다 → 헤더·저장 버튼이 같은 상태를 본다.
//
// 세션은 서버(httpOnly 쿠키)에 있고, 여기 user는 "화면 표시용 사본"이다.
// 새로고침하면 사본은 사라지지만 쿠키는 남아서, /me/로 다시 받아온다 (04 문서 4.2절).
//
// 10-27부터 화면·API 전부 로그인 필요 → 어느 요청이든 401(AUTH_REQUIRED)이 오면 "세션이 끝났다"는 뜻.
// 아래 응답 감시(interceptor)가 사본을 지우면 ProtectedRoute가 /login?next=지금 주소 로 보낸다.
// (화면마다 401을 따로 처리하지 않아도 된다)
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, ensureCsrf, type AppError } from "@/api/client";
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
        // 서버가 꺼져 있으면 "비로그인"으로 본다 ─ 로그인 화면으로 가고, 로그인 시도에서 "서버 연결 불가"가 뜬다
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setStatus("ready");
      });
    return () => {
      ignore = true;
    };
  }, []);

  // ─── 세션 만료 감시 ─ client.ts의 감시자(오류 봉투 → AppError)가 먼저 등록돼 있어서 여기엔 AppError가 온다 ───
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (err: AppError) => {
      if (err?.code === "AUTH_REQUIRED") setUser(null);
      return Promise.reject(err); // 오류는 그대로 화면에 넘긴다 ─ 지우기만 하고 삼키지 않는다
    });
    return () => api.interceptors.response.eject(id);
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
