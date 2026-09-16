import axios from "axios";

// ──────────────────────────────────────────────────────────
// COSMIC WATCT 전용 전화기
// 단축번호와 (baseURL)와 통화 규칙(cookie·CSRF)을 미리 저장해둔다.
// 앞으로 모든 API 호출은 이 instance만 사용한다.
// ──────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: "/api",                // vite proxy가 localhost:8000으로 넘겨준다.
  withCredentials: true,          // ① session cookie를 요청에 같이 실어 보낸다.
  xsrfCookieName: "csrftoken",    // ② 이 cookie을 읽어서
  xsrfHeaderName: "X-CSRFToken",  // ③ 이 Header에 담는다 (POST/DELETE 때 자동)  
});

// 앱 실행 시 최초 1회만 호출
// 은행 창구에서 "서명용 종이 한 장부터 받아두는" 단계.
// 이 과정을 건너뛰면 csrftoken 쿠키가 아예 없어서
// 첫 POST(로그인·Watchlist 저장)가 403 CSRF_FAILED로 튕긴다.
export async function ensureCsrf() {
  await api.get("/auth/csrf/");  
}

// 오류를 한가지 모양으로 빚어내는 틀
// Error 객체 위에 만든 정보를 얹는다. (code/fields/status)
// 굳이 Error를 사용하는 이유: console에 스택 추적이 남아서
// "어느 파일 몇 번째 줄에서 터졌는지"를 추적할 수 있다.
function toAppError({ code, message, fields = null, status = null }) {
  return Object.assign(new Error(message), { code, fields, status });  
}

// ─────────────────────────────────────────────────────────────
// response interceptor = 모든 소포가 반드시 검수대
// component가 받기 전에 포장을 뜯어 내용물만 넘긴다.
// ⭐ Backend config/exception_handler.py가 봉투를 씌우는 쪽이고,
// 이 곳이 그 봉투를 뜯는 쪽. ─ 둘이 한 쌍이다.
// ─────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,  // 성공하면 건드리지 않고 그대로 통과
  
  (error) => {
    // server가 보낸 { error: { code, message, fields } } 봉투를 꺼낸다.
    // server까지 도달하지 못했을 경우, error.response 자체가 없어 undefined가 된다.
    const envelope = error.response?.data?.error;

    if (envelope) {
      return Promise.reject(
        toAppError({
          code: envelope.code,
          message: envelope.message,
          fields: envelope.fields ?? null,
          status: error.response.status,  
        })
      );  
    }

    // 이 곳에 도달하는 경우는 둘 중 하나다.
    // ⓐ Django가 꺼져 있거나 network가 끊김 → 전화가 걸리지 않은 상황
    // ⓑ 응답은 왔지만 envelope 형식이 아님 (예: proxy 오류 등)
    // 어느 쪽이든 component는 code만 확인 후 분기하면 되도록 붙여준다.
    return Promise.reject(
      toAppError({
        code: error.response ? "UNKNOWN_ERROR" : "NETWORK_ERROR",
        message: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        status: error.response?.status ?? null,
      })  
    );
  }
);
