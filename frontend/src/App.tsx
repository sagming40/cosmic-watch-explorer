import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/layout/Layout";
import NeoDashboardPage from "./pages/NeoDashboardPage";
import NeoDetailPage from "./pages/NeoDetailPage";
import ExoplanetListPage from "./pages/ExoplanetListPage";
import ExoplanetDetailPage from "./pages/ExoplanetDetailPage";
import ComparePage from "./pages/ComparePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import WatchlistPage from "./pages/WatchlistPage";
import NotFoundPage from "./pages/NotFoundPage";

import { ensureCsrf } from "./api/client";

function App() {
  // 앱 실행 시 최초 1회, server에서 CSRF cookie를 미리 받아둔다.
  // 비유: 식당에 들어가자마자 번호표를 뽑아두는 것.
  // → 주문(POST)할 때가 되어서야 번호표를 뽑으러 가게 되면 늦기 때문.
  useEffect(() => {
    ensureCsrf();
  }, []);

  return (
    // BrowserRouter = 주소창 감시자.
    // 주소가 바뀌는 걸 지켜보다가 아래 Routes에 "현 주소"를 알려준다.
    <BrowserRouter>
      <Routes>
        {/* path가 없는 Route = 껍데기 담당. 
            아래 자식들은 전부 Layout의 <Outlet /> 자리에 들어간다. */}
        <Route element={<Layout />}>
          <Route path="/" element={<NeoDashboardPage />} />
          <Route path="/neo/:id" element={<NeoDetailPage />} />
          <Route path="/exoplanets" element={<ExoplanetListPage />} />
          <Route path="/exoplanets/:id" element={<ExoplanetDetailPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 인증 필요 화면. 지금은 그냥 열려 있다 
              ─ 로그인 상태를 아는 장치(AuthProvider) 구현 후 문지기(ProtectedRoute)를 이 자리에 씌운다. */}
          <Route path="/watchlist" element={<WatchlistPage />} />

          {/* "*" = 위 어느 것에도 걸리지 않은 나머지 전부. 
              404도 Layout 안에 두는 이유: Header가 있어야 다른 곳으로 갈 수 있기 때문
              문서 7.1절 ─ "빈 화면은 막다른 길이 아니다" */}  
          <Route path="*" element={<NotFoundPage />} />      
        </Route>    
      </Routes>
    </BrowserRouter>
  );
}

export default App;
