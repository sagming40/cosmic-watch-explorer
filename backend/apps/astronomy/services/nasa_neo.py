import requests
from datetime import datetime
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.utils import timezone

from apps.astronomy.models import Neo, CloseApproach, OrbitalData, NeoFetchLog

NASA_FEED_URL = "https://api.nasa.gov/neo/rest/v1/feed"
# NASA NeoWs(Near Earth Object Web Service)의 '날짜별 목록 조회' 엔드포인트
# README.md 229번째 줄 API 링크 참조
NASA_LOOKUP_URL = "https://api.nasa.gov/neo/rest/v1/neo/{asteroid_id}"
# NeoWs의 '소행성 개별 조회' endpoint
# Feed와 결정적으로 다른 점: 소행성 ID가 querystring이 아니라 "URL 경로 안"에 들어간다.
# 즉, params 딕셔너리로 넘기지 못하고 String Format으로 주소를 조립해야 한다.


def _to_decimal(value):
    """
    NASA에서 숫자를 문자열로 제공할 때(예: "18.83") 문자열을 DecimalFielddp
    넣을 수 있는 Decimal 타입으로 변환해주는 안전장치

    비유: 편의점에서 손님이 낸 꼬깃꼬깃한 지폐를 그대로 금고에 넣는 게 아니라,
    이게 진짜 돈이 맞는지 확인 후, 쫙 펴서 넣는 것과 같다.
    값이 없거나(None) 이상한 문자열이면 None 반환. 저장할 때 DB의 null=True 필드에 조용히 들어감 
    """
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None


def _to_int(value):
    """
    _to_decimal의 '정수' 버전. data_arc_in_days, observations_used용.

    비유: 검표소 ─ '금액' 창구 / '개수' 창구
    통과 규칙(이상하면 None)은 같고 결과 타입만 다르다.
    """
    if value is None or value == "":
        return None
    try: 
        return int(value)
    except (ValueError, TypeError):
        return None


def _parse_orbit_determination_datetime(value):
    """
    궤도 결정 시각 parsing. _parse_datetime_utc와 '형식이 다르다'는 게 핵심

    접근 시각 : "2026-Aug-21 03:16"     ← 월이 영문 약자
    궤도 결정 : "2021-05-24 17:55:05"   ← 월이 숫자, 초까지 있음

    같은 NASA API인데도 필드마다 날짜 표기가 다르다. 즉, parser를 하나로 사용하면 안 된다.
    비유: 같은 회사의 서류인데 부서마다 날짜 표기 방식이 다른 것. 부서별로 해독기가 필요하다.
    """    
    if not value:
        return None

    # 초(second)가 없는 형태로 오는 경우도 있어 두 형식을 순서대로 시도한다.
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"): 
        try:
            naive_dt = datetime.strptime(value, fmt)
        except (ValueError, TypeError):
            continue
        return timezone.make_aware(naive_dt, timezone.UTC)

    return None    


def _parse_datetime_utc(datetime_full_str):
    """
    NASA에서 제공하는 "2026-Aug-21 03:16" 같은 문자열을
    Django의 DateTimeField가 이해하는 datetime 객체로 변환해 주는 함수

    비유: 외국에서 온 편지에 적힌 날짜 표기법("Aug 21, 2026")dmf
    우리나라 관공서 서류 양식("2026-08-21")으로 옮겨 적는 것.
    형식이 맞지 않으면 컴퓨터는 "이게 날짜인지 아닌지도" 모름.
    """    
    try:
        naive_dt = datetime.strptime(datetime_full_str, "%Y-%b-%d %H:%M")
    except (ValueError, TypeError):
        return None

    return timezone.make_aware(naive_dt, timezone.UTC)
    # make_aware: 이 시간은 UTC 기준이라는 것을 명시한다.
    # Django는 추측이 아닌 확실한 정보(UTC)를 전달받은 상태가 됨
    # 비유: 소포에 "이건 한국 시간이 아니라 UTC 기준입니다" 라고 명확히 라벨을 붙여 보내는 것.
    # 받는 쪽(DB)에서 헷갈릴 일이 없음


