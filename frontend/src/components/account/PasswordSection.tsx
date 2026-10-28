// PasswordSection.tsx ─ 마이페이지 ③ 보안: 비밀번호 변경 (04 문서 4.6절)
// 바꾸면 지금 기기는 로그인 유지, 다른 기기는 로그아웃된다 (서버 update_session_auth_hash) ─ 그 사실을 화면에 미리 알린다.

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { FormAlert, PasswordField } from "@/components/auth/AuthFields";
import { Panel, PanelTitle } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import type { FieldErrors } from "@/types/api";

const EMPTY = { current_password: "", new_password: "", new_password_confirm: "" };

function PasswordSection() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [fields, setFields] = useState<FieldErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  // 화면에서 미리 알 수 있는 것만 ─ 나머지 규칙(흔한 비밀번호 등)은 서버 칸 오류로 받는다 (회원가입과 같은 방식)
  const mismatch = form.new_password_confirm.length > 0 && form.new_password !== form.new_password_confirm;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    setDone(false);
    setFields(null);
    setFormError(null);
    try {
      await api.post("/account/password/", form);
      setForm(EMPTY); // 비밀번호는 화면에 남겨 두지 않는다
      setDone(true);
    } catch (err) {
      const e2 = err as AppError;
      if (e2.code === "VALIDATION_ERROR" && e2.fields) setFields(e2.fields);
      else if (e2.code === "RATE_LIMITED") setFormError("시도가 너무 많아요. 잠시 후 다시 시도해 주세요.");
      else setFormError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <PanelTitle title="비밀번호 변경" sub="바꾸면 이 기기는 그대로, 다른 기기에서는 다시 로그인해야 해요." />
      <form className="grid max-w-sm gap-3" onSubmit={submit}>
        {formError && <FormAlert>{formError}</FormAlert>}
        {done && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-signal">
            <Check className="size-4" /> 비밀번호를 바꿨어요.
          </p>
        )}
        <PasswordField name="current_password" label="현재 비밀번호" autoComplete="current-password" required value={form.current_password} onChange={(e) => set("current_password")(e.target.value)} errors={fields?.current_password} />
        <PasswordField name="new_password" label="새 비밀번호" autoComplete="new-password" required value={form.new_password} onChange={(e) => set("new_password")(e.target.value)} errors={fields?.new_password} />
        <PasswordField
          name="new_password_confirm"
          label="새 비밀번호 확인"
          autoComplete="new-password"
          required
          value={form.new_password_confirm}
          onChange={(e) => set("new_password_confirm")(e.target.value)}
          errors={mismatch ? ["비밀번호가 일치하지 않습니다."] : fields?.new_password_confirm}
        />
        <p className="text-xs text-dim">8자 이상, 숫자로만 이루어지지 않게. 너무 흔하거나 아이디와 비슷하면 서버가 거절해요.</p>
        <div>
          <Button type="submit" disabled={busy || mismatch}>{busy ? "바꾸는 중…" : "비밀번호 바꾸기"}</Button>
        </div>
      </form>
    </Panel>
  );
}

export default PasswordSection;
