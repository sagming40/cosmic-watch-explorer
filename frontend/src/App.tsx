import { BrowserRouter, Outlet, Routes, Route } from "react-router";

import Layout from "./components/layout/Layout";
import NeoDashboardPage from "./pages/NeoDashboardPage";
import NeoDetailPage from "./pages/NeoDetailPage";
import ExoplanetListPage from "./pages/ExoplanetListPage";
import ExoplanetDetailPage from "./pages/ExoplanetDetailPage";
import ComparePage from "./pages/ComparePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import WatchlistPage from "./pages/WatchlistPage";
import AccountPage from "./pages/AccountPage";
import NotFoundPage from "./pages/NotFoundPage";

import AuthProvider from "./auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";


function App() {
  return (
    // BrowserRouter = 주소창 감시자.
    // 주소가 바뀌는 걸 지켜보다가 아래 Routes에 "현 주소"를 알려준다.
    <BrowserRouter>
      {/* AuthProvider = 로그인 상태 방송국. 앱이 뜰 때 CSRF 쿠키 받기 + /me/ 확인을 여기서 한다
          (예전엔 App의 useEffect에서 ensureCsrf()만 불렀다) */}
      <AuthProvider>
      <Routes>
        {/* path가 없는 Route = 껍데기 담당.
            아래 자식들은 전부 Layout의 <Outlet /> 자리에 들어간다. */}
        <Route element={<Layout />}>
          {/* 로그인 없이 열리는 화면은 이 둘뿐 (10-27 ─ 화면·API 전부 잠금. 처음 설계는 비회원도 조회 가능했다) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 나머지 전부 ─ 문지기(ProtectedRoute)가 비로그인이면 /login?next=지금 주소 로 보낸다.
              path 없는 Route 하나로 감싸서, 화면을 새로 추가해도 저절로 잠긴다 (백엔드 "기본 잠금"과 같은 생각) */}
          <Route
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<NeoDashboardPage />} />
            <Route path="/neo/:id" element={<NeoDetailPage />} />
            <Route path="/exoplanets" element={<ExoplanetListPage />} />
            <Route path="/exoplanets/:id" element={<ExoplanetDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/account" element={<AccountPage />} />

            {/* "*" = 위 어느 것에도 걸리지 않은 나머지 전부.
                404도 Layout 안에 두는 이유: Header가 있어야 다른 곳으로 갈 수 있기 때문
                문서 7.1절 ─ "빈 화면은 막다른 길이 아니다" */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
