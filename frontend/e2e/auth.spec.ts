// auth.spec.ts ─ 잠금·가입·복귀·로그아웃 (M4 완료 기준 "저장 → 로그인 → 원래 페이지 복귀", 10-27 화면 잠금)

import { expect, test } from "@playwright/test";
import { openProfileMenu, signUp, uniqueUsername } from "./fixtures";

// 이 파일은 로그인 안 된 채로 시작한다 (setup이 저장한 쿠키를 쓰지 않음)
test.use({ storageState: { cookies: [], origins: [] } });

test("로그인 안 하고 열면 로그인 화면으로, 가입하면 원래 주소로 돌아온다", async ({ page }) => {
  const target = "/exoplanets?radius_min=0.8&radius_max=1.5&distance_max_ly=100";
  await page.goto(target);
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByText("보던 외계행성 검색 결과로 돌아가요")).toBeVisible();

  await page.getByRole("link", { name: "회원가입" }).first().click();
  await signUp(page, uniqueUsername("e2e_signup"));

  await expect(page).toHaveURL(target);
  await expect(page.getByText("2건")).toBeVisible(); // prepare_e2e: 조건에 걸리는 행성 2개
});

test("프로필 메뉴로 로그아웃하면 서버 세션도 끝난다", async ({ page }) => {
  await page.goto("/signup");
  await signUp(page, uniqueUsername("e2e_logout"));
  await expect(page.getByRole("button", { name: /내 계정 메뉴/ })).toBeVisible();

  await openProfileMenu(page);
  await page.getByRole("menuitem", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login/);
  const me = await page.request.get("/api/auth/me/");
  expect((await me.json()).is_authenticated).toBe(false);
});

test("next에 바깥 주소를 넣어도 따라가지 않는다 (오픈 리다이렉트 방지)", async ({ page }) => {
  await page.goto("/login?next=%2F%2Fevil.com");
  await expect(page.getByText(/돌아가요/)).toHaveCount(0);
  // 헤더의 회원가입 버튼·폼 아래 링크 둘 다 next 없이 /signup (10-28: 헤더가 //evil.com을 그대로 붙이던 것을 이 테스트가 잡았다)
  const links = page.getByRole("link", { name: "회원가입" });
  await expect(links).toHaveCount(2);
  for (const link of await links.all()) await expect(link).toHaveAttribute("href", "/signup");
});
