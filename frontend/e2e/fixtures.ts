// fixtures.ts ─ E2E가 기대하는 고정값. backend/apps/astronomy/management/commands/prepare_e2e.py와 같아야 한다.
// (E2E 전용 DB에만 있는 테스트 계정 ─ 개발 DB·실제 서비스 계정과 무관)

import { expect, type Page } from "@playwright/test";

export const E2E_USER = { username: "e2e_user", password: "Orbit-e2e-2031" };
export const E2E_DATE = "2031-03-15"; // 소행성 3개: (2031 E2E-A) 위험·0.5 LD / (2031 E2E-B) 12 LD / (2031 E2E-C) 80 LD

/** 실행마다 겹치지 않는 아이디 ─ 가입 테스트용 (영문·숫자·_ 3~30자 규칙) */
export function uniqueUsername(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`.slice(0, 30);
}

/** 화면에서 가입 ─ 가입 = 로그인 (04 문서 4.3절) */
export async function signUp(page: Page, username: string, password = "Nebula-e2e-7788") {
  await page.locator("input[name=username]").fill(username);
  await page.locator("input[name=email]").fill(`${username}@example.com`);
  await page.locator("input[name=password]").fill(password);
  await page.locator("input[name=password_confirm]").fill(password);
  await page.getByRole("button", { name: "가입하고 시작하기" }).click();
}

export async function openProfileMenu(page: Page) {
  await page.getByRole("button", { name: /내 계정 메뉴/ }).click();
  await expect(page.getByRole("menu")).toBeVisible();
}
