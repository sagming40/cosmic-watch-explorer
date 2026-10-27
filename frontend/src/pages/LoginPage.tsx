// ═══════════════════════════════════════════════════════════════════
// LoginPage.tsx ─ Path = '/login' (03 문서 4.3절·시나리오 3, 04 문서 4.4절)
// 로그인에 성공하면 ?next= 주소로 돌아간다 (예: 저장 버튼을 누르던 소행성 상세).
// ═══════════════════════════════════════════════════════════════════

import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";

import type { AppError } from "@/api/client";
import { loginPath, safeNext } from "@/auth/next";
import { useAuth } from "@/auth/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import { FormAlert, PasswordField, TextField } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/button";
import type { FieldErrors } from "@/types/api";

function LoginPage() {
  const { status, user, login } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  // 이미 로그인돼 있으면 폼을 보여줄 이유가 없다 → 바로 돌려보낸다
  if (status === "ready" && user && !busy) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setFieldErrors(null);
    try {
      await login(username.trim(), password);
      navigate(next, { replace: true }); // 로그인 화면은 기록에서 지운다 ─ 뒤로 가기로 다시 오지 않게
    } catch (err) {
      const e2 = err as AppError;
      // 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는다 (04 문서 4.4절 ─ 계정 열거 방지)
      if (e2.code === "INVALID_CREDENTIALS") setFormError(e2.message);
      else if (e2.code === "VALIDATION_ERROR") setFieldErrors(e2.fields);
      else setFormError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <AuthLayout next={next}>
      <h1 className="text-3xl font-bold tracking-tight">로그인</h1>
      <p className="mt-2 text-sm text-dim">로그인하면 지구 근접 소행성과 외계행성 데이터를 볼 수 있어요.</p>

      <form className="mt-8 space-y-4" onSubmit={submit}>
        {formError && <FormAlert>{formError}</FormAlert>}
        {/* required ─ 빈 칸은 브라우저가 먼저 막는다 (서버의 "blank일 수 없습니다" 문구까지 가지 않게) */}
        <TextField
          name="username"
          label="아이디"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          errors={fieldErrors?.username}
        />
        <PasswordField
          name="password"
          label="비밀번호"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errors={fieldErrors?.password}
        />
        <Button type="submit" className="mt-2 h-11 w-full text-base" disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        계정이 없나요?{" "}
        {/* next를 그대로 넘긴다 ─ 가입 후에도 원래 페이지로 (시나리오 3) */}
        <Link to={next === "/" ? "/signup" : loginPath(next, "/signup")} className="font-medium text-signal underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
