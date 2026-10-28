// AvatarEditor.tsx ─ 마이페이지 "내 정보" 맨 위: 프로필 사진 바꾸기 (10-28, 04 문서 4.6절)
//
// 흐름: [사진 바꾸기] → 파일 고르기 → 동그란 미리보기 + [저장]/[취소] → 저장하면 헤더·미니 메뉴도 바로 바뀐다.
// 화면에서 먼저 거르는 것(형식·2MB)은 친절함일 뿐, 진짜 검사는 서버가 한다(이미지로 열어 보고 256px로 새로 만듦).

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, CircleAlert } from "lucide-react";

import { api, type AppError } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import UserAvatar from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types/api";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;

function AvatarEditor({ user }: { user: AuthUser }) {
  const { updateUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // 업로드 전 미리보기(blob: 주소)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 미리보기 주소는 브라우저 메모리를 잡고 있다 → 바뀌거나 화면을 떠나면 돌려준다
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function choose(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 change가 나게
    if (!picked) return;
    setError(null);
    if (!ACCEPT.includes(picked.type)) return setError("JPG·PNG·WebP·GIF 사진만 올릴 수 있어요.");
    if (picked.size > MAX_BYTES) return setError("사진은 2MB 이하만 올릴 수 있어요.");
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  function cancel() {
    setFile(null);
    setPreview(null);
    setError(null);
  }

  async function save() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("avatar", file);
    try {
      const res = await api.put<{ user: AuthUser }>("/account/avatar/", form); // FormData면 axios가 multipart로 보낸다
      updateUser(res.data.user);
      cancel();
    } catch (err) {
      const e2 = err as AppError;
      if (e2.code === "VALIDATION_ERROR") setError(e2.fields?.avatar?.[0] ?? e2.message);
      else if (e2.code === "RATE_LIMITED") setError("너무 자주 바꿨어요. 잠시 후 다시 시도해 주세요.");
      else setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.delete<{ user: AuthUser }>("/account/avatar/");
      updateUser(res.data.user);
    } catch {
      setError("기본으로 되돌리지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-line pb-5">
      <UserAvatar username={user.username} src={preview ?? user.avatar_url} className="size-16 text-2xl" />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          {preview ? (
            <>
              <Button size="sm" onClick={save} disabled={busy}>
                {busy ? "올리는 중…" : "이 사진으로 저장"}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
                취소
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
                <Camera /> 사진 바꾸기
              </Button>
              {user.avatar_url && (
                <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
                  기본으로
                </Button>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-dim">{preview ? "가운데를 기준으로 정사각형으로 잘라 저장돼요." : "JPG·PNG·WebP·GIF, 2MB 이하 · 사진 속 위치 정보는 저장되지 않아요."}</p>
        {error && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-bone">
            <CircleAlert className="size-4 shrink-0" /> {error}
          </p>
        )}
      </div>
      {/* 눈에 안 보이는 파일 고르기 ─ 위 버튼이 대신 누른다. 키보드 사용자는 버튼으로 들어온다 */}
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={choose} />
    </div>
  );
}

export default AvatarEditor;
