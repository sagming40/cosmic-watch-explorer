import { NavLink } from "react-router";

// 메뉴 목록이 array인 이유
// 추후 메뉴 하나를 추가/삭제할 때 JSX를 여러 군데 수정하지 않고
// array 한 줄만 추가/삭제 되도록 구현 ─ 편의성
const NAV_ITEMS = [
  { to: "/", label: "소행성", end: true },
  // end: true → "/"는 다른 모든 경로의 접두사이기도 하다. (예: "/neo/1"도 "/"로 시작)
  // 경로가 정확히 "/"일 경우에만 활성화 표시가 되어야 한다.
  // end: true로 켜져 있지 않으면 어느 페이지에 있던 "소행성" 메뉴가 항상 켜진 것 처럼 보이는 버그가 생긴다.
  { to: "/exoplanets", label: "외계행성" },  
  { to: "/compare", label: "크기비교" },  
];

function Header() {
  return (
    <header className="header">
      <div className="header-inner content-container">
        {/* Logo 역시 Home으로 돌아가는 Link이다. 사이트 어디에서나 Logo를 Click하면 Home으로
            돌아가는 건 거의 모든 website의 암묵적 약속이라 별도 안내 없이도 통한다. */}
        <NavLink to="/" className="header-logo">
          COSMIC WATCH
        </NavLink>

        <nav className="header-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to}
              // NavLink는 className에 함수를 넘기면 그 함수에 { isActive } 객체를 인자로 던져준다.
              // "지금 이 링크가 현재 주소와 일치하는가?"에 대한 답은 자동으로 제공으로 계산해준다.
              className={({ isActive }) =>
                isActive ? "header-nav-link is-active" : "header-nav-link"  
              }
            >
              {item.label}  
            </NavLink>  
          ))}  
        </nav>    

        {/* Login 상태 분기는 AuthProvider를 구현한 뒤 교체한다. 현재는 항상 "로그인" 링크로만 고정 표시 */}
        <NavLink to="/login" className="header-login-link">
          로그인
        </NavLink>
      </div>  
    </header>
  );  
}

export default Header;
