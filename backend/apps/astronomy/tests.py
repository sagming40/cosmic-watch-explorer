"""
NEO·외계행성 API 테스트 ─ 문서 04, 5장·6장 / 01 문서 9장 MVP 기준

python manage.py test apps.astronomy

NASA는 부르지 않는다 ─ requests.get을 가짜로 바꿔서 "NASA가 이렇게 답했다면"을 만든다.
가짜가 불렸는지(called)까지 확인하면 "캐시면 NASA를 안 부른다"도 검증할 수 있다.
"""

from unittest.mock import patch

import requests

from apps.astronomy.models import CloseApproach, NeoFetchLog, OrbitalData
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

NASA_GET = "apps.astronomy.services.nasa_neo.requests.get"
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

    def test_invalid_date_format(self):
        res = self.client.get("/api/neo/?date=2026-13-99")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["error"]["code"], "INVALID_DATE")


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
