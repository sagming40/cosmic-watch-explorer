"""
인증 API 테스트 ─ 문서 04, 4장 / M2 완료 기준

python manage.py test apps.accounts
"""

from django.contrib.auth.models import User

from apps.accounts.models import UserPreference
from config.test_utils import PASSWORD, BaseAPITestCase, make_neo, make_user


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


class AccountTests(BaseAPITestCase):
    """마이페이지 API (10-28) ─ 문서 04, 4.6절"""

    def setUp(self):
        super().setUp()
        self.user = make_user("mine")
        self.login_as(self.user)

    def test_me_includes_date_joined_and_default_preferences(self):
        user = self.client.get("/api/auth/me/").json()["user"]
        self.assertIn("date_joined", user)
        # 설정 행이 없어도 기본값 ─ 읽기만으로 행을 만들지 않는다
        self.assertEqual(user["preferences"], {"distance_unit": "km", "dashboard_sort": "distance", "hazard_only": False})
        self.assertFalse(UserPreference.objects.filter(user=self.user).exists())

    def test_account_summary_counts_watchlist(self):
        from apps.watchlist.models import NeoWatchlist

        NeoWatchlist.objects.create(user=self.user, neo=make_neo("71"))
        body = self.client.get("/api/account/").json()
        self.assertEqual(body["watchlist_counts"], {"neo": 1, "exoplanet": 0})
        self.assertEqual(body["user"]["username"], "mine")

    def test_patch_preferences_partially(self):
        res = self.client.patch("/api/account/preferences/", {"distance_unit": "au"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"distance_unit": "au", "dashboard_sort": "distance", "hazard_only": False})
        self.client.patch("/api/account/preferences/", {"hazard_only": True}, format="json")
        # 앞에서 바꾼 au는 그대로 ─ 안 보낸 칸은 안 건드린다. /me/에도 바로 반영
        self.assertEqual(self.client.get("/api/auth/me/").json()["user"]["preferences"], {"distance_unit": "au", "dashboard_sort": "distance", "hazard_only": True})

    def test_invalid_preference_value_is_field_error(self):
        err = self.client.patch("/api/account/preferences/", {"dashboard_sort": "random"}, format="json").json()["error"]
        self.assertEqual(err["code"], "VALIDATION_ERROR")
        self.assertIn("dashboard_sort", err["fields"])

    def test_change_email_requires_password_and_unique(self):
        make_user("other", email="taken@example.com")
        wrong = self.client.patch("/api/account/email/", {"email": "new@example.com", "password": "wrong-pass-1"}, format="json")
        self.assertIn("password", wrong.json()["error"]["fields"])
        dup = self.client.patch("/api/account/email/", {"email": "taken@example.com", "password": PASSWORD}, format="json")
        self.assertIn("email", dup.json()["error"]["fields"])
        ok = self.client.patch("/api/account/email/", {"email": "new@example.com", "password": PASSWORD}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["user"]["email"], "new@example.com")

    def test_change_password_keeps_this_session_and_ends_others(self):
        from rest_framework.test import APIClient

        other_device = APIClient()
        other_device.force_login(self.user)
        new = "Nebula-test-5678"
        res = self.client.post(
            "/api/account/password/",
            {"current_password": PASSWORD, "new_password": new, "new_password_confirm": new},
            format="json",
        )
        self.assertEqual(res.status_code, 204)
        self.assertTrue(self.client.get("/api/auth/me/").json()["is_authenticated"])  # 이 기기는 유지
        self.assertFalse(other_device.get("/api/auth/me/").json()["is_authenticated"])  # 다른 기기는 로그아웃
        self.client.logout()
        self.assertEqual(self.client.post("/api/auth/login/", {"username": "mine", "password": new}, format="json").status_code, 200)

    def test_change_password_errors(self):
        cases = [
            ({"current_password": "wrong-pass-1", "new_password": "Nebula-test-5678", "new_password_confirm": "Nebula-test-5678"}, "current_password"),
            ({"current_password": PASSWORD, "new_password": "Nebula-test-5678", "new_password_confirm": "other-5678"}, "new_password_confirm"),
            ({"current_password": PASSWORD, "new_password": "12345678", "new_password_confirm": "12345678"}, "new_password"),  # 숫자만·흔함
            ({"current_password": PASSWORD, "new_password": PASSWORD, "new_password_confirm": PASSWORD}, "new_password"),  # 지금과 같음
        ]
        for body, field in cases:
            with self.subTest(field=field):
                err = self.client.post("/api/account/password/", body, format="json").json()["error"]
                self.assertIn(field, err["fields"])

    def test_delete_account_cascades_and_logs_out(self):
        from apps.watchlist.models import NeoWatchlist

        NeoWatchlist.objects.create(user=self.user, neo=make_neo("72"))
        self.client.patch("/api/account/preferences/", {"distance_unit": "au"}, format="json")
        wrong = self.client.delete("/api/account/", {"password": "wrong-pass-1"}, format="json")
        self.assertEqual(wrong.status_code, 400)
        self.assertTrue(User.objects.filter(username="mine").exists())
        res = self.client.delete("/api/account/", {"password": PASSWORD}, format="json")
        self.assertEqual(res.status_code, 204)
        self.assertFalse(User.objects.filter(username="mine").exists())
        self.assertFalse(NeoWatchlist.objects.exists())
        self.assertFalse(UserPreference.objects.exists())
        self.assertFalse(self.client.get("/api/auth/me/").json()["is_authenticated"])

    def test_password_guessing_is_limited(self):
        for _ in range(10):
            self.client.delete("/api/account/", {"password": "wrong-pass-1"}, format="json")
        self.assertEqual(self.client.delete("/api/account/", {"password": "wrong-pass-1"}, format="json").status_code, 429)
        self.assertEqual(self.client.get("/api/account/").status_code, 200)  # 조회는 안 센다

    def test_account_api_requires_login(self):
        self.client.logout()
        for method, url in [("get", "/api/account/"), ("patch", "/api/account/preferences/"), ("post", "/api/account/password/")]:
            with self.subTest(url=url):
                self.assertEqual(getattr(self.client, method)(url, {}, format="json").status_code, 401)


