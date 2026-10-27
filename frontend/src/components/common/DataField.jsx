// 라벨 + 값 한 쌍을 보여주는 공통 부품
// 이 컴포넌트에 "숫자는 전부 Mono 서체를 사용한다"라는 약속을 정한다.
// 나중에 규칙이 바뀌더라도 이 컴포넌트만 수정하면 됨.
function DataField({ label, value, unit, layout = "stacked" }) {
  // NASA 원본 데이터의 null은 그대로 두지만(DB에서는 건드리지 않음)
  // "화면에서 어떻게 보여줄지"는 별개의 문제이기 때문에 여기서 처리한다.
  // 데이터 응답이 null이나 undefined 라면 대시(─)로 통일 → "값이 없다"는 뜻
  const displayValue = 
    value === null || value === undefined || value === "" ? "─" : value;
  
  return (
    <div className={`data-field data-field--${layout}`}>
      <span className="data-field-label">{label}</span>
      <span className="data-field-value">
        {displayValue}
        {/* unit은 값이 실제로 있을 때만 붙인다. "─ m" 처럼 어색하게 보이는 걸 막기 위함 */}
        {unit && displayValue !== "─" && (
          <span className="data-field-unit"> {unit}</span>  
        )}
      </span>  
    </div>
  );  
}

export default DataField;
