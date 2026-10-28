"""
Watchlist API 테스트 ─ 문서 04, 7장 / M2 완료 기준 (교차 로그인 격리·409·401)

python manage.py test apps.watchlist
"""

from apps.watchlist.models import ExoplanetWatchlist, NeoWatchlist
from config.test_utils import BaseAPITestCase, make_neo, make_planet, make_user


class NeoWatchlistTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.me = make_user("me")
        self.other = make_user("other")
        self.neo = make_neo("31")
        self.login_as(self.me)

    def test_save_list_delete(self):
        res = self.client.post("/api/watchlist/neo/", {"nasa_id": "31"}, format="json")
        self.assertEqual(res.status_code, 201)
        listed = self.client.get("/api/watchlist/neo/").json()
        self.assertEqual([r["nasa_id"] for r in listed["results"]], ["31"])
        self.assertEqual(self.client.delete("/api/watchlist/neo/31/").status_code, 200)
        self.assertEqual(self.client.get("/api/watchlist/neo/").json()["count"], 0)

    def test_duplicate_is_409(self):
        self.client.post("/api/watchlist/neo/", {"nasa_id": "31"}, format="json")
        res = self.client.post("/api/watchlist/neo/", {"nasa_id": "31"}, format="json")
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.json()["error"]["code"], "ALREADY_EXISTS")

    def test_unknown_target_is_404(self):
        res = self.client.post("/api/watchlist/neo/", {"nasa_id": "9999999"}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_delete_is_idempotent(self):
        # 저장 안 된 걸 지워도 200 ─ "결과적으로 저장돼 있지 않다"는 목적은 달성 (04 문서 7.4절)
        self.assertEqual(self.client.delete("/api/watchlist/neo/31/").status_code, 200)

    def test_users_are_isolated(self):
        NeoWatchlist.objects.create(user=self.other, neo=self.neo)
        # 남의 목록이 안 보이고
        self.assertEqual(self.client.get("/api/watchlist/neo/").json()["count"], 0)
        # 남의 항목을 지울 수도 없다 (200이지만 상대 행은 그대로)
        self.client.delete("/api/watchlist/neo/31/")
        self.assertTrue(NeoWatchlist.objects.filter(user=self.other, neo=self.neo).exists())

    def test_logged_out_is_401(self):
        self.client.logout()
        self.assertEqual(self.client.get("/api/watchlist/neo/").status_code, 401)


class ExoplanetWatchlistTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.me = make_user("me")
        self.planet = make_planet("Watch-1 b", radius=1.1, distance_pc=12)
        self.login_as(self.me)

    def test_save_list_delete(self):
        res = self.client.post("/api/watchlist/exoplanets/", {"exoplanet_id": self.planet.id}, format="json")
        self.assertEqual(res.status_code, 201)
        row = self.client.get("/api/watchlist/exoplanets/").json()["results"][0]
        self.assertEqual(row["planet_name"], "Watch-1 b")
        self.assertEqual(self.client.delete(f"/api/watchlist/exoplanets/{self.planet.id}/").status_code, 200)
        self.assertFalse(ExoplanetWatchlist.objects.filter(user=self.me).exists())

    def test_detail_shows_is_watchlisted(self):
        self.client.post("/api/watchlist/exoplanets/", {"exoplanet_id": self.planet.id}, format="json")
        self.assertTrue(self.client.get(f"/api/exoplanets/{self.planet.id}/").json()["is_watchlisted"])
