import { Outlet } from "react-router";
import Header from "./Header";

function Layout() {
  return (
    // app-backdrop = 위쪽에 신호색이 아주 옅게 번지는 빛 + 점 격자 배경 (index.css)
    <div className="app-backdrop min-h-screen text-bone">
      <Header />

      {/* Outlet = 액자 속의 사진. 액자(Header·바깥 틀)는 계속 그 자리에 걸려 있고,
                   주소가 바뀔 때마다 액자 속의 사진만 교체한다. */}
      <main className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
