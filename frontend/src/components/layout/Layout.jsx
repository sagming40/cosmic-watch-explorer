import { Outlet } from "react-router";

function Layout() {
  return (
    <div>
      {/* Header 자리. 실제 Header 컴포넌트로 교체 예정 */}
      <header>
        <strong>COSMIC WATCH</strong>
      </header>

      <main>
        {/* Outlet = 액자 속의 사진. 액자(Header·바깥 틀)는 계속 그 자리에 걸려 있고,
                     주소가 바뀔 때마다 액자 속의 사진만 교체한다. */}
        <Outlet />             
      </main>  
    </div>
  );  
}

export default Layout;
