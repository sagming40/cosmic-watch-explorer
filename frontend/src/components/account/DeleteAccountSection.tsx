// DeleteAccountSection.tsx ─ 마이페이지 ④ 계정 삭제 (04 문서 4.6절)
//
// 되돌릴 수 없는 동작이라 확인창 + 비밀번호. (관심 천체 삭제는 "실행 취소"로 충분했지만 계정은 다르다 ─ 03 문서 시나리오 4 각주)
// 색: 빨강(hazard)은 위험 소행성 전용, variant="destructive" 버튼은 금지 (CLAUDE.md 3.4절) → 흰 테두리로 강조

import { useState, type FormEvent } from "react";
import { TriangleAlert } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { FormAlert, PasswordField } from "@/components/auth/AuthFields";
import { Panel, PanelTitle } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DANGER_BUTTON = "border-bone/70 text-bone hover:bg-bone hover:text-ink";

function DeleteAccountSection({ username }: { username: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.delete("/account/", { data: { password } });
      // 페이지를 통째로 새로 연다 (10-28). 처음엔 navigate + updateUser(null)를 같은 순간에 부르면 한 번에 그려질 줄 알았는데,
      // React Router는 주소 이동을 "낮은 우선순위(transition)"로 처리해서 로그인 상태 지우기가 먼저 그려졌다
      // → 문지기(ProtectedRoute)가 /login?next=/account 로 보내 버림 (실측). 서버 세션은 이미 지워졌으니
      // 새로 열면 비로그인으로 시작하고, 메모리에 남은 예전 계정 정보도 깨끗이 사라진다.
      window.location.replace("/login?bye=1");
    } catch (err) {
      const e2 = err as AppError;
      if (e2.code === "VALIDATION_ERROR") setError("비밀번호가 올바르지 않습니다.");
      else if (e2.code === "RATE_LIMITED") setError("시도가 너무 많아요. 잠시 후 다시 시도해 주세요.");
      else setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  return (
    <Panel className="border-bone/30">
      <PanelTitle title="계정 삭제" sub="관심 천체와 표시 설정도 모두 지워지고, 되돌릴 수 없어요." />
      <Dialog onOpenChange={(open) => { if (!open) { setPassword(""); setError(null); } }}>
        <DialogTrigger asChild>
          <Button variant="outline" className={DANGER_BUTTON}>
            <TriangleAlert /> 계정 삭제
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={submit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>정말 계정을 삭제할까요?</DialogTitle>
              <DialogDescription>
                <span className="font-medium text-bone">{username}</span> 계정과 저장한 관심 천체가 모두 지워져요. 확인을 위해 비밀번호를 입력해 주세요.
              </DialogDescription>
            </DialogHeader>
            {error && <FormAlert>{error}</FormAlert>}
            <PasswordField name="delete_password" label="비밀번호" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">취소</Button>
              </DialogClose>
              <Button type="submit" variant="outline" className={DANGER_BUTTON} disabled={busy || !password}>
                {busy ? "삭제 중…" : "계정 삭제"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

export default DeleteAccountSection;
