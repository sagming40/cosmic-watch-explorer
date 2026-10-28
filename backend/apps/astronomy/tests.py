"""
NEO·외계행성 API 테스트 ─ 문서 04, 5장·6장 / 01 문서 9장 MVP 기준

python manage.py test apps.astronomy

NASA는 부르지 않는다 ─ requests.get을 가짜로 바꿔서 "NASA가 이렇게 답했다면"을 만든다.
가짜가 불렸는지(called)까지 확인하면 "캐시면 NASA를 안 부른다"도 검증할 수 있다.
"""

from datetime import timedelta
from unittest.mock import patch

import requests
from django.utils import timezone

from apps.astronomy.models import CloseApproach, Neo, NeoFetchLog, OrbitalData
from config.test_utils import (
    BaseAPITestCase,
    FakeResponse,
    make_approach,
    make_neo,
    make_orbit,
    make_planet,
    make_user,
    nasa_feed,
    nasa_lookup,
    nasa_neo_item,
)

NASA_GET = "apps.astronomy.services.nasa_neo._http.get"  # NASA 전용 Session (10-28 #9)


class _NotJson(FakeResponse):
    """200인데 본문이 JSON이 아닌 응답 (NASA 앞단의 점검 페이지 같은 것)"""

    def json(self):
        raise ValueError("not json")
DAY = "2026-11-12"


class NeoDashboardTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.login_as(make_user())

    def test_cached_date_does_not_call_nasa(self):
        a = make_neo("1", is_hazardous=True)
        b = make_neo("2")
        make_approach(a, DAY, km="384400")  # 정확히 1 LD
        make_approach(b, DAY, km="3844000")
        NeoFetchLog.objects.create(fetch_date=DAY, element_count=2)
        with patch(NASA_GET) as nasa:
            res = self.client.get(f"/api/neo/?date={DAY}")
        nasa.assert_not_called()
        body = res.json()
        self.assertEqual(res.status_code, 200)
        self.assertTrue(body["cache"]["is_cached"])
        self.assertEqual(body["summary"]["total_count"], 2)
        self.assertEqual(body["summary"]["hazardous_count"], 1)
        self.assertAlmostEqual(body["summary"]["closest_ld"], 1.0, places=3)  # LD 환산은 서버(units.py)

    def test_first_lookup_fetches_and_stores(self):
        feed = nasa_feed(DAY, [nasa_neo_item("11", DAY), nasa_neo_item("12", DAY, hazardous=True)])
        with patch(NASA_GET, return_value=FakeResponse(200, feed)) as nasa:
            res = self.client.get(f"/api/neo/?date={DAY}")
            again = self.client.get(f"/api/neo/?date={DAY}")
        self.assertEqual(nasa.call_count, 1)  # 두 번째는 캐시
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()["cache"]["is_cached"])
        self.assertTrue(again.json()["cache"]["is_cached"])
        self.assertEqual(res.json()["summary"]["total_count"], 2)
        self.assertEqual(NeoFetchLog.objects.get(fetch_date=DAY).element_count, 2)
        self.assertEqual(CloseApproach.objects.filter(approach_date=DAY).count(), 2)

    def test_zero_approach_day_keeps_nulls(self):
        NeoFetchLog.objects.create(fetch_date=DAY, element_count=0)
        summary = self.client.get(f"/api/neo/?date={DAY}").json()["summary"]
        self.assertEqual(summary["total_count"], 0)
        # NULL 보존 ─ 0으로 채우지 않는다
        self.assertIsNone(summary["closest_ld"])
        self.assertIsNone(summary["largest_diameter_m"])

    def test_nasa_down_on_uncached_date_is_503(self):
        with patch(NASA_GET, side_effect=requests.ConnectionError("down")):
            res = self.client.get(f"/api/neo/?date={DAY}")
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.json()["error"]["code"], "UPSTREAM_ERROR")
        self.assertFalse(NeoFetchLog.objects.filter(fetch_date=DAY).exists())  # 실패한 날은 장부에 안 적는다

    # ─── #3 예외 좁히기 / #4 묶음 저장 (10-28) ───
    def test_nasa_5xx_and_non_json_are_503(self):
        for fake in (FakeResponse(500), _NotJson()):
            with self.subTest(fake=type(fake).__name__), patch(NASA_GET, return_value=fake):
                res = self.client.get(f"/api/neo/?date={DAY}")
                self.assertEqual(res.status_code, 503)

    def test_unexpected_nasa_shape_is_not_disguised_as_503(self):
        # 응답 모양이 바뀐 건 "NASA 연결 실패"가 아니다 → 숨기지 않고 진짜 오류로 (테스트 클라이언트는 예외를 그대로 올린다)
        broken = nasa_neo_item("42", DAY)
        del broken["estimated_diameter"]
        with patch(NASA_GET, return_value=FakeResponse(200, nasa_feed(DAY, [broken]))):
            with self.assertRaises(KeyError):
                self.client.get(f"/api/neo/?date={DAY}")

    def test_failure_midway_saves_nothing(self):
        # 첫 소행성은 멀쩡, 두 번째에서 터진다 → 첫 번째도 저장되면 안 된다 (반쯤 저장 방지)
        broken = nasa_neo_item("44", DAY)
        del broken["estimated_diameter"]
        feed = nasa_feed(DAY, [nasa_neo_item("43", DAY), broken])
        with patch(NASA_GET, return_value=FakeResponse(200, feed)):
            with self.assertRaises(KeyError):
                self.client.get(f"/api/neo/?date={DAY}")
        self.assertFalse(Neo.objects.filter(nasa_id="43").exists())
        self.assertFalse(NeoFetchLog.objects.filter(fetch_date=DAY).exists())

    def test_out_of_range_date_is_rejected_without_calling_nasa(self):
        for d in ("1899-12-31", "2201-01-01", "3000-01-01"):
            with self.subTest(d=d), patch(NASA_GET) as nasa:
                res = self.client.get(f"/api/neo/?date={d}")
                nasa.assert_not_called()
                self.assertEqual(res.status_code, 400)
                self.assertEqual(res.json()["error"]["code"], "INVALID_DATE")
                self.assertIn("1900-01-01 ~ 2200-12-31", res.json()["error"]["message"])
        # 경계값은 허용
        for d in ("1900-01-01", "2200-12-31"):
            NeoFetchLog.objects.create(fetch_date=d, element_count=0)
            self.assertEqual(self.client.get(f"/api/neo/?date={d}").status_code, 200)

    def test_invalid_date_format(self):
        res = self.client.get("/api/neo/?date=2026-13-99")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["error"]["code"], "INVALID_DATE")


