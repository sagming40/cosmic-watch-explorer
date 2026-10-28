"""
테스트 공용 도구 ─ 앱 3개(accounts·astronomy·watchlist)의 tests.py가 같이 쓴다.

config/에 두는 이유 ─ pagination.py, exception_handler.py와 같다. 특정 앱 사정이 아니라 "프로젝트 전체의 약속"이라서.

원칙
- 테스트는 NASA를 절대 부르지 않는다. 외부 호출은 전부 가짜(mock)로 바꾼다.
  비유: 소방 훈련에 진짜 불을 지르지 않는 것 ─ 훈련 결과가 날씨(NASA 상태)에 따라 바뀌면 안 된다.
- 데이터는 테스트마다 필요한 만큼만 직접 만든다. (실제 DB의 6,451건에 기대지 않는다)
"""

from datetime import datetime, timezone as dt_tz
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.astronomy.models import CloseApproach, Exoplanet, HostStar, Neo, OrbitalData

PASSWORD = "Orbit-test-1234"  # 테스트 DB 전용 (실행이 끝나면 DB째 사라진다)


class BaseAPITestCase(APITestCase):
    """
    모든 API 테스트의 부모.
    스로틀 계량기는 Django 캐시(LocMemCache)에 숫자를 쌓는다 → 테스트끼리 섞이지 않게 매번 비운다.
    """

    def setUp(self):
        cache.clear()

    def login_as(self, user):
        # 세션 로그인 ─ 실제 로그인 API를 거치지 않고 바로 로그인 상태로 (로그인 자체는 accounts 테스트가 따로 검증)
        self.client.force_login(user)


# ─── 데이터 만들기 ─────────────────────────────────────────────────────
def make_user(username="tester", email=None):
    return User.objects.create_user(username=username, email=email or f"{username}@example.com", password=PASSWORD)


def make_neo(nasa_id="1000001", name="(2026 TEST)", **kw):
    defaults = dict(diameter_min_m=Decimal("100"), diameter_max_m=Decimal("220"), is_hazardous=False)
    defaults.update(kw)
    return Neo.objects.create(nasa_id=nasa_id, name=name, **defaults)


def make_approach(neo, date_str, km="3844000", body="Earth", hour=12):
    y, m, d = map(int, date_str.split("-"))
    return CloseApproach.objects.create(
        neo=neo,
        approach_date=date_str,
        approach_datetime_utc=datetime(y, m, d, hour, 0, tzinfo=dt_tz.utc),
        velocity_km_s=Decimal("12.5"),
        velocity_km_h=Decimal("45000"),
        miss_distance_km=Decimal(km),
        miss_distance_au=Decimal("0.0257"),
        orbiting_body=body,
    )


def make_orbit(neo):
    return OrbitalData.objects.create(neo=neo, eccentricity=Decimal("0.2"), semi_major_axis_au=Decimal("1.1"))


def make_planet(name, radius=None, distance_pc=None, host=None, **kw):
    star, _ = HostStar.objects.get_or_create(
        name=host or f"{name} star",
        defaults={"distance_pc": Decimal(str(distance_pc)) if distance_pc is not None else None},
    )
    return Exoplanet.objects.create(
        host_star=star,
        planet_name=name,
        radius_earth=Decimal(str(radius)) if radius is not None else None,
        **kw,
    )


# ─── 가짜 NASA 응답 ────────────────────────────────────────────────────
def nasa_neo_item(nasa_id, date_str, name=None, km="3844000", hazardous=False):
    """NeoWs Feed/Lookup 응답 안의 소행성 한 건 ─ 실제 응답에서 서비스가 읽는 키만 남긴 모양"""
    return {
        "id": nasa_id,
        "name": name or f"({nasa_id})",
        "absolute_magnitude_h": 22.1,
        "estimated_diameter": {"meters": {"estimated_diameter_min": 100.0, "estimated_diameter_max": 220.0}},
        "is_potentially_hazardous_asteroid": hazardous,
        "is_sentry_object": False,
        "nasa_jpl_url": f"https://ssd.jpl.nasa.gov/?sstr={nasa_id}",
        "close_approach_data": [
            {
                "close_approach_date": date_str,
                "close_approach_date_full": f"{date_str[:4]}-{_mon_day(date_str)} 12:00",
                "relative_velocity": {"kilometers_per_second": "12.5", "kilometers_per_hour": "45000"},
                "miss_distance": {"kilometers": km, "astronomical": "0.0257"},
                "orbiting_body": "Earth",
            }
        ],
    }


def _mon_day(date_str):
    # NASA의 close_approach_date_full 형식 "2026-Nov-12 12:00"에 맞춘다
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    _, m, d = date_str.split("-")
    return f"{months[int(m) - 1]}-{d}"


def nasa_feed(date_str, items):
    return {"element_count": len(items), "near_earth_objects": {date_str: items}}


def nasa_lookup(nasa_id, date_str="2026-11-12"):
    item = nasa_neo_item(nasa_id, date_str)
    item["designation"] = f"TEST {nasa_id}"
    item["orbital_data"] = {
        "orbit_id": "7",
        "eccentricity": "0.21",
        "semi_major_axis": "1.08",
        "inclination": "3.2",
        "orbital_period": "410.5",
        "perihelion_distance": "0.85",
        "aphelion_distance": "1.31",
        "orbit_class": {"orbit_class_type": "APO", "orbit_class_description": "Earth-crossing"},
    }
    return item


class FakeResponse:
    """requests.Response 흉내 ─ 서비스가 쓰는 status_code·json()·raise_for_status()만"""

    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload

    def raise_for_status(self):
        import requests

        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} Error", response=self)