def _save_close_approaches(neo, approach_list):
    """
    접근 기록 목록을 DB에 저장한다. 새로 저장된 건수를 반환.

    Feed(날짜별 목록)와 Lookup(소행성별 전체) 두 창구 모두
    close_approach_data를 '똑같은 모양'으로 반환하기 때문에 이 함수 하나를 공유한다.

    비유: 들어온 서류의 양식이 같으면 접수창구가 어디였든
    서류함에 꽂는 방법은 하나여야 한다. 창구마다 꽂는 법이 다르면
    나중에 양식이 바뀔 때 한 창구만 고치고 다른 창구는 잊어버린다. 
    """    
    saved_count = 0

    for approach in approach_list:
        approach_datetime = _parse_datetime_utc(approach.get("close_approach_date_full"))
        if approach_datetime is None:
            continue
        # 날짜 parsing에 실패한 data는 조용히 건너뜀
        # 수백 건 중 하나가 이상하다 해도 전체 수집이 멈추면 안된다.

        _, created = CloseApproach.objects.get_or_create(
            neo=neo,
            approach_datetime_utc=approach_datetime,
            orbiting_body=approach.get("orbiting_body", ""),
            defaults={
                "approach_date": approach.get("close_approach_date"),
                "velocity_km_s": _to_decimal(
                    approach["relative_velocity"]["kilometers_per_second"]
                ),
                "velocity_km_h": _to_decimal(
                    approach["relative_velocity"]["kilometers_per_hour"]
                ),
                "miss_distance_km": _to_decimal(approach["miss_distance"]["kilometers"]),
                "miss_distance_au": _to_decimal(approach["miss_distance"]["astronomical"]),
            },
        )
        # update_or_create가 아닌 get_or_create를 사용하는 이유
        # neo + approach_datetime_utc + orbiting_body = UniqueConstraint(uk_ca_unique) 조합.
        # 이미 있다면 그냥 두고, 없으면 새로 생성
        # → 같은 소행성을 Feed로 한 번, Lookup으로 또 한 번 수집해도
        #   겹치는 접근 기록은 중복 저장 되지 않는다.

        if created:
            saved_count += 1

    return saved_count        