class NasaRetryConfigTests(BaseAPITestCase):
    """#9 (10-28) ─ 재시도 설정이 의도대로인지 (실제 네트워크 재시도는 테스트에서 NASA를 안 부르므로 설정으로 확인)"""

    def test_retry_once_on_5xx_only_for_get(self):
        from apps.astronomy.services.nasa_neo import NASA_TIMEOUT, _http

        retry = _http.get_adapter("https://api.nasa.gov/").max_retries
        self.assertEqual(retry.total, 1)
        self.assertEqual(set(retry.status_forcelist), {500, 502, 503, 504})  # 4xx·429는 다시 안 함
        self.assertEqual(set(retry.allowed_methods), {"GET"})
        self.assertFalse(retry.raise_on_status)
        self.assertEqual(NASA_TIMEOUT, (5, 8))


class ConcurrentFirstSaveTests(BaseAPITestCase):
    """#8 (10-28) ─ 같은 날짜를 동시에 처음 열어 저장이 충돌하면 한 번 다시 저장"""

    def setUp(self):
        super().setUp()
        self.login_as(make_user())

    def test_integrity_error_is_retried_once(self):
        from django.db import IntegrityError

        from apps.astronomy.services import nasa_neo

        real = nasa_neo._save_feed
        calls = []

        def collide_first(*args):
            calls.append(1)
            if len(calls) == 1:
                real(*args)  # 저장까지 한 뒤 충돌 → 묶음째 취소돼야 한다
                raise IntegrityError("Duplicate entry")
            return real(*args)

        feed = nasa_feed(DAY, [nasa_neo_item("61", DAY)])
        with patch.object(nasa_neo, "_save_feed", side_effect=collide_first), patch(NASA_GET, return_value=FakeResponse(200, feed)):
            res = self.client.get(f"/api/neo/?date={DAY}")
        self.assertEqual(len(calls), 2)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(CloseApproach.objects.filter(neo__nasa_id="61").count(), 1)  # 첫 시도분은 취소돼 중복 없음