class AvatarTests(BaseAPITestCase):
    """프로필 사진 (10-28) ─ 문서 04, 4.6절. 이미지는 테스트 안에서 Pillow로 만든다"""

    URL = "/api/account/avatar/"

    def setUp(self):
        super().setUp()
        self.user = make_user("pic")
        self.login_as(self.user)

    @staticmethod
    def _image(fmt="PNG", size=(400, 300), name=None, exif=None):
        from io import BytesIO

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        buf = BytesIO()
        img = Image.new("RGB", size, (200, 80, 40))
        img.save(buf, format=fmt, **({"exif": exif} if exif is not None else {}))
        return SimpleUploadedFile(name or f"me.{fmt.lower()}", buf.getvalue(), content_type=f"image/{fmt.lower()}")

    def _put(self, file):
        return self.client.put(self.URL, {"avatar": file}, format="multipart")

    def test_upload_makes_256_webp_and_url(self):
        from io import BytesIO

        from PIL import Image

        self.assertIsNone(self.client.get("/api/auth/me/").json()["user"]["avatar_url"])
        res = self._put(self._image(size=(400, 300)))  # 가로로 긴 사진 → 가운데 정사각형
        self.assertEqual(res.status_code, 200)
        url = res.json()["user"]["avatar_url"]
        self.assertTrue(url.startswith(self.URL + "?v="))
        self.assertEqual(self.client.get("/api/auth/me/").json()["user"]["avatar_url"], url)
        got = self.client.get(self.URL)
        self.assertEqual(got["Content-Type"], "image/webp")
        img = Image.open(BytesIO(got.content))
        self.assertEqual((img.format, img.size), ("WEBP", (256, 256)))

    def test_metadata_like_camera_info_is_removed(self):
        from io import BytesIO

        from PIL import Image

        exif = Image.Exif()
        exif[0x0110] = "SecretPhone 15"  # Model ─ 폰 사진의 GPS 같은 메타데이터 대신 쓰는 표본
        self._put(self._image(fmt="JPEG", exif=exif.tobytes()))
        saved = Image.open(BytesIO(self.client.get(self.URL).content))
        self.assertEqual(len(saved.getexif()), 0)
        self.assertNotIn(b"SecretPhone", self.client.get(self.URL).content)

    def test_rejects_non_image_and_too_big_and_missing(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        fake = SimpleUploadedFile("evil.png", b"<script>alert(1)</script>", content_type="image/png")  # 이름표만 PNG
        self.assertIn("avatar", self._put(fake).json()["error"]["fields"])
        big = SimpleUploadedFile("big.png", b"0" * (2 * 1024 * 1024 + 1), content_type="image/png")
        self.assertIn("2MB", self._put(big).json()["error"]["fields"]["avatar"][0])
        self.assertIn("avatar", self.client.put(self.URL, {}, format="multipart").json()["error"]["fields"])
        self.assertIsNone(self.client.get("/api/auth/me/").json()["user"]["avatar_url"])  # 아무것도 저장 안 됨

    def test_rejects_decompression_bomb(self):
        # 단색이라 파일은 작지만 풀면 4,800만 픽셀 ─ 열기 전에 크기로 거절해야 한다
        res = self._put(self._image(size=(8000, 6000)))
        self.assertEqual(res.status_code, 400)
        self.assertIn("해상도", res.json()["error"]["fields"]["avatar"][0])

    def test_delete_back_to_initial(self):
        self._put(self._image())
        res = self.client.delete(self.URL)
        self.assertIsNone(res.json()["user"]["avatar_url"])
        self.assertEqual(self.client.get(self.URL).status_code, 404)

    def test_only_own_photo_and_login_required(self):
        from rest_framework.test import APIClient

        self._put(self._image())
        other = APIClient()
        other.force_login(make_user("someone"))
        self.assertEqual(other.get(self.URL).status_code, 404)  # 남의 사진은 꺼낼 방법이 없다(주소에 id가 없음)
        self.assertEqual(APIClient().get(self.URL).status_code, 401)

    def test_account_delete_removes_photo(self):
        from apps.accounts.models import UserAvatar

        self._put(self._image())
        self.client.delete("/api/account/", {"password": PASSWORD}, format="json")
        self.assertFalse(UserAvatar.objects.exists())