def fetch_feed(date_str):
    """
    NASA NeoWs Feed API에서 특정 날짜의 소행성 접근 데이터를 가져와 DB에 저장한다.

    date_str: "2026-08-21" 형식의 문자열 (start_date와 end_date를 동일하게 "하루치만" 조회)
    문서 01 요구사항 ─ "하루 단위 조회" 그대로.
    """ 
    params = {
        "start_date": date_str,
        "end_date": date_str,
        "api_key": settings.NASA_API_KEY,
    }
    # params 딕셔너리로 넘기는 이유:
    # requests 라이브러리가 자동으로 URL querystring으로 조립해준다.
    # 즉, 문자열을 직접 이어붙여 만들 필요가 없다.
    # "...feed?start_date=2026-08-21&end_date=2026-08-21&api_key=..." ← ❌
    # 특수문자 인코딩 같은 것도 requests 라이브러리가 알아서 처리해준다.

    response = requests.get(NASA_FEED_URL, params=params, timeout=10)
    # timeout=10: "10초 안에 응답이 없을 경우 포기할 것" → 안전장치
    # timeout을 지정해주지 않으면 NASA가 응답을 주지 않을 경우 프로그램이 무한정 멈춰버림
    # 비유: 전화를 걸었는데 상대방이 받지 않으면 언젠간 전화를 끊는 것과 같음.

    response.raise_for_status()
    # 응답 상태 코드가 200번대(성공)가 아니면 예외(에러)를 던져서 함수를 중단 시키는 역할
    # 예: API 키가 틀린 경우 403, 요청 형식이 잘못 된 경우 400이 오는데, 이 함수가 없으면
    # 성공으로 착각하고 잘못된 응답을 계속 parsing 하려다 훨씬 더 이해하기 어려운 에러를 만나게 됨.

    data = response.json()
    # NASA에서 제공받은 응답 본문(텍스트)을 Python Dictionary로 변환

    element_count = data.get("element_count", 0)
    neo_list = data.get("near_earth_objects", {}).get(date_str, [])
    # 구조가 좀 독특하다. NASA의 응답 모양:
    # { "element_count": 12,
    #   "near_earth_objects": { "2026-08-21": [ {...}, {...}, ... ] } }
    # "near_earth_objects" 밑에 날짜를 '키(key)'로 한 번더 감싸서 주는 구조다.
    # 요청한 그 날짜(date_str)로 한 번더 꺼내야 실제 list가 나온다.

    saved_approach_count = 0

    for neo_data in neo_list:
        # ① Neo 저장 — 이미 있으면 갱신, 없으면 새로 생성
        neo, _ = Neo.objects.update_or_create(
            nasa_id=neo_data["id"],
            defaults={
                "name": neo_data["name"],
                "absolute_magnitude": _to_decimal(neo_data.get("absolute_magnitude_h")),
                "diameter_min_m": _to_decimal(
                    neo_data["estimated_diameter"]["meters"]["estimated_diameter_min"]
                ),
                "diameter_max_m": _to_decimal(
                    neo_data["estimated_diameter"]["meters"]["estimated_diameter_max"]
                ),
                "is_hazardous": neo_data.get("is_potentially_hazardous_asteroid", False),
                "is_sentry_object": neo_data.get("is_sentry_object", False),
                "jpl_url": neo_data.get("nasa_jpl_url"),
            },
        )   
        # update_or_create: "nasa_id"값이 행에 있으면 defaults로 덮어쓰며 갱신
        # 없다면 nasa_id + defaults를 합쳐 새로 생성하라는 뜻
        #
        # 비유: "편의점 재고표" 
        # "처음 들어온 상품이면 새로운 줄을 추가" / "이미 있는 상품이면 최신 정보로 갱신"
        #
        # 반환값(객체, 생성여부)이 Tuple이다. 두번째 값은 언더스코어(_)로 버림.
        # "이 값은 사용하지 않는 값이므로 이름을 붙일 필요가 없다" ─ Python의 관례

        # ② 소행성의 접근 기록 저장 — 공통 함수에 위임
        saved_approach_count += _save_close_approaches(
            neo, neo_data.get("close_approach_data", [])
        )

    # ③ 발주 장부에 "해당 날짜 수집 완료"라고 기록
    NeoFetchLog.objects.update_or_create(
        fetch_date=date_str,
        defaults={
            "element_count": element_count,
            "is_success": True,
        },
    )

    print(
        f"[fetch_feed] {date_str}: 저장 완료 — 신규 CloseApproach {saved_approach_count}건 "
        f"(NASA element_count={element_count})"
    )            

    return element_count, saved_approach_count


