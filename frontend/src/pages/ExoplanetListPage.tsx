// ═══════════════════════════════════════════════════════════════════
// ExoplanetListPage.tsx ─ Path = '/exoplanets' (03 문서 6.3절, 04 문서 6.1·6.3절)
// 이 프로젝트 백엔드의 핵심 기능(다중 조건 검색)을 쓰는 화면.
// - 검색 조건·정렬·페이지는 전부 주소(?radius_min=0.8&...)에 있다 → 새 탭에서 열어도 같은 결과 (M4 완료 기준)
// - 주소의 쿼리스트링을 그대로 API에 넘긴다 (파라미터 이름이 백엔드와 같다)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { api, type AppError } from "@/api/client";
import Pagination from "@/components/common/Pagination";
import { Panel } from "@/components/common/Panel";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import ExoplanetListItem from "@/components/exoplanet/ExoplanetListItem";
import FilterChips from "@/components/exoplanet/FilterChips";
import FilterPanel from "@/components/exoplanet/FilterPanel";
import { Button } from "@/components/ui/button";
import type { ExoplanetListResponse, ExoplanetMetaResponse } from "@/types/api";
import { SORT_OPTIONS, chipsFrom, draftFromParams, fieldLabel, paramsFromDraft, type Draft } from "@/utils/exoplanetQuery";
import { int } from "@/utils/format";

type Loaded = { key: string; data: ExoplanetListResponse; error: null } | { key: string; data: null; error: AppError };

function ExoplanetListPage() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const sort = params.get("sort");

  const [retry, setRetry] = useState(0);
  const key = `${query}#${retry}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const [meta, setMeta] = useState<ExoplanetMetaResponse | null>(null);
  const resultsTop = useRef<HTMLDivElement>(null);

  // 필터 선택지(발견 방법·데이터 범위) ─ 화면에 들어올 때 한 번 (서버가 1시간 캐싱, 04 문서 6.3절)
  // 실패해도 검색은 된다 → 오류 화면을 띄우지 않고 힌트만 빠진다
  useEffect(() => {
    let ignore = false;
    api
      .get<ExoplanetMetaResponse>("/exoplanets/meta/")
      .then((res) => {
        if (!ignore) setMeta(res.data);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  // 목록 ─ 주소가 바뀔 때마다. 로딩 여부는 "받아 둔 결과의 key ≠ 지금 key"로 계산 (대시보드와 같은 방식)
  useEffect(() => {
    let ignore = false;
    api
      .get<ExoplanetListResponse>("/exoplanets/", { params: new URLSearchParams(query) })
      .then((res) => {
        if (!ignore) setLoaded({ key, data: res.data, error: null });
      })
      .catch((err: AppError) => {
        if (!ignore) setLoaded({ key, data: null, error: err });
      });
    const slow = setTimeout(() => setSlowKey(key), 3000);
    return () => {
      ignore = true;
      clearTimeout(slow);
    };
  }, [query, key]);

  const isLoading = loaded?.key !== key;
  const data = !isLoading ? loaded?.data ?? null : null;
  const error = !isLoading ? loaded?.error ?? null : null;
  const fieldErrors = error?.code === "VALIDATION_ERROR" ? error.fields : null;

  // ─── 주소 바꾸기 ─ 조건이 바뀌면 page는 지운다(1페이지로) ───
  function search(draft: Draft) {
    setParams(paramsFromDraft(draft, sort));
  }
  function removeFilter(keys: string[]) {
    const next = new URLSearchParams(params);
    keys.forEach((k) => next.delete(k));
    next.delete("page");
    setParams(next);
  }
  function clearFilters() {
    setParams(sort ? { sort } : {});
  }
  function changeSort(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set("sort", value);
    else next.delete("sort");
    next.delete("page");
    setParams(next);
  }
  function changePage(p: number) {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    setParams(next);
    resultsTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  return (
    <>
      <section className="pt-10 pb-8">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">외계행성 카탈로그</h1>
        <p className="mt-3 text-dim">
          NASA Exoplanet Archive에 등록된 {meta ? <span className="font-mono text-bone">{int(meta.total_count)}</span> : ""}개 행성을 조건으로 찾아보세요.
        </p>
      </section>

      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* key = 주소 ─ 칩 해제·뒤로 가기로 주소가 바뀌면 입력칸도 그 값으로 새로 맞춘다 */}
        <FilterPanel key={query} initialDraft={draftFromParams(params)} meta={meta} fieldErrors={fieldErrors} onSubmit={search} onReset={clearFilters} />

        <div ref={resultsTop} className="min-w-0 scroll-mt-20">
          {isLoading && <LoadingState slow={slowKey === key} blocks={["h-16", "h-[480px]"]} />}

          {error && (
            <ErrorState
              error={error}
              onRetry={() => setRetry((n) => n + 1)}
              action={
                // 입력값 오류는 다시 시도해도 똑같다 → 어느 칸인지 알려주고 조건을 지우는 버튼
                error.code === "VALIDATION_ERROR" ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-dim">확인할 칸: {Object.keys(error.fields ?? {}).map(fieldLabel).join(", ")}</p>
                    <Button onClick={clearFilters}>조건 모두 지우기</Button>
                  </div>
                ) : undefined
              }
            />
          )}

          {data && (
            <>
              <Panel className="p-0 md:p-0">
                <FilterChips applied={data.applied_filters} onRemove={removeFilter} onClear={clearFilters} />
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="text-dim">
                    총 <span className="font-mono text-bone">{int(data.count)}</span>건
                    {data.total_pages > 1 && (
                      <span className="ml-2 font-mono text-xs">
                        ({data.page} / {data.total_pages} 페이지)
                      </span>
                    )}
                  </span>
                  <label className="flex items-center gap-2 text-dim">
                    정렬
                    <select value={sort ?? ""} onChange={(e) => changeSort(e.target.value)} className="rounded-md border border-line bg-panel px-2 py-1 text-bone">
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {data.results.length > 0 ? (
                  <ul className="border-t border-line">
                    {data.results.map((p) => (
                      <ExoplanetListItem key={p.id} planet={p} />
                    ))}
                  </ul>
                ) : (
                  <EmptyResult applied={data.applied_filters} onRemove={removeFilter} onClear={clearFilters} />
                )}
              </Panel>
              <div className="mt-4">
                <Pagination page={data.page} totalPages={data.total_pages} onChange={changePage} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// 검색 0건 ─ 막다른 길이 아니라 "어떤 조건을 빼면 되는지" 안내 (03 문서 7.1절)
function EmptyResult({ applied, onRemove, onClear }: { applied: Record<string, string | number>; onRemove: (keys: string[]) => void; onClear: () => void }) {
  const chips = chipsFrom(applied);
  return (
    <div className="flex flex-col items-center border-t border-line px-5 py-14 text-center">
      <p className="font-medium">조건에 맞는 외계행성이 없습니다.</p>
      <p className="mt-1 text-sm text-dim">조건을 하나씩 빼 보세요. 범위 조건은 값이 측정되지 않은 행성을 제외합니다.</p>
      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <Button key={c.keys.join(",")} variant="outline" size="sm" onClick={() => onRemove(c.keys)}>
              {c.label} 빼기
            </Button>
          ))}
          <Button size="sm" onClick={onClear}>
            모두 지우기
          </Button>
        </div>
      )}
    </div>
  );
}

export default ExoplanetListPage;
