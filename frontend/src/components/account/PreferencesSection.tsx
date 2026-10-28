// PreferencesSection.tsx ─ 마이페이지 ② 표시 설정 (04 문서 4.6절)
// 누르는 즉시 화면에 반영하고 서버에 저장한다 ─ "저장" 버튼 없이. 실패하면 되돌리고 알린다.
// 서버(DB)에 두므로 회사 PC·집 PC 어디서 로그인해도 같은 설정 (localStorage는 기기마다 따로라 안 씀)

import { useState } from "react";
import { Check } from "lucide-react";

import { api } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { Panel, PanelTitle } from "@/components/common/Panel";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AuthUser, Preferences } from "@/types/api";

type SaveState = "idle" | "saving" | "saved" | "error";

function PreferencesSection({ user }: { user: AuthUser }) {
  const { updateUser } = useAuth();
  const [state, setState] = useState<SaveState>("idle");
  const pref = user.preferences;

  async function change(patch: Partial<Preferences>) {
    const before = user;
    updateUser({ ...user, preferences: { ...pref, ...patch } }); // 먼저 화면에 (낙관적 반영)
    setState("saving");
    try {
      const res = await api.patch<Preferences>("/account/preferences/", patch);
      updateUser({ ...before, preferences: res.data }); // 서버가 확정한 값으로 맞춘다
      setState("saved");
    } catch {
      updateUser(before); // 저장 실패 ─ 화면도 원래대로
      setState("error");
    }
  }

  return (
    <Panel>
      <PanelTitle title="표시 설정" sub="대시보드를 열 때 처음 보일 모양이에요. 모든 기기에 같이 적용돼요." right={<SaveBadge state={state} />} />
      <div className="grid gap-5">
        <Row label="거리 보조 단위" sub="목록의 달 거리(LD) 옆에 붙는 단위">
          <ToggleGroup type="single" size="sm" variant="outline" value={pref.distance_unit} onValueChange={(v) => v && change({ distance_unit: v as Preferences["distance_unit"] })} aria-label="거리 보조 단위">
            <ToggleGroupItem value="km">km</ToggleGroupItem>
            <ToggleGroupItem value="au">AU</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="대시보드 기본 정렬">
          <ToggleGroup type="single" size="sm" variant="outline" value={pref.dashboard_sort} onValueChange={(v) => v && change({ dashboard_sort: v as Preferences["dashboard_sort"] })} aria-label="대시보드 기본 정렬">
            <ToggleGroupItem value="distance">거리</ToggleGroupItem>
            <ToggleGroupItem value="velocity">속도</ToggleGroupItem>
            <ToggleGroupItem value="size">크기</ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row label="위험 분류만 보기" sub="대시보드 목록을 잠재적 위험 소행성(PHA)만으로 시작">
          <Switch checked={pref.hazard_only} onCheckedChange={(on) => change({ hazard_only: on })} aria-label="위험 분류만 보기 기본으로 켜기" />
        </Row>
      </div>
    </Panel>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-dim">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

// 저장 상태 ─ 화면 낭독기에도 읽히게 aria-live
function SaveBadge({ state }: { state: SaveState }) {
  return (
    <span aria-live="polite" className="text-xs text-dim">
      {state === "saving" && "저장 중…"}
      {state === "saved" && (
        <span className="inline-flex items-center gap-1 text-signal">
          <Check className="size-3.5" /> 저장됨
        </span>
      )}
      {state === "error" && <span className="text-bone">저장하지 못했어요. 다시 눌러 주세요.</span>}
    </span>
  );
}

export default PreferencesSection;
