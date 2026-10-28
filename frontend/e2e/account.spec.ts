// account.spec.ts ─ 마이페이지 표시 설정이 대시보드 처음 보기값이 되는지 (M5 마이페이지)
// e2e_user의 설정을 바꾸면 다른 테스트(대시보드 기본 정렬)가 흔들리므로, 이 파일은 새로 가입한 계정으로 한다.

import { expect, test } from "@playwright/test";
import { E2E_DATE, openProfileMenu, signUp, uniqueUsername } from "./fixtures";

test.use({ storageState: { cookies: [], origins: [] } });

test("마이페이지에서 기본 정렬을 크기로 바꾸면 대시보드가 크기순으로 열린다", async ({ page }) => {
  await page.goto("/signup");
  await signUp(page, uniqueUsername("e2e_pref"));

  await openProfileMenu(page);
  await page.getByRole("menuitem", { name: "내 계정" }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByRole("radiogroup", { name: "대시보드 기본 정렬" }).getByRole("radio", { name: "크기" }).click();
  await expect(page.getByText("저장됨")).toBeVisible();

  await page.goto(`/?date=${E2E_DATE}`);
  await expect(page.getByRole("radio", { name: "크기", exact: true })).toHaveAttribute("aria-checked", "true");
  // 크기순(최대 지름 큰 것부터): E2E-A 670m → E2E-C 260m → E2E-B 90m
  await expect(page.locator('main a[href^="/neo/9000"]').first()).toContainText("(2031 E2E-A)");
  await expect(page.locator('main a[href^="/neo/9000"]').nth(1)).toContainText("(2031 E2E-C)");
});
