// AuthFields.tsx ─ 로그인·회원가입 입력 부품
// 폼 오류는 빨강(--hazard) 대신 아이콘 + 흰 글자 + 흰 테두리 (03 문서 2.5절, 10-27 확정).
// aria-invalid를 주면 shadcn Input이 destructive(=bone) 테두리를 자동으로 그린다.

import { useState, type ComponentProps, type ReactNode } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";

/** 폼 전체 오류 (예: 아이디 또는 비밀번호 불일치) */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-bone/40 bg-line/50 px-3 py-2.5 text-sm text-bone">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <span id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-bone">
      <CircleAlert className="mt-px size-3.5 shrink-0" />
      {messages.join(" ")}
    </span>
  );
}

interface TextFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
}

export function TextField({ name, label, hint, errors, ...props }: TextFieldProps) {
  const errId = `${name}-error`;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <Input name={name} className="h-11" aria-invalid={errors?.length ? true : undefined} aria-describedby={errors?.length ? errId : undefined} {...props} />
      {hint && !errors?.length && <span className="mt-1 block text-xs text-dim">{hint}</span>}
      <FieldError id={errId} messages={errors} />
    </label>
  );
}

interface PasswordFieldProps extends Omit<ComponentProps<typeof Input>, "type"> {
  name: string;
  label: string;
  errors?: string[];
}

export function PasswordField({ name, label, errors, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errId = `${name}-error`;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="relative">
        <Input
          name={name}
          type={visible ? "text" : "password"}
          className="h-11 pr-10 font-mono"
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? errId : undefined}
          {...props}
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
      <FieldError id={errId} messages={errors} />
    </label>
  );
}
