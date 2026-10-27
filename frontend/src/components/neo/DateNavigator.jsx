// DateNavigator.jsx ─ 대시보드 상단 날짜 이동 컨트롤
// 좌우 화살표(±1일 이동) + 날짜 클릭 시 Browser 기본 달력

import { parseDateString, addDays, formatDate } from "../../utils/date";

// date: 현재 조회 중인 날짜 문자열 ("2026-09-16")
// onChanged: 새 날짜 문자열을 부모(NeoDashboardPage)에게 알려주는 함수
//
// 이 컴포넌트는 날짜 상태를 직접 갖지 않는다 
// ─ "지금 몇 일인지"는 부모가 URL에 들고 있고, 여기서는 "바뀌었다"는 사실만 위로 알려준다. 
// 비유: 리모컨이 TV 채널 값을 직접 갖는 것이 아니라, TV에 "다음 채널"만 요청하는 것과 같다.
function DateNavigator({ date, onChange }) {
  function moveByDays(delta) {
    const current = parseDateString(date);
    const next = addDays(current, delta);
    onChange(formatDate(next));
  }  

  // <input type="date">는 Browser가 기본으로 제공하는 달력 UI이다.
  // 값이 바뀌면(달력에서 날짜를 고르면) 그 값을 그대로 위로 전달한다.
  function handlePick(e) {
    if (e.target.value) {
      onChange(e.target.value);  
    }
  }

  return (
    <div className="date-navigator">
      <button
        type="button"
        className="date-navigator-arrow"
        onClick={() => moveByDays(-1)}
        aria-label="이전 날짜"
      >
        ◀
      </button>

      <input 
        type="date"
        className="date-navigator-input"
        value={date}
        onChange={handlePick}
      />

      <button
        type="button"
        className="date-navigator-arrow"
        onClick={() => moveByDays(1)}
        aria-label="다음 날짜"
      >
        ▶
      </button>    
    </div>
  );
}

export default DateNavigator;