class NeoFeedRefreshTests(BaseAPITestCase):
    """#7 (10-28) ─ 오늘 이후 날짜는 받은 지 24시간이 지나면 다시 받는다"""

    def setUp(self):
        super().setUp()
        self.login_as(make_user())
        self.future = (timezone.localdate() + timedelta(days=5)).isoformat()
        self.neo = make_neo("51")
        make_approach(self.neo, self.future, km="9000000", hour=3)  # 예전 예측: 03시, 900만 km
        self.log = NeoFetchLog.objects.create(fetch_date=self.future, element_count=1)

    def _age(self, hours):
        NeoFetchLog.objects.filter(pk=self.log.pk).update(fetched_at=timezone.now() - timedelta(hours=hours))

    def test_fresh_future_date_is_not_refetched(self):
        self._age(23)
        with patch(NASA_GET) as nasa:
            self.assertTrue(self.client.get(f"/api/neo/?date={self.future}").json()["cache"]["is_cached"])
        nasa.assert_not_called()

    def test_past_date_is_never_refetched(self):
        past = "2020-01-01"
        NeoFetchLog.objects.create(fetch_date=past, element_count=0)
        NeoFetchLog.objects.filter(fetch_date=past).update(fetched_at=timezone.now() - timedelta(days=900))
        with patch(NASA_GET) as nasa:
            self.client.get(f"/api/neo/?date={past}")
        nasa.assert_not_called()

    def test_stale_future_date_is_refetched_and_corrected(self):
        self._age(25)
        # NASA가 예측을 고쳤다: 12시, 800만 km (시각도 거리도 바뀜)
        feed = nasa_feed(self.future, [nasa_neo_item("51", self.future, km="8000000")])
        with patch(NASA_GET, return_value=FakeResponse(200, feed)) as nasa:
            body = self.client.get(f"/api/neo/?date={self.future}").json()
        nasa.assert_called_once()
        self.assertFalse(body["cache"]["is_cached"])
        rows = CloseApproach.objects.filter(neo=self.neo, approach_date=self.future)
        self.assertEqual(rows.count(), 1)  # 예전 예측(03시) 행은 지워져 중복이 없다
        self.assertEqual(float(rows.get().miss_distance_km), 8000000)
        self.assertEqual(body["summary"]["total_count"], 1)
        self.assertLess(timezone.now() - NeoFetchLog.objects.get(pk=self.log.pk).fetched_at, timedelta(minutes=1))

    def test_refresh_failure_serves_stored_data(self):
        self._age(25)
        with patch(NASA_GET, side_effect=requests.ConnectionError("down")):
            res = self.client.get(f"/api/neo/?date={self.future}")
        self.assertEqual(res.status_code, 200)  # 503 아님 ─ 예전 데이터가 있다
        self.assertTrue(res.json()["cache"]["is_cached"])
        self.assertEqual(res.json()["summary"]["total_count"], 1)

    def test_refresh_throttled_serves_stored_data(self):
        self._age(25)
        with patch("apps.astronomy.views.ScopedRateThrottle.allow_request", return_value=False), patch(NASA_GET) as nasa:
            res = self.client.get(f"/api/neo/?date={self.future}")
        nasa.assert_not_called()
        self.assertEqual(res.status_code, 200)  # 429 아님


class NeoDetailTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.login_as(make_user())

    def test_unknown_id_is_404_without_calling_nasa(self):
        with patch(NASA_GET) as nasa:
            res = self.client.get("/api/neo/9999999/")
        nasa.assert_not_called()
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()["error"]["code"], "NOT_FOUND")

    def test_orbit_already_stored_does_not_call_nasa(self):
        neo = make_neo("21")
        make_orbit(neo)
        with patch(NASA_GET) as nasa:
            res = self.client.get("/api/neo/21/")
        nasa.assert_not_called()
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.json()["orbital_data"])

    def test_first_detail_fetches_orbit(self):
        make_neo("22")
        with patch(NASA_GET, return_value=FakeResponse(200, nasa_lookup("22"))):
            res = self.client.get("/api/neo/22/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["orbital_data"]["orbit_class_type"], "APO")
        self.assertTrue(OrbitalData.objects.filter(neo__nasa_id="22").exists())

    def test_lookup_404_returns_detail_without_orbit(self):
        make_neo("23")
        with patch(NASA_GET, return_value=FakeResponse(404)):
            res = self.client.get("/api/neo/23/")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json()["orbital_data"])
        self.assertEqual(res.json()["orbit_status"], "missing")

    # ─── 결정 A (10-28): NASA가 실패해도 DB에 있는 것은 보여준다 ───
    def test_nasa_down_still_returns_stored_detail(self):
        neo = make_neo("25", name="(2026 DOWN)")
        make_approach(neo, "2030-05-05")
        with patch(NASA_GET, side_effect=requests.ConnectionError("down")):
            res = self.client.get("/api/neo/25/")
        body = res.json()
        self.assertEqual(res.status_code, 200)  # 예전엔 503으로 화면 전체가 막혔다
        self.assertEqual(body["orbit_status"], "unavailable")
        self.assertEqual(body["name"], "(2026 DOWN)")
        self.assertEqual(body["approach_count"], 1)
        self.assertIsNone(body["orbital_data"])

    def test_failure_log_never_contains_api_key(self):
        # requests 오류 문구엔 요청 URL이 통째로 들어간다 → 로그에 키가 새면 안 된다 (10-28 발견)
        make_neo("29")
        leaky = requests.HTTPError("403 Client Error: Forbidden for url: https://api.nasa.gov/neo/rest/v1/neo/29?api_key=SECRET123")
        with patch(NASA_GET, side_effect=leaky), self.assertLogs("apps.astronomy", level="WARNING") as logs:
            self.client.get("/api/neo/29/")
        joined = " ".join(logs.output)
        self.assertNotIn("SECRET123", joined)
        self.assertIn("HTTPError", joined)

    def test_rate_limited_returns_stored_detail_without_calling_nasa(self):
        make_neo("26")
        with patch("apps.astronomy.views.ScopedRateThrottle.allow_request", return_value=False), patch(NASA_GET) as nasa:
            res = self.client.get("/api/neo/26/")
        nasa.assert_not_called()
        self.assertEqual(res.status_code, 200)  # 예전엔 429
        self.assertEqual(res.json()["orbit_status"], "rate_limited")

    def test_orbit_status_ok(self):
        neo = make_neo("27")
        make_orbit(neo)
        self.assertEqual(self.client.get("/api/neo/27/").json()["orbit_status"], "ok")
        make_neo("28")
        with patch(NASA_GET, return_value=FakeResponse(200, nasa_lookup("28"))):
            self.assertEqual(self.client.get("/api/neo/28/").json()["orbit_status"], "ok")

    def test_approaches_are_paginated(self):
        neo = make_neo("24")
        make_orbit(neo)
        for d in range(1, 26):
            make_approach(neo, f"2030-01-{d:02d}")
        page1 = self.client.get("/api/neo/24/approaches/").json()
        self.assertEqual((page1["count"], page1["total_pages"], len(page1["results"])), (25, 2, 20))
        self.assertEqual(len(self.client.get("/api/neo/24/approaches/?page=2").json()["results"]), 5)


