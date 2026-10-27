// auth/context.ts ─ 로그인 상태를 앱 전체에 나눠 주는 "방송국" (React Context)
// 값을 만드는 쪽은 AuthProvider.tsx, 받아 쓰는 쪽은 useAuth().
// (컴포넌트가 아닌 것만 따로 둔 파일 ─ react-refresh 규칙)

import { createContext } from "react";
import type { AuthUser } from "@/types/api";

export interface AuthContextValue {
  /** "loading" = 앱이 막 떠서 /api/auth/me/ 응답을 기다리는 중. 이때는 로그인 여부를 단정하지 않는다 */
  status: "loading" | "ready";
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (input: { username: string; email: string; password: string; password_confirm: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
