// 날짜 문자열(YYYY-MM-DD) ↔ Date 객체를 오가는 곳을 한 파일에 모아둔다.
// "날짜 계산"이 필요할 때는 무조건 date.js를 거친다.
// ─ 정해진 곳 없이 여기저기서 각각 date를 다루게 되면, 매번 새로운 UTC 함정을 밟게 된다.

// Date 객체 → "YYYY-MM-DD" 문자열 (로컬 시간 기준)
export function formatDate(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;  
} 

// "YYYY-MM-DD" 문자열 → Date 객체 (로컬 시간 기준)
//
// ⚠️ new Date(dateString)을 직접 사용하면 안 된다.
// Browser가 "YYYY-MM-DD" 형식을 임의로 UTC 자정으로 해석해 버린다.
// 한국 시간대에서는 계산 결과가 하루 차이가 날 수 있다.
// 따라서, 연/월/일 숫자로 쪼갠 뒤, "로컬 기준으로 조립"한다는 뜻의
// 생성자(new Date(연, 월, 일))를 쓴다.
export function parseDateString(dateString) {
  const [yyyy, mm, dd] = dateString.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);  
}

// Date 객체에 며칠을 더하거나 뺀 새 Date 객체를 돌려준다.
export function addDays(dateObj, delta) {
  // new Date(dateObj)로 복사본을 만드는 이유:
  // setDate()는 "새 Date를 만드는" 것이 아니라 원본을 직접 고쳐버린다. (mutate)
  // 복사 없이 바로 setDate()를 적용하면, 호출한 쪽이 갖고 있던 원본 Date까지
  // 같이 변경되어 예상치 못 한 곳에서 값이 슬쩍 달라지는 버그가 된다.
  const result = new Date(dateObj);
  result.setDate(result.getDate() + delta);
  return result;  
}
