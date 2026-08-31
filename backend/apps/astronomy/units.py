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
