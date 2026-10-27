// ═══════════════════════════════════════════════════════════════════
// SignupPage.tsx ─ Path = '/signup' (03 문서 시나리오 3, 04 문서 4.3절)
// 가입 = 로그인. 성공하면 다시 로그인하지 않고 ?next= 주소로 돌아간다 (M4 완료 기준: 가입 직후 저장 버튼 동작)
//
// 규칙 검사는 서버가 최종 판정한다. 화면은 "알 수 있는 것"만 미리 알려준다
// (아이디 형식·비밀번호 길이·숫자로만·확인 일치). 흔한 비밀번호 여부 등은 서버 응답의 fields로 받는다.
// ═══════════════════════════════════════════════════════════════════

import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { Check } from "lucide-react";

import type { AppError } from "@/api/client";
import { loginPath, safeNext } from "@/auth/next";
import { useAuth } from "@/auth/useAuth";
import AuthLayout from "@/components/auth/AuthLayout";
import { FormAlert, PasswordField, TextField } from "@/components/auth/AuthFields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "@/types/api";

// 백엔드 USERNAME_VALIDATOR와 같은 규칙 (apps/accounts/serializers.py)
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

function SignupPage() {
  const { status, user, signup } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "", password_confirm: "" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null);

  if (status === "ready" && user && !busy) return <Navigate to={next} replace />;

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const pw = form.password;
  const rules = [
    { ok: pw.length >= 8, label: "8자 이상" },
    { ok: pw.length > 0 && !/^\d+$/.test(pw), label: "숫자로만 이루어지지 않음" },
  ];
  const mismatch = form.password_confirm.length > 0 && form.password !== form.password_confirm;
  const usernameBad = form.username.length > 0 && !USERNAME_RE.test(form.username);

  // 화면에서 미리 알 수 있는 오류 + 서버가 돌려준 오류를 합쳐서 칸 아래에 보여준다
  const errors: FieldErrors = { ...(fieldErrors ?? {}) };
  if (mismatch) errors.password_confirm = ["비밀번호가 일치하지 않습니다."];

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mismatch || usernameBad) return;
    setBusy(true);
    setFormError(null);
    setFieldErrors(null);
    try {
      await signup({ ...form, username: form.username.trim(), email: form.email.trim() });
      navigate(next, { replace: true });
    } catch (err) {
      const e2 = err as AppError;
      if (e2.code === "VALIDATION_ERROR" && e2.fields) setFieldErrors(e2.fields);
      else if (e2.code === "VALIDATION_ERROR") setFormError(e2.message); // 예: 동시에 같은 아이디로 가입 (IntegrityError)
      else setFormError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <AuthLayout next={next} action="가입">
      <h1 className="text-3xl font-bold tracking-tight">계정 만들기</h1>
      <p className="mt-2 text-sm text-dim">가입하면 바로 로그인돼서, 보던 페이지에서 저장을 이어갈 수 있어요.</p>

      <form className="mt-8 space-y-4" onSubmit={submit}>
        {formError && <FormAlert>{formError}</FormAlert>}
        <TextField
          name="username"
          label="아이디"
          autoComplete="username"
          required
          placeholder="영문·숫자·_ 3~30자"
          hint="영문, 숫자, _ 만 쓸 수 있어요"
          value={form.username}
          onChange={(e) => set("username")(e.target.value)}
          errors={usernameBad ? ["아이디는 영문, 숫자, _만 사용해 3~30자 이내로 입력해 주세요."] : errors.username}
        />
        <TextField
          name="email"
          type="email"
          label="이메일"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          errors={errors.email}
        />
        <PasswordField
          name="password"
          label="비밀번호"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => set("password")(e.target.value)}
          errors={errors.password}
        />
        <ul className="grid gap-1 text-xs" aria-label="비밀번호 규칙">
          {rules.map((r) => (
            <li key={r.label} className={cn("flex items-center gap-1.5", r.ok ? "text-signal" : "text-dim")}>
              <Check className={cn("size-3.5", !r.ok && "opacity-30")} />
              {r.label}
            </li>
          ))}
          <li className="text-dim">너무 흔한 비밀번호·아이디와 비슷한 비밀번호는 서버가 확인해요</li>
        </ul>
        <PasswordField
          name="password_confirm"
          label="비밀번호 확인"
          autoComplete="new-password"
          required
          value={form.password_confirm}
          onChange={(e) => set("password_confirm")(e.target.value)}
          errors={errors.password_confirm}
        />
        <Button type="submit" className="mt-2 h-11 w-full text-base" disabled={busy || mismatch || usernameBad}>
          {busy ? "가입 중…" : "가입하고 시작하기"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        이미 계정이 있나요?{" "}
        <Link to={next === "/" ? "/login" : loginPath(next)} className="font-medium text-signal underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignupPage;
