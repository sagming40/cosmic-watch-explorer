// playwright.config.ts ─ 프론트 E2E 테스트 설정 (10-28 M6)
//
// npm run test:e2e 한 번이면: ① E2E 전용 DB를 같은 상태로 만들고(prepare_e2e) ② 백엔드 8001·프론트 5175를 새로 띄워서
// ③ 실제 브라우저(Edge)로 MVP 흐름을 눌러 보고 ④ 서버를 끈다.
// 개발용 서버(8000·5173)·개발 DB(cosmic_watch)는 건드리지 않는다 ─ 포트도 DB도 따로.
//
// NASA는 부르지 않는다: 화면이 볼 날짜의 데이터를 전부 prepare_e2e가 심어 두고, 키도 가짜(E2E_NO_NASA)로 준다.
// 카운트다운의 JPL(키 없는 공개 API)은 닿지 않는 주소(127.0.0.1:9)로 ─ 서버는 503, 화면 확인은 next-approach.spec.ts가 응답을 가짜로 끼워서.

import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const backendDir = fileURLToPath(new URL("../backend", import.meta.url));
const python = path.join(backendDir, process.platform === "win32" ? "venv/Scripts/python.exe" : "venv/bin/python");

const BACKEND_PORT = 8001;
const FRONTEND_PORT = 5175;

export default defineConfig({
  testDir: "./e2e",
  // DB가 하나라 순서대로 한 개씩 ─ 동시에 돌리면 서로의 저장·삭제가 섞인다
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    // Windows에 기본으로 있는 Edge를 쓴다 → Playwright 전용 브라우저(약 150MB)를 받지 않아도 된다.
    // CI(리눅스)에선 PW_CHANNEL=chromium 등으로 바꾼다 (05 문서 M6 CI 항목)
    channel: process.env.PW_CHANNEL ?? "msedge",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "retain-on-failure", // 실패한 테스트만 화면 기록을 남긴다 (npx playwright show-trace)
  },
  projects: [
    // 로그인은 한 번만 해 두고 다른 테스트가 재사용 ─ 로그인 횟수 제한(분당 10번)에 안 걸리게
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "e2e", dependencies: ["setup"], use: { storageState: "e2e/.auth/user.json" } },
  ],
  webServer: [
    {
      // prepare_e2e가 DB 이름이 _e2e로 끝나지 않으면 멈추므로, 실수로 개발 DB를 비울 일은 없다
      command: `"${python}" manage.py prepare_e2e && "${python}" manage.py runserver ${BACKEND_PORT} --noreload`,
      cwd: backendDir,
      url: `http://localhost:${BACKEND_PORT}/api/auth/csrf/`,
      // DEBUG를 직접 정한다 ─ Playwright 로그를 보려고 DEBUG=pw:webserver로 실행하면 그 값이 그대로 내려와
      // Django가 DEBUG=False(배포 모드)로 켜지고 ALLOWED_HOSTS 오류로 죽었다 (10-28, 같은 이름의 환경변수 충돌)
      env: { ...process.env, DEBUG: "True", DB_NAME: "cosmic_watch_e2e", NASA_API_KEY: "E2E_NO_NASA", JPL_API_BASE: "http://127.0.0.1:9", PYTHONUNBUFFERED: "1" },
      reuseExistingServer: false, // 매번 새로 ─ 횟수 제한 계량기(메모리 캐시)도 비워진 채로 시작
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { ...process.env, VITE_API_TARGET: `http://localhost:${BACKEND_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