class ExoplanetTests(BaseAPITestCase):
    @classmethod
    def setUpTestData(cls):
        # 반지름 0.8~1.5, 100광년(≈30.66 pc) 이하 조건으로 걸리는 것 / 안 걸리는 것을 경계 근처로 섞는다
        cls.near_earthlike = make_planet("Near-1 b", radius=1.0, distance_pc=10)
        cls.edge_radius = make_planet("Edge-2 b", radius=1.5, distance_pc=20)  # 최댓값 포함(이하)
        make_planet("Big-3 b", radius=2.0, distance_pc=10)
        make_planet("Far-4 b", radius=1.0, distance_pc=40)  # ≈130광년
        make_planet("NoRadius-5 b", radius=None, distance_pc=10)  # 반지름 미측정 → 범위 조건에서 빠진다
        make_planet("NoDist-6 b", radius=1.0, distance_pc=None)

    def setUp(self):
        super().setUp()
        self.login_as(make_user())

    def test_multi_condition_search(self):
        res = self.client.get("/api/exoplanets/?radius_min=0.8&radius_max=1.5&distance_max_ly=100")
        body = res.json()
        self.assertEqual(res.status_code, 200)
        self.assertEqual({r["planet_name"] for r in body["results"]}, {"Near-1 b", "Edge-2 b"})
        self.assertEqual(body["applied_filters"], {"radius_min": 0.8, "radius_max": 1.5, "distance_max_ly": 100})

    def test_invalid_filter_value_is_field_error(self):
        err = self.client.get("/api/exoplanets/?radius_min=abc").json()["error"]
        self.assertEqual(err["code"], "VALIDATION_ERROR")
        self.assertIn("radius_min", err["fields"])

    def test_pagination_and_out_of_range_page(self):
        body = self.client.get("/api/exoplanets/?page_size=4").json()
        self.assertEqual((body["count"], body["total_pages"], len(body["results"])), (6, 2, 4))
        self.assertEqual(len(self.client.get("/api/exoplanets/?page_size=4&page=2").json()["results"]), 2)
        self.assertEqual(self.client.get("/api/exoplanets/?page_size=4&page=3").status_code, 404)

    def test_detail_and_404(self):
        res = self.client.get(f"/api/exoplanets/{self.near_earthlike.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["host_star"]["name"], "Near-1 b star")
        self.assertEqual(self.client.get("/api/exoplanets/999999/").status_code, 404)

    def test_meta_ignores_nulls(self):
        meta = self.client.get("/api/exoplanets/meta/").json()
        self.assertEqual(meta["total_count"], 6)
        self.assertEqual(float(meta["ranges"]["radius_earth"]["min"]), 1.0)  # NULL은 Min/Max에서 빠진다
