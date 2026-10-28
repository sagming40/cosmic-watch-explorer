// UserAvatar.tsx ─ 프로필 원 하나 (10-28). 사진이 있으면 사진, 없거나 못 불러오면 아이디 머리글자.
// 헤더 버튼·미니 메뉴·마이페이지가 같이 쓴다 ─ "사진이 없을 때 모양"을 한 곳에서만 정한다.

import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  src: string | null; // AuthUser.avatar_url 또는 업로드 전 미리보기(blob:) 주소
  className?: string; // 크기·글자 크기 (예: "size-8 text-sm")
}

function UserAvatar({ username, src, className }: UserAvatarProps) {
  // 사진 주소가 깨졌으면(예: 다른 탭에서 지움) 머리글자로 ─ 깨진 이미지 아이콘을 보이지 않게.
  // 주소가 바뀌면 다시 시도해야 하므로 "어느 주소가 실패했는지"를 기억한다
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== failedSrc;

  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-line font-semibold text-bone uppercase", className)}>
      {showImage ? (
        // alt="" ─ 옆이나 버튼 이름에 아이디가 이미 있다(장식 이미지). 화면 낭독기가 두 번 읽지 않게
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        <span aria-hidden>{username[0]}</span>
      )}
    </span>
  );
}

export default UserAvatar;
