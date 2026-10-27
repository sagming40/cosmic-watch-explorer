import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "./context";

/** 로그인 상태 꺼내 쓰기 ─ AuthProvider 안쪽 어디서든 */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있다");
  return value;
}
