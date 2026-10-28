// exoplanets.spec.ts ─ 다중 조건 검색 → 상세 → 크기 비교 (M4 완료 기준: 검색 결과·칩 2개, 01 문서 9장 공통 "크기 비교")

import { expect, test } from "@playwright/test";

test("반지름 0.8~1.5 · 100광년 이하 검색 → 2건, 칩 2개 → 상세 → 크기 비교에 지구 고정", async ({ page }) => {
  await page.goto("/exoplanets");
  await page.getByLabel("반지름 최소").fill("0.8");
  await page.getByLabel("반지름 최대").fill("1.5");
  await page.getByLabel("거리 최대").fill("100");
  await page.getByRole("button", { name: "검색", exact: true }).click();

  await expect(page).toHaveURL(/radius_min=0\.8/);
  await expect(page.getByText("2건")).toBeVisible();
  // prepare_e2e: 반지름 큰 행성·261광년 행성·반지름 미측정 행성은 빠져야 한다
  await expect(page.getByRole("link", { name: /E2E-Terra b/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /E2E-Giant|E2E-Far|E2E-Unknown/ })).toHaveCount(0);
  await expect(page.locator('main button[aria-label$="해제"]')).toHaveCount(2); // 칩 = 반지름 한 개 + 거리 한 개

  await page.getByRole("link", { name: /E2E-Terra b/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E-Terra b");
  await page.getByRole("link", { name: "지구와 크기 비교" }).click();

  await expect(page).toHaveURL(/\/compare\?exo=/);
  await expect(page.getByTitle("지구는 기준이라 뺄 수 없어요")).toBeVisible(); // 지구 칩 = 자물쇠
  await expect(page.getByRole("button", { name: "지구 빼기" })).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(2); // 지구 + E2E-Terra b
});
