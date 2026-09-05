"""
단위 환산 전담 모듈

프로젝트 원칙 ─ "도메인 계산은 전부 서버에서 한다."
(02_database_design.md 1.2절 / 04_api_specification.md 5.1절 설계 결정 ②)

FE는 계산해주는 값은 '표시만' 한다.
따라서, 384400 같은 기준값은 이 파일 밖 어디에도 등장하면 안 된다.
"""

from decimal import Decimal, ROUND_HALF_UP


# 지구~달 평균 거리(km), LD(Lunar Distance)의 기준값
# 문자열로 감싸서 Decimal에 넣는 이유는 아래 함수 주석 참조
LUNAR_DISTANCE_KM = Decimal("384400")
# 1 파섹 = 몇 광년인가. IAU의 정의 기준값.
# 이 숫자가 units.py 밖에 등장하면 안 되는 이유는 파일 맨 위 설명과 같다.
# ─ 384400과 정확히 같은 신분의 상수이다.
LIGHT_YEARS_PER_PARSEC = Decimal("3.26156")


def km_to_lunar_distance(km):
    """
    km → LD(달 거리) 환산 ─ 소수점 둘째 자리까지

    비유: 자로 잰 길이를 '몇 미터'가 아니라 '내 키의 몇 배'로 바꿔 말하는 것.
    30만 km는 감이 안 오지만 "달까지 거리의 0.8배"라고 하면 바로 와닿는다.
    LD를 사용하는 이유이다.

    km가 None이면 None을 그대로 반환한다.
    ─ NASA 원본의 NULL을 임의의 값(0 등)으로 바꾸지 않는다는 원칙 (문서 02 ─ 1.1절)
    """
    if km is None:
        return None

    # str()로 한 번 감싸는 이유:
    # float을 Decimal에 바로 넣으면 컴퓨터가 이진수로 저장하며 생긴 오차가
    # 그대로 딸려 들어온다. Decimal(0.1) → 0.1000000000000000055511151231...
    # str을 거치면 "사람이 적어둔 숫자 그대로" 들어간다.
    # nasa_neo.py의 _to_decimal이 쓰는 것과 정확히 같은 방어법이다.
    km_value = Decimal(str(km))

    lunar_distance = km_value / LUNAR_DISTANCE_KM

    # quantize: 소수 둘째 자리까지만 남기고 반올림한다.
    # ROUND_HALF_UP을 명시하는 이유 ─ Python Decimal의 기본 반올림은
    # '은행(bank)에서 사용하는 반올림'이다. (예: 0.5는 짝수 쪽으로 ─ 0.125 → 0.12)
    # 사람이 기대하는 교과서식 반올림(0.13)과 다르므로 명시적으로 지정한다.
    return lunar_distance.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) 


def light_year_to_parsec(ly):
    """
    광년 → 파섹. 사용자가 입력한 검색 조건을 DB가 사용하는 단위로 변환한다.
    
    비유: 손님이 물건을 파운드 단위로 요구했는데, 가게에는 그램(g)용 저울만 있는 상태.
    즉, 파운드 → 그램으로 변환하여 재는 것. 손님은 모르는 저울에만 있는 단위이다.
    
    ⚠️ 반올림하지 않는다.
    이 값은 화면이 아니라 WHERE 절로 들어간다. 소수점을 자르면 경계에 걸친 행성이
    결과에서 조용히 빠지거나 끼어든다. ─ error가 나지 않고 조용히 버그를 일으키는 종류의 증상이다.
    """
    if ly is None:
        return None
    
    
    # str()로 감싸는 이유 ─ km_to_lunar_distance()와 동일하다.
    # querystring으로 들어오는 값은 문자열이라 이미 안전하지만,
    # call하는 쪽이 float를 넘길 수도 있으니 방어는 그대로 유지한다.
    return Decimal(str(ly)) / LIGHT_YEARS_PER_PARSEC


def parsec_to_light_year(pc):
    """
    파섹 → 광년. DB에 저장된 원본을 사람이 읽는 단위로 바꾼다.
    
    비유: 그램(g)용 저울이라 손님이 알고 싶은 단위로 무게를 알려주려면
    단위를 변환하여 알려줘야 한다. 손님이 읽을 숫자라 자릿수를 정해도 된다.
    
    문서 04 ─ 6.1절 응답 예시가 "distance_ly": 4.24 (소수 2자리)이므로
    km_to_lunar_distance()와 같은 자릿수·같은 반올림 방식으로 맞춘다.
    
    pc가 None이면 None을 그대로 반환한다.
    ─ NASA에서 거리를 아직 측정하지 못한 항성이 실제로 존재한다. (문서 02 ─ 1.1절)
    """
    if pc is None:
        return None
    
    light_year = Decimal(str(pc)) * LIGHT_YEARS_PER_PARSEC
    
    # ROUND_HALF_UP을 명시하는 이유도 위 함수와 같다.
    # Decimal의 기본값(은행식 반올림)은 사람이 기대하는 결과와 다르다.
    return light_year.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
