import requests
from apps.astronomy.models import HostStar, Exoplanet
from .nasa_neo import _to_decimal


# NASA Exoplanet Archive의 TAP 서비스 주소
# 'sync' 동기(synchronous) 방식 — 요청을 보내고 결과가 올 때까지 기다린다.
# 'async'비동기(asynchronous) 방식 — 결과를 나중에 찾아가는 방식. 지금 프로젝트 단계에선 과하다.
# 비유: 카페 — "커피가 나올 때까지 앞에 서 있기" / "진동벨을 받고 자리에서 나올때 까지 기다리기"
TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"


# NASA Server에서 실제로 실행될 query
# 문서 02 - 5.4절 → mapping표에 적혀있는 15개 컬럼만 딱 집어서 가져온다.
# select * 으로 query를 날리면 300개가 넘는 컬럼이 딸려와 네크워크와 parsing 시간만 낭비된다.
TAP_QUERY = """
    select pl_name, hostname, sy_dist,
           pl_rade, pl_masse, pl_eqt, pl_orbper,
           disc_year, discoverymethod,
           st_spectype, st_teff, st_rad, st_mass, st_met, st_logg
    from ps
    where default_flag = 1
""" 


def fetch_exoplanets():
    """
    TAP Service에 Query를 던지고 받은 외계행성 데이터를 HostStar → Exoplanet 순서로 저장
    
    — 순서가 중요한 이유 —
    Exoplanet이 host_star_id를 FK로 가지고 있어서, 항성이 먼저 존재해야 행성을 붙일 수 있다.
    자식 등본을 만드려면 부모의 주민등록이 먼저 존재해야 하는 것과 같다.
    """
    # TAP는 URL 뒤에 ?query=...&format=... 처럼 직접 이어붙이는게 아니라
    # params 딕셔너리를 requests가 자동으로 URL Encoding하여 붙여준다.
    # 예: query 안의 줄바꿈, 공백을 URL이 허용하는 문자로 자동 변환 
    params = {
        "query": TAP_QUERY,
        "format": "json",
    }

    response = requests.get(TAP_URL, params=params)
    response.raise_for_status()  # NeoWs에서 사용했던 것과 동일 — 4xx/5xx면 여기서 예외를 발생시켜 멈춤

    rows = response.json()
    # NeoWs 응답은 { "near_earth_objects": { "2026-08-21": [...] } } 처럼 껍데기가 있었지만,
    # TAP JSON 응답은 껍데기 없이 바로 배열이다. [{...}, {...}, {...}]
    # 각 Dictionary의 key는 TAP_QUERY에서 select한 컬럼명 그대로 소문자로 온다. (예: pl_name, sy_dist 등)

    print(f"NASA로 부터 {len(rows)}개 행 수신")  # 확인용 출력 (지워도 됨)

    for row in rows:
        # ── 1) HostStar 먼저 저장 (또는 이미 있으면 갱신) ──
        # update_or_create를 사용하는 이유: nasa_neo.py의 Neo 저장과 같은 논리
        # 같은 항성(예: "Kepler-317")을 도는 행성이 여러개면, 
        # 이 루프에서 "Kepler-317"이 여러 번 등장하게 되고, 그때마다 새로 생성하면 안된다.
        # 이미 값이 존재한다면 최신 값으로 덮어써야 한다.
        # 비유: 편의점 재고 — 이미 진열이 되어 있다면 새로 놓지 않고 유통기한만 최신으로 바꾸기
        host_star, _ = HostStar.objects.update_or_create(
            name=row["hostname"],  # 이 값으로 "같은 항성인지" 판단 (UNIQUE 컬럼)
            defaults={
                "distance_pc": _to_decimal(row["sy_dist"]),
                "spectral_type": row["st_spectype"],
                "temperature_k": _to_decimal(row["st_teff"]),
                "radius_solar": _to_decimal(row["st_rad"]),
                "mass_solar": _to_decimal(row["st_mass"]),
                "metallicity": _to_decimal(row["st_met"]),
                "surface_gravity": _to_decimal(row["st_logg"]),
            },
        )

        # ── 2) Exoplanet 저장 (host_star는 방금 생성/발견한 것을 그대로 연결) ──
        Exoplanet.objects.update_or_create(
            planet_name=row["pl_name"],  # UNIQUE 컬럼 ─ 이 값으로 "같은 행성인지" 판단
            defaults={
                "host_star": host_star,  # 위에서 저장한 항성을 FK로 연결
                "radius_earth": _to_decimal(row["pl_rade"]),
                "mass_earth": _to_decimal(row["pl_masse"]),
                "equilibrium_temp_k": _to_decimal(row["pl_eqt"]),
                "orbital_period_days": _to_decimal(row["pl_orbper"]),
                "discovery_year": row["disc_year"],  # 정수는 변환 없이 그대로 (SmallIntegerField)
                "discovery_method": row["discoverymethod"],
            },
        )

    print(f"저장 완료: HostStar/Exoplanet 반영") 
