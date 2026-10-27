import { Outlet } from "react-router";
import Header from "./Header";

function Layout() {
  return (
    <div>
      <Header />

      {/* Outlet = 액자 속의 사진. 액자(Header·바깥 틀)는 계속 그 자리에 걸려 있고,
                   주소가 바뀔 때마다 액자 속의 사진만 교체한다. */}
      {/* content-container = index.css에 define한 1280px 중앙 정렬 클래스 */}             
      <main className="content-container">
        <Outlet />             
      </main>  
    </div>
  );  
}

export default Layout;
