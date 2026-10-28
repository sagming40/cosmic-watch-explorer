// dashboard.spec.ts ─ 날짜별 소행성 목록·위험 표시·달력 (01 문서 9장 NEO, M5 달력)

import { expect, test } from "@playwright/test";
import { E2E_DATE } from "./fixtures";

test("정해진 날짜의 소행성 3개, 위험 표시는 1개", async ({ page }) => {
  await page.goto(`/?date=${E2E_DATE}`);
  const items = page.locator('main a[href^="/neo/9000"]');
  await expect(items).toHaveCount(3);
  // 위험은 색만이 아니라 글자로도 (03 문서 9장) ─ "잠재적 위험" 배지가 정확히 1개
  await expect(page.locator("main ul").getByText("잠재적 위험", { exact: true })).toHaveCount(1);
  await expect(items.first()).toContainText("(2031 E2E-A)"); // 기본 정렬 = 거리순, 가장 가까운 0.5 LD가 맨 위
});

test("달력에서 연·월을 고르고 날짜를 누르면 그 날짜로 이동한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /조회 날짜/ }).click();
  const calendar = page.locator("[data-slot=popover-content]");
  await calendar.getByRole("combobox", { name: "연도 선택" }).selectOption("2031");
  await calendar.getByRole("combobox", { name: "월 선택" }).selectOption("2"); // 0부터 ─ 2 = 3월
  await expect(page).not.toHaveURL(/date=2031-03-15/); // 연·월만 바꿔선 이동하지 않는다 (M5 ─ 기본 달력의 문제였던 것)
  await calendar.getByRole("button").filter({ hasText: /^15$/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`date=${E2E_DATE}`));
  await expect(page.locator('main a[href^="/neo/9000"]')).toHaveCount(3);
});
