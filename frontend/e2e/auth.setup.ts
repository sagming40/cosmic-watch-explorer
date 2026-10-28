// auth.setup.ts ─ e2e_user로 한 번 로그인해서 쿠키를 파일로 저장. 다른 테스트는 이 파일로 "로그인된 채" 시작한다.
// (로그인을 테스트마다 하면 로그인 횟수 제한 ─ 분당 10번 ─ 에 걸릴 수 있다)

import { expect, test as setup } from "@playwright/test";
import { E2E_USER } from "./fixtures";

setup("e2e_user 로그인", async ({ page }) => {
  await page.goto("/login");
  await page.locator("input[name=username]").fill(E2E_USER.username);
  await page.locator("input[name=password]").fill(E2E_USER.password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByRole("button", { name: /내 계정 메뉴/ })).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
