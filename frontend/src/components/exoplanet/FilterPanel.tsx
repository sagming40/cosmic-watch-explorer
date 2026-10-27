// FilterPanel.tsx ─ 외계행성 검색 조건 9종 입력 (01 문서 4.3절, 03 문서 6.3절)
//
// 입력칸 값(draft)은 이 컴포넌트 안에만 있고, "검색"을 눌러야 주소에 반영된다.
// 주소가 바뀌면(칩 해제·뒤로 가기) 부모가 key를 바꿔 이 컴포넌트를 새로 만든다 → 입력칸도 주소 값으로 다시 맞춰진다.

import { useState, type FormEvent } from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";

import { Panel } from "@/components/common/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExoplanetMetaResponse, FieldErrors } from "@/types/api";
import { RANGE_FIELDS, TEXT_FIELDS, type Draft, type FilterKey } from "@/utils/exoplanetQuery";
import { int } from "@/utils/format";

interface FilterPanelProps {
  initialDraft: Draft;
  meta: ExoplanetMetaResponse | null; // 아직 못 받았거나 실패하면 null ─ 힌트·발견 방법 목록만 빠지고 검색은 된다
  fieldErrors: FieldErrors | null; // 400 응답의 fields ─ 틀린 칸에 테두리 (폼 오류 규칙: 빨강 대신 흰 테두리)
  onSubmit: (draft: Draft) => void;
  onReset: () => void;
}

function FilterPanel({ initialDraft, meta, fieldErrors, onSubmit, onReset }: FilterPanelProps) {
  const [draft, setDraft] = useState(initialDraft);
  // 1024px 미만에서는 접었다 폈다 (03 문서 8장 ─ 태블릿: 필터 패널이 상단 접이식)
  const [open, setOpen] = useState(false);

  const set = (k: FilterKey) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault(); // Enter로도 검색된다
    onSubmit(draft);
    setOpen(false);
  }

  return (
    <Panel className="h-fit lg:sticky lg:top-20">
      <div className="flex items-center justify-between lg:mb-4">
        <button
          type="button"
          className="flex items-center gap-2 font-semibold lg:pointer-events-none"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          검색 조건
          <ChevronDown className={cn("size-4 text-dim transition-transform lg:hidden", open && "rotate-180")} />
        </button>
        <button type="button" onClick={onReset} className="flex items-center gap-1 text-xs text-dim hover:text-bone">
          <RotateCcw className="size-3.5" /> 초기화
        </button>
      </div>

      <form onSubmit={submit} className={cn("mt-4 space-y-5 lg:mt-0 lg:block", !open && "hidden")}>
        {TEXT_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} error={fieldErrors?.[f.key]}>
            <Input value={draft[f.key]} onChange={(e) => set(f.key)(e.target.value)} placeholder={f.placeholder} aria-invalid={fieldErrors?.[f.key] ? true : undefined} />
          </Field>
        ))}

        {RANGE_FIELDS.map((f) => {
          const range = f.meta && meta ? meta.ranges[f.meta] : null;
          const err = fieldErrors?.[f.min] ?? fieldErrors?.[f.max];
          return (
            <Field key={f.min} label={f.unit ? `${f.label} (${f.unit})` : f.label} error={err}>
              <div className="flex items-center gap-2">
                <Input
                  value={draft[f.min]}
                  onChange={(e) => set(f.min)(e.target.value)}
                  placeholder="최소"
                  inputMode="decimal"
                  className="font-mono"
                  aria-label={`${f.label} 최소`}
                  aria-invalid={fieldErrors?.[f.min] ? true : undefined}
                />
                <span className="text-dim">~</span>
                <Input
                  value={draft[f.max]}
                  onChange={(e) => set(f.max)(e.target.value)}
                  placeholder="최대"
                  inputMode="decimal"
                  className="font-mono"
                  aria-label={`${f.label} 최대`}
                  aria-invalid={fieldErrors?.[f.max] ? true : undefined}
                />
              </div>
              {/* 실제 데이터 범위를 보여줘서 "없는 범위"를 덜 입력하게 (04 문서 6.3절) */}
              {range && range.min !== null && range.max !== null && (
                <div className="mt-1 font-mono text-[11px] text-dim">
                  데이터 범위 {range.min} ~ {int(range.max)}
                </div>
              )}
            </Field>
          );
        })}

        {meta && (
          <Field label="발견 방법">
            <div className="flex flex-wrap gap-1.5">
              {meta.discovery_methods.map((m) => {
                const on = draft.method === m.value;
                return (
                  <button
                    type="button"
                    key={m.value}
                    aria-pressed={on}
                    onClick={() => set("method")(on ? "" : m.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      on ? "border-signal bg-signal text-ink" : "border-line text-dim hover:text-bone",
                    )}
                  >
                    {m.value} <span className="font-mono opacity-70">{int(m.count)}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Button type="submit" className="w-full">
          <Search /> 검색
        </Button>
      </form>
    </Panel>
  );
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-dim">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-bone">ⓘ {error.join(" ")}</div>}
    </div>
  );
}

export default FilterPanel;
