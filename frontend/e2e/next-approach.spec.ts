// next-approach.spec.ts ─ 대시보드 "다음 근접 접근까지" 카운트다운 (03 문서 6.1절, 05 문서 M6 ─ M7-2에서 당김)
//
// E2E 서버는 JPL에 닿지 않는다(playwright.config.ts JPL_API_BASE) → 실제 서버 응답은 503.
// 화면 모양은 /api/neo/next-approach/ 응답만 가짜로 끼워서 본다 (계산·캐시는 백엔드 테스트 NeoNextApproachTests가 검증)

import { expect, test, type Page } from "@playwright/test";
import { E2E_DATE } from "./fixtures";

const URL = "**/api/neo/next-approach/";
const CRITERIA = { max_distance_au: 0.05, max_distance_ld: 19.46, window_days: 60 };

function fakeNext(page: Page, nextApproach: object | null) {
  return page.route(URL, (route) =>
    route.fulfill({
      json: { next_approach: nextApproach, criteria: CRITERIA, source: "NASA/JPL SBDB Close Approach Data API", fetched_at: new Date().toISOString() },
    }),
  );
}

const inTwoDays = () => new Date(Date.now() + (2 * 86400 + 3 * 3600) * 1000).toISOString();

test("오늘 화면: 남은 시간이 1초마다 줄고, 1 LD 안쪽은 글자로도 표시, 이름은 상세로 간다", async ({ page }) => {
  const when = inTwoDays();
  await fakeNext(page, {
    designation: "2025 UK9", name: "(2025 UK9)", nasa_id: "54555159", approach_datetime_utc: when, approach_date: when.slice(0, 10),
    time_sigma_minutes: 60, miss_distance_au: 0.0021, miss_distance_km: 314645.7, miss_distance_ld: 0.82,
    miss_distance_min_ld: 0.22, miss_distance_max_ld: 1.47, is_within_lunar_distance: true, velocity_km_s: 7.83, absolute_magnitude_h: 29.83,
  });
  await page.goto("/");
  const box = page.getByRole("region", { name: "다음 근접 접근 카운트다운" });
  const timer = box.getByRole("timer");
  await expect(timer).toHaveText(/^02일0[23]시간\d\d분\d\d초$/); // 숫자·단위가 따로 span이라 textContent엔 띄어쓰기가 없다
  const first = await timer.textContent();
  await expect(timer).not.toHaveText(first ?? ""); // 손목시계가 돈다
  await expect(box.getByText("달보다 가까이", { exact: true })).toBeVisible();
  await expect(box.getByText("0.82 LD")).toBeVisible();
  await expect(box.getByText(/시각 오차 ±1시간/)).toBeVisible();
  await expect(box.getByRole("link", { name: "(2025 UK9)" })).toHaveAttribute("href", "/neo/54555159");
});

test("다른 날짜를 보는 중엔 카운트다운이 없다", async ({ page }) => {
  let asked = false;
  await page.route(URL, (route) => ((asked = true), route.abort()));
  await page.goto(`/?date=${E2E_DATE}`);
  await expect(page.locator('main a[href^="/neo/9000"]')).toHaveCount(3);
  await expect(page.getByRole("region", { name: "다음 근접 접근 카운트다운" })).toHaveCount(0);
  expect(asked).toBe(false); // 요청 자체를 하지 않는다
});

test("우리 DB에 없는 소행성이면 상세 대신 그날 목록으로 안내, 1 LD 밖이면 위험 표시 없음", async ({ page }) => {
  await fakeNext(page, {
    designation: "2018 GS1", name: "(2018 GS1)", nasa_id: null, approach_datetime_utc: inTwoDays(), approach_date: E2E_DATE,
    time_sigma_minutes: 0, miss_distance_au: 0.028, miss_distance_km: 4240878.1, miss_distance_ld: 11.03,
    miss_distance_min_ld: null, miss_distance_max_ld: null, is_within_lunar_distance: false, velocity_km_s: 9.3, absolute_magnitude_h: 22.6,
  });
  await page.goto("/");
  const box = page.getByRole("region", { name: "다음 근접 접근 카운트다운" });
  await expect(box.getByText(/시각 오차 1분 미만/)).toBeVisible();
  await expect(box.getByText("달보다 가까이", { exact: true })).toHaveCount(0);
  await box.getByRole("link", { name: "그날 목록 보기" }).click();
  await expect(page).toHaveURL(new RegExp(`date=${E2E_DATE}`));
  await expect(page.locator('main a[href^="/neo/9000"]')).toHaveCount(3);
});

test("예측이 없으면 빈 상태 문구", async ({ page }) => {
  await fakeNext(page, null);
  await page.goto("/");
  await expect(page.getByText("앞으로 60일 안에 이 거리 안쪽으로 지나갈 것으로 예측된 소행성이 없어요.")).toBeVisible();
  await expect(page.getByRole("timer")).toHaveCount(0);
});

test("JPL에 닿지 않으면 카운트다운만 오류, 대시보드는 그대로", async ({ page }) => {
  await page.goto("/"); // 가짜 없이 실제 E2E 서버 ─ JPL 주소가 닿지 않아 503
  await expect(page.getByText(/다음 근접 접근 예보를 불러오지 못했어요/)).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("오늘");
});
