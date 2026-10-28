"""
인증 API 테스트 ─ 문서 04, 4장 / M2 완료 기준

python manage.py test apps.accounts
"""

from django.contrib.auth.models import User

from config.test_utils import PASSWORD, BaseAPITestCase, make_user


class AuthFlowTests(BaseAPITestCase):
    def test_csrf_and_me_are_open_without_login(self):
        # 기본 잠금(10-27) 중에도 열려 있어야 하는 두 곳 ─ 로그인 폼을 띄우려면 이 둘이 먼저 필요하다
        self.assertEqual(self.client.get("/api/auth/csrf/").status_code, 200)
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"is_authenticated": False, "user": None})

    def test_signup_logs_in_immediately(self):
        res = self.client.post(
            "/api/auth/signup/",
            {"username": "new_user", "email": "new@example.com", "password": PASSWORD, "password_confirm": PASSWORD},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        # 가입 = 로그인 (04 문서 4.3절) ─ 같은 클라이언트로 /me/ 를 물으면 본인이어야 한다
        self.assertEqual(self.client.get("/api/auth/me/").json()["user"]["username"], "new_user")
        # 비밀번호는 원문이 아니라 해시로 저장된다
        self.assertNotEqual(User.objects.get(username="new_user").password, PASSWORD)

    def test_signup_field_errors(self):
        make_user("taken")
        res = self.client.post(
            "/api/auth/signup/",
            {"username": "taken", "email": "x@example.com", "password": "12345678", "password_confirm": "1234"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        err = res.json()["error"]
        self.assertEqual(err["code"], "VALIDATION_ERROR")
        self.assertIn("username", err["fields"])  # 중복 아이디는 칸 오류로

    def test_login_failure_does_not_reveal_whether_user_exists(self):
        make_user("real_user")
        wrong_pw = self.client.post("/api/auth/login/", {"username": "real_user", "password": "nope-12345"}, format="json")
        no_user = self.client.post("/api/auth/login/", {"username": "ghost_user", "password": "nope-12345"}, format="json")
        # M2 완료 기준 ─ 두 응답이 글자 하나 다르지 않아야 한다 (계정 열거 방지)
        self.assertEqual(wrong_pw.status_code, 400)
        self.assertEqual(wrong_pw.json(), no_user.json())
        self.assertEqual(wrong_pw.json()["error"]["code"], "INVALID_CREDENTIALS")

    def test_login_cookie_ends_with_browser(self):
        # 10-28 ─ sessionid 쿠키에 만료일(expires/max-age)이 없어야 브라우저를 닫을 때 같이 지워진다
        make_user("u2")
        res = self.client.post("/api/auth/login/", {"username": "u2", "password": PASSWORD}, format="json")
        cookie = res.cookies["sessionid"]
        self.assertEqual(cookie["expires"], "")
        self.assertEqual(cookie["max-age"], "")
        self.assertTrue(cookie["httponly"])  # 자바스크립트가 못 읽는 쿠키 ─ 그대로인지 같이 확인

    def test_login_then_logout(self):
        make_user("u1")
        self.assertEqual(self.client.post("/api/auth/login/", {"username": "u1", "password": PASSWORD}, format="json").status_code, 200)
        self.assertTrue(self.client.get("/api/auth/me/").json()["is_authenticated"])
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertFalse(self.client.get("/api/auth/me/").json()["is_authenticated"])
        # 로그아웃 상태에서 또 로그아웃 → 401
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 401)


class AuthThrottleTests(BaseAPITestCase):
    """#5 (10-28) ─ 로그인 분당 10번, 가입 시간당 10번 (같은 IP)"""

    def test_login_is_limited_after_10_per_minute(self):
        for _ in range(10):
            self.client.post("/api/auth/login/", {"username": "ghost", "password": "nope-12345"}, format="json")
        res = self.client.post("/api/auth/login/", {"username": "ghost", "password": "nope-12345"}, format="json")
        self.assertEqual(res.status_code, 429)
        self.assertEqual(res.json()["error"]["code"], "RATE_LIMITED")

    def test_signup_is_limited_after_10_per_hour(self):
        for i in range(10):
            self.client.post("/api/auth/signup/", {"username": f"u{i}", "email": "bad"}, format="json")
        res = self.client.post("/api/auth/signup/", {"username": "u10", "email": "bad"}, format="json")
        self.assertEqual(res.status_code, 429)


class DefaultLockTests(BaseAPITestCase):
    """기본 잠금(10-27) ─ 인증 API 4개 말고는 전부 로그인 필요"""

    LOCKED = [
        "/api/neo/?date=2026-11-12",
        "/api/neo/1000001/",
        "/api/neo/1000001/approaches/",
        "/api/exoplanets/",
        "/api/exoplanets/1/",
        "/api/exoplanets/meta/",
        "/api/watchlist/neo/",
        "/api/watchlist/exoplanets/",
    ]

    def test_anonymous_gets_401_envelope_everywhere(self):
        for url in self.LOCKED:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, 401)
                self.assertEqual(res.json()["error"]["code"], "AUTH_REQUIRED")
