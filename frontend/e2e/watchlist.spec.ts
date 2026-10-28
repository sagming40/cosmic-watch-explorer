// watchlist.spec.ts ─ 상세에서 저장 → 관심 천체에서 확인 → 삭제 → 실행 취소 (01 문서 9장 사용자, 03 문서 시나리오 4)

import { expect, test } from "@playwright/test";

test("소행성 저장 → 관심 천체 목록 → 삭제 → 실행 취소 → 다시 삭제", async ({ page }) => {
  await page.goto("/neo/9000003");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("(2031 E2E-C)");
  await page.getByRole("button", { name: "관심 천체에 저장" }).click();
  await expect(page.getByRole("button", { name: "저장됨" })).toBeVisible();

  await page.goto("/watchlist");
  await expect(page.getByRole("tab", { name: /소행성 1/ })).toBeVisible();
  const remove = page.getByRole("button", { name: "(2031 E2E-C) 삭제" });
  await remove.click();
  await expect(page.getByRole("tab", { name: /소행성 0/ })).toBeVisible();

  await page.getByRole("button", { name: /실행 취소/ }).click(); // 5초 안에
  await expect(page.getByRole("tab", { name: /소행성 1/ })).toBeVisible();

  // 뒷정리 ─ 다른 테스트가 볼 상태를 처음대로 (같은 DB를 순서대로 쓴다)
  await remove.click();
  await expect(page.getByRole("tab", { name: /소행성 0/ })).toBeVisible();
  const list = await page.request.get("/api/watchlist/neo/");
  expect((await list.json()).count).toBe(0);
});