def fetch_neo_detail(nasa_id):
    """
    NASA NeoWs Lookup API에서 소행성 하나의 '전체 정보'를 가져와 DB에 저장한다.

    Feed와 차이점
      Feed   : 편의점 '일일 판매 전표' — 당일 판매 물품 목록. 상품별 상세는 없다.
      Lookup : 해당 상품의 '상품 상세 카드' — 제조사, 규격, 지금까지의 전체 판매 이력.

    Lookup의 차별점
      궤도(orbital_data), 평생 접근 기록 전체, designation
      return : neo 객체, 새로 저장된 접근 기록 수, 궤도 저장 여부  
    """
    params = {"api_key": settings.NASA_API_KEY}
    url = NASA_LOOKUP_URL.format(asteroid_id=nasa_id)

    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    # ① Neo 본체 ― Feed와 달리 designation까지 채운다
    #    Feed 응답엔 designation이 없어서 M1에선 비워둘 수 밖에 없었다.
    neo, _ = Neo.objects.update_or_create(
        nasa_id=data["id"],
        defaults={
            "name": data["name"],
            "designation": data.get("designation"),
            "absolute_magnitude": _to_decimal(data.get("absolute_magnitude_h")),
            "diameter_min_m": _to_decimal(
                data["estimated_diameter"]["meters"]["estimated_diameter_min"]
            ),
            "diameter_max_m": _to_decimal(
                data["estimated_diameter"]["meters"]["estimated_diameter_max"]
            ),
            "is_hazardous": data.get("is_potentially_hazardous_asteroid", False),
            "is_sentry_object": data.get("is_sentry_object", False),
            "jpl_url": data.get("nasa_jpl_url"),
        },
    )

    # ② 접근 기록 ― Step 1에서 분리해둔 공통 함수를 그대로 재사용
    #   Feed는 하루치 1건만 주지만, 수십 ~ 수백 건이 한꺼번에 온다.
    #   Earth 이외에 Venus, Mars 같은 다른 천체 접근도 섞여 있다.
    # 문서 02 ― 5.3절의 body 필터가 여기서 의미를 갖는다.
    saved_approach_count = _save_close_approaches(
        neo, data.get("close_approach_data", [])
    )

    # ③ 궤도 정보 ― Lookup에만 있는 알맹이
    orbital = data.get("orbital_data") or {}
    # or {}: NASA 응답에 키 값을 아예 주지 않거나 null로 응답이 올 수도 있다.
    # orbital이 None이 되면 아래 .get에서 AttributeError가 터진다.
    # 코드가 조건 분기 없이 흘러갈 수 있도록 "빈 서류철"을 만들어둔다.

    orbit_saved = False
    if orbital:
        orbit_class = orbital.get("orbit_class") or {}
        # orbit_class는 orbital_data 안에 한 겹 더 들어있는 중첩 객체이다.
        # 문서 02 ― 5.3절 mapping표의 orbit_class.orbit_class_type 부분

        OrbitalData.objects.update_or_create(
            neo=neo,
            defaults={
                "orbit_id": orbital.get("orbit_id"),
                "orbit_determination_datetime_utc": _parse_orbit_determination_datetime(
                    orbital.get("orbit_determination_date")
                ),
                "first_observation_date": orbital.get("first_observation_date") or None,
                "last_observation_date": orbital.get("last_observation_date") or None,
                # or None : NASA 응답이 빈 문자열("")오는 경우가 있는데,
                # DateField는 빈 문자열을 받으면 예외를 던진다. 빈 값은 NULL로 착지시킨다.
                "data_arc_days": _to_int(orbital.get("data_arc_in_days")),
                "observations_used": _to_int(orbital.get("observations_used")),
                "eccentricity": _to_decimal(orbital.get("eccentricity")),
                "semi_major_axis_au": _to_decimal(orbital.get("semi_major_axis")),
                "inclination_deg": _to_decimal(orbital.get("inclination")),
                "orbital_period_days": _to_decimal(orbital.get("orbital_period")),
                "perihelion_distance_au": _to_decimal(orbital.get("perihelion_distance")),
                "aphelion_distance_au": _to_decimal(orbital.get("aphelion_distance")),
                "orbit_class_type": orbit_class.get("orbit_class_type"),
                "orbit_class_description": orbit_class.get("orbit_class_description"),
            },
        )
        # get_or_create가 아니라 update_or_create인 이유
        # NASA는 새 관측이 쌓일 때마다 궤도를 다시 계산한다. '가장 최신 값'이 필요하다.
        #
        # neo_id에 UNIQUE를 거는 이유 (문서 02 ― 3.3절)
        # neo가 OneToOneField라 UNIQUE가 걸려 있으므로, 같은 소행성엔 항상 그 행을 덮어쓴다.
        # M1의 HostStar/Exoplanet에서 update_or_create를 골랐던 것과 같은 판단이다.
        orbit_saved = True

    # ⚠️ neo_fetch_log는 건드리지 않는다.
    # # 그 장부는 "어느 '날짜'를 Feed롤 수집했나"를 기록하는 것이라 단위가 다르다.
    # 여기서 기록을 남기면 Dashboard가 "그 날자는 이미 수집됨"으로 착각한다.
    # 상세 수집의 장부 역할은 'orbital_data 행이 존재하는가' 자체가 대신한다.
     
    print(
        f"[fetch_neo_detail] {nasa_id}: 신규 CloseApproach {saved_approach_count}건 "
        f"/ 궤도 저장 {orbit_saved}"
    )

    return neo, saved_approach_count, orbit_saved
