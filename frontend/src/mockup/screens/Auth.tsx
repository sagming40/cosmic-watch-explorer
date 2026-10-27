// ═══════════════════════════════════════════════════════════════════
// Auth.tsx ─ 목업 화면 6·7: 로그인 (/login) · 회원가입 (/signup)
// 03 문서 4.3절(?next= 복귀), 시나리오 3 / 04 문서 4.3·4.4절
//
// ⚠️ 폼 오류 색: 빨강(--hazard)은 "위험 소행성 표시 전용"(03 문서 2.1절)이라 쓰지 않는다.
//    오류는 아이콘 + 밝은 글자 + 입력칸 테두리 강조로 표시한다. (10-27 확정 ─ index.css에서 destructive 역할을 bone에 연결)
// ═══════════════════════════════════════════════════════════════════

import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, CircleAlert, Eye, EyeOff, Orbit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { PageShell } from "../parts";

// ─── 로그인 ───────────────────────────────────────────────────────────
export function Login() {
  const [showError, setShowError] = useState(false);
  return (
    <AuthLayout>
      <NextBanner />
      <h1 className="text-3xl font-bold tracking-tight">로그인</h1>
      <p className="mt-2 text-sm text-dim">관심 천체를 저장하고 다음 접근을 한눈에 확인하세요.</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* 계정 열거 방지 ─ 아이디/비밀번호 중 무엇이 틀렸는지 구분하지 않는다 (04 문서 4.4절) */}
        {showError && (
          <FormAlert>아이디 또는 비밀번호가 올바르지 않습니다.</FormAlert>
        )}
        <TextField label="아이디" placeholder="mingyu" autoComplete="username" />
        <PasswordField label="비밀번호" autoComplete="current-password" />
        <Button type="submit" className="mt-2 h-11 w-full text-base" onClick={() => setShowError((v) => !v)}>
          로그인
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        계정이 없나요?{" "}
        <a href="#" className="font-medium text-signal underline-offset-4 hover:underline">
          회원가입
        </a>
      </p>
      <MockHint>로그인 버튼을 누르면 오류 상태를 켜고 끌 수 있어요 (목업 전용)</MockHint>
    </AuthLayout>
  );
}

// ─── 회원가입 ─────────────────────────────────────────────────────────
export function Signup() {
  const [pw, setPw] = useState("cosmic2026");
  const [pw2, setPw2] = useState("cosmic2025");
  const rules = [
    { ok: pw.length >= 8, label: "8자 이상" },
    { ok: !/^\d+$/.test(pw), label: "숫자로만 이루어지지 않음" },
    { ok: !["password", "12345678", "qwerty12"].includes(pw.toLowerCase()), label: "너무 흔한 비밀번호가 아님" },
  ];
  const mismatch = pw2.length > 0 && pw !== pw2;

  return (
    <AuthLayout>
      <NextBanner />
      <h1 className="text-3xl font-bold tracking-tight">계정 만들기</h1>
      <p className="mt-2 text-sm text-dim">가입하면 바로 로그인돼서, 보던 페이지에서 저장을 이어갈 수 있어요.</p>

      <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <TextField label="아이디" placeholder="영문·숫자·_ 3~30자" defaultValue="mingyu" hint="영문, 숫자, _ 만 쓸 수 있어요" />
        <TextField label="이메일" type="email" placeholder="you@example.com" defaultValue="mingyu@example.com" />
        <PasswordField label="비밀번호" value={pw} onChange={setPw} autoComplete="new-password" />
        <ul className="grid gap-1 text-xs">
          {rules.map((r) => (
            <li key={r.label} className={cn("flex items-center gap-1.5", r.ok ? "text-signal" : "text-dim")}>
              <Check className={cn("size-3.5", !r.ok && "opacity-30")} />
              {r.label}
            </li>
          ))}
        </ul>
        <PasswordField
          label="비밀번호 확인"
          value={pw2}
          onChange={setPw2}
          autoComplete="new-password"
          error={mismatch ? "비밀번호가 일치하지 않습니다." : undefined}
        />
        <Button type="submit" className="mt-2 h-11 w-full text-base" disabled={mismatch}>
          가입하고 시작하기
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        이미 계정이 있나요?{" "}
        <a href="#" className="font-medium text-signal underline-offset-4 hover:underline">
          로그인
        </a>
      </p>
      <MockHint>비밀번호 확인 칸을 같게 고치면 오류가 사라지고 버튼이 켜져요 (목업 전용)</MockHint>
    </AuthLayout>
  );
}

// ─── 공통 틀: 왼쪽 소개 패널 + 오른쪽 폼 ─────────────────────────────────
function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell active={null}>
      <div className="grid gap-3 pt-10 lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden rounded-xl border border-line bg-panel/60 p-10 lg:flex lg:flex-col">
          <span className="mock-accent-tint grid size-11 place-items-center rounded-xl">
            <Orbit className="size-5.5" />
          </span>
          <h2 className="mt-auto text-4xl leading-tight font-bold tracking-tight">
            오늘 지구 곁을
            <br />
            지나는 것들을
            <br />
            <span className="text-signal">지켜보세요.</span>
          </h2>
          <ul className="mt-8 space-y-3 text-sm text-dim">
            <li className="flex gap-2"><Check className="size-4 text-signal" /> 소행성·외계행성을 관심 천체로 저장</li>
            <li className="flex gap-2"><Check className="size-4 text-signal" /> 저장한 소행성의 다음 접근일을 한곳에서</li>
            <li className="flex gap-2"><Check className="size-4 text-signal" /> 가입 즉시 로그인, 보던 페이지로 바로 복귀</li>
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
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}

// ?next= 로 들어온 경우 ─ 로그인 뒤 어디로 돌아가는지 미리 알려준다 (03 문서 4.3절)
function NextBanner() {
  return (
    <div className="mb-8 flex items-center gap-2 rounded-lg border border-line bg-line/30 px-3 py-2.5 text-sm text-dim">
      <ArrowLeft className="size-4 shrink-0" />
      <span>
        로그인하면 보던 <span className="font-medium text-bone">357621 (2005 EG94)</span>로 돌아가요
      </span>
    </div>
  );
}

function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-bone/40 bg-line/50 px-3 py-2.5 text-sm text-bone">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {children}
    </div>
  );
}

function TextField({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <Input className="h-11" {...props} />
      {hint && <span className="mt-1 block text-xs text-dim">{hint}</span>}
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          className="h-11 pr-10 font-mono"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
          className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-dim hover:text-bone"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs text-bone">
          <CircleAlert className="size-3.5" />
          {error}
        </span>
      )}
    </label>
  );
}

function MockHint({ children }: { children: ReactNode }) {
  return <p className="mt-8 border-t border-dashed border-line pt-4 text-center text-xs text-dim">{children}</p>;
}
