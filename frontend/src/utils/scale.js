// 로그 스케일 위치 계산을 한 곳에 모아둔다.

// 로그 스케일 막대가 다루는 고정 범위
// 03_user_scenarios_and_uiux.md 3장 Wireframe 기준 (0.1 LD ~ 100 LD)
export const LD_SCALE_MIN = 0.1;
export const LD_SCALE_MAX = 100;

// 거리(LD) → 막대 위 가로 위치(0 ~ 100%)
//
// 왜 로그인가: 0.5 LD와 100 LD는 200배 차이인데, 선형 축으로 그리게 되면,
// 가까운 소행성들이 전부 왼쪽 끝(1~2px)으로 뭉쳐버려서 구분이 되질 않는다.
// 로그를 사용하면 "몇 배가 차이나는가"가 "일정한 간격"으로 변환된다.
// ─ 지진 규모(리히터 스케일)나 소리 크기(데시벨)과 같은 원리다.
export function ldToPercent(ld) {
  // 범위 밖 값(0.1 미만, 100 초과)은 막대 양 끝에 붙여서 표시한다.
  // Math.max/min으로 값을 범위 안으로 "가둔다" (clamp)
  const clamped = Math.max(LD_SCALE_MIN, Math.min(LD_SCALE_MAX, ld));
  
  const logMin = Math.log10(LD_SCALE_MIN);   // -1
  const logMax = Math.log10(LD_SCALE_MAX);   // 2
  const logValue = Math.log10(clamped);  
  
  return ((logValue - logMin) / (logMax - logMin)) * 100;
}
