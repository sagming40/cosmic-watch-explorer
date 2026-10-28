// ProfileSection.tsx ─ 마이페이지 ① 내 정보 (04 문서 4.6절)
// 아이디·가입일은 보기만, 이메일은 비밀번호를 한 번 더 받고 바꾼다 (세션만 훔친 사람이 계정을 못 가져가게)

import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, LogOut } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import AvatarEditor from "@/components/account/AvatarEditor";
import { FormAlert, PasswordField, TextField } from "@/components/auth/AuthFields";
import { Panel, PanelTitle } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import type { AuthUser, FieldErrors } from "@/types/api";
import { DASH, kstDate } from "@/utils/format";

interface ProfileSectionProps {
  user: AuthUser;
  counts: { neo: number; exoplanet: number } | null; // 불러오는 중이면 null
}

function ProfileSection({ user, counts }: ProfileSectionProps) {
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <Panel>
      <PanelTitle
        title="내 정보"
        right={
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut /> 로그아웃
          </Button>
        }
      />
      <AvatarEditor user={user} />
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
        <Item label="아이디" value={user.username} />
        <Item label="가입일" value={kstDate(user.date_joined)} mono />
        <div className="min-w-0">
          <dt className="text-xs text-dim">이메일</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <span className="truncate">{user.email}</span>
            {!editing && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-dim hover:text-bone" onClick={() => { setEditing(true); setDone(false); }}>
                변경
              </Button>
            )}
          </dd>
        </div>
      </dl>
      {done && (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-sm text-signal">
          <Check className="size-4" /> 이메일을 바꿨어요.
        </p>
      )}
      {editing && <EmailForm current={user.email} onDone={() => { setEditing(false); setDone(true); }} onCancel={() => setEditing(false)} />}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-dim">
          관심 천체 · 소행성 <span className="font-mono text-bone">{counts?.neo ?? DASH}</span> · 외계행성{" "}
          <span className="font-mono text-bone">{counts?.exoplanet ?? DASH}</span>
        </p>
        <Link to="/watchlist" className="inline-flex items-center gap-1 text-sm">
          내 관심 천체 <ArrowRight className="size-4" />
        </Link>
      </div>
    </Panel>
  );
}

function Item({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-dim">{label}</dt>
      <dd className={mono ? "mt-1 font-mono" : "mt-1 truncate"}>{value}</dd>
    </div>
  );
}

function EmailForm({ current, onDone, onCancel }: { current: string; onDone: () => void; onCancel: () => void }) {
  const { updateUser } = useAuth();
  const [email, setEmail] = useState(current);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<FieldErrors | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFields(null);
    setFormError(null);
    try {
      const res = await api.patch<{ user: AuthUser }>("/account/email/", { email: email.trim(), password });
      updateUser(res.data.user); // 헤더·다른 화면이 보는 사본도 같이
      onDone();
    } catch (err) {
      const e2 = err as AppError;
      if (e2.code === "VALIDATION_ERROR" && e2.fields) setFields(e2.fields);
      else if (e2.code === "RATE_LIMITED") setFormError("시도가 너무 많아요. 잠시 후 다시 시도해 주세요.");
      else setFormError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <form className="mt-4 grid max-w-sm gap-3 rounded-lg border border-line p-4" onSubmit={submit}>
      {formError && <FormAlert>{formError}</FormAlert>}
      <TextField name="email" type="email" label="새 이메일" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} errors={fields?.email} />
      <PasswordField name="password" label="비밀번호 확인" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} errors={fields?.password} />
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "바꾸는 중…" : "이메일 바꾸기"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>취소</Button>
      </div>
    </form>
  );
}

export default ProfileSection;
