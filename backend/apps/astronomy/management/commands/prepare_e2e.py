"""
python manage.py prepare_e2e ─ 프론트 E2E(Playwright) 테스트용 DB를 "매번 같은 상태"로 만든다. (10-28 M6)

하는 일: ① E2E 전용 DB가 없으면 만든다 ② migrate ③ 전부 비운다(flush) ④ 정해진 데이터를 심는다
     → 테스트가 볼 소행성·외계행성·계정이 매번 똑같아서, 결과가 NASA나 내 개발 DB 상태에 따라 흔들리지 않는다.

⚠️ 안전장치: DB 이름이 "_e2e"로 끝나지 않으면 아무것도 하지 않고 멈춘다.
   flush는 DB를 통째로 비운다 ─ 개발 DB(cosmic_watch)에 실수로 돌리면 수집한 데이터·계정이 다 날아간다.
   비유: 리허설 무대에서만 소품을 싹 치우는 것. 본 무대 이름표가 붙어 있으면 손대지 않는다.

실행은 Playwright가 한다(frontend/playwright.config.ts의 webServer). 손으로 돌릴 땐:
   DB_NAME=cosmic_watch_e2e venv/Scripts/python manage.py prepare_e2e
NASA는 부르지 않는다 ─ 화면이 볼 날짜의 데이터를 전부 미리 심는다(오늘 날짜 포함).
"""

from datetime import datetime, timedelta, timezone as dt_tz
from decimal import Decimal

import MySQLdb
from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.astronomy.models import CloseApproach, Exoplanet, HostStar, Neo, NeoFetchLog, OrbitalData

# ─── E2E가 쓰는 고정값 ─ frontend/e2e/fixtures.ts와 같아야 한다 ─────────────────
E2E_USERNAME = "e2e_user"
E2E_PASSWORD = "Orbit-e2e-2031"  # E2E 전용 DB에만 존재하는 테스트 계정 (실행이 끝나도 그 DB 안에만 있다)
E2E_DATE = "2031-03-15"          # 대시보드 테스트 날짜 ─ 소행성 3개(위험 1, 달보다 가까움 1)


class Command(BaseCommand):
    help = "프론트 E2E 테스트용 DB를 비우고 정해진 데이터를 심는다 (DB 이름이 _e2e로 끝날 때만)"
    # 명령 시작 전 시스템 점검이 DB에 먼저 접속한다 → DB가 아직 없으면 거기서 "Unknown database"로 죽는다.
    # 이 명령은 DB를 만드는 게 일이라 점검을 건너뛴다(아래 migrate가 DB를 만든 뒤 점검을 다시 돌린다)
    requires_system_checks = []

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        name = db["NAME"] or ""
        if not name.endswith("_e2e"):
            raise CommandError(f"DB 이름 '{name}'은(는) _e2e로 끝나지 않습니다. 개발 DB를 비우지 않도록 멈춥니다. (DB_NAME=cosmic_watch_e2e 로 실행)")

        self._create_database(db, name)
        call_command("migrate", interactive=False, verbosity=0)
        call_command("flush", interactive=False, verbosity=0)
        self._seed()
        self.stdout.write(self.style.SUCCESS(f"E2E DB 준비 완료: {name}"))

    def _create_database(self, db, name):
        # Django는 "DB가 이미 있다"는 전제로 접속한다 → 없으면 MySQL 서버에 직접 붙어서 만든다
        conn = MySQLdb.connect(host=db["HOST"] or "localhost", user=db["USER"], password=db["PASSWORD"], port=int(db["PORT"] or 3306))
        try:
            conn.cursor().execute(f"CREATE DATABASE IF NOT EXISTS `{name}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        finally:
            conn.close()

    def _seed(self):
        User.objects.create_user(username=E2E_USERNAME, email="e2e@example.com", password=E2E_PASSWORD)

        # ─── 소행성 ─ 전부 궤도 정보까지 심어 둔다(상세를 열어도 NASA Lookup을 안 부른다) ───
        neos = [
            # nasa_id, 이름, 위험(PHA), 최소·최대 지름(m), E2E_DATE 접근 거리(km)
            ("9000001", "(2031 E2E-A)", True, 300, 670, Decimal("192200")),     # 0.5 LD ─ 달보다 가까움
            ("9000002", "(2031 E2E-B)", False, 40, 90, Decimal("4612800")),     # 12 LD
            ("9000003", "(2031 E2E-C)", False, 120, 260, Decimal("30752000")),  # 80 LD
        ]
        for nasa_id, name, pha, dmin, dmax, km in neos:
            neo = Neo.objects.create(
                nasa_id=nasa_id, name=name, is_hazardous=pha,
                diameter_min_m=Decimal(dmin), diameter_max_m=Decimal(dmax),
            )
            OrbitalData.objects.create(neo=neo, eccentricity=Decimal("0.21"), semi_major_axis_au=Decimal("1.08"))
            _approach(neo, E2E_DATE, km)
        NeoFetchLog.objects.create(fetch_date=E2E_DATE, element_count=len(neos))

        # 오늘 날짜 ─ 로그인 직후 대시보드가 오늘을 연다. 비어 있으면 NASA를 부르므로 1건 심어 둔다.
        # 서버의 "오늘"은 UTC(TIME_ZONE), 브라우저의 "오늘"은 한국 시각 ─ 오전 0~9시엔 날짜가 다르다 → 둘 다 심는다
        utc_today = timezone.localdate()
        kst_today = (timezone.now() + timedelta(hours=9)).date()
        for day in sorted({utc_today, kst_today}):
            _approach(Neo.objects.get(nasa_id="9000002"), day.isoformat(), Decimal("7688000"))  # 20 LD
            NeoFetchLog.objects.create(fetch_date=day, element_count=1)

        # ─── 외계행성 ─ "반지름 0.8~1.5 · 100광년 이하" 검색에 정확히 2개가 걸리게 ───
        planets = [
            # 이름, 반지름(지구=1), 모항성 거리(pc) ─ 100광년 ≈ 30.66 pc
            ("E2E-Terra b", Decimal("1.05"), Decimal("12.0")),   # 걸림
            ("E2E-Terra c", Decimal("1.40"), Decimal("12.0")),   # 걸림 ─ Terra b와 같은 모항성(형제 행성)
            ("E2E-Giant b", Decimal("11.20"), Decimal("12.0")),  # 반지름이 커서 빠짐
            ("E2E-Far b", Decimal("1.10"), Decimal("80.0")),     # 약 261광년이라 빠짐
            ("E2E-Unknown b", None, Decimal("15.0")),            # 반지름 미측정 ─ 범위 조건에서 빠짐
        ]
        for name, radius, pc in planets:
            star, _ = HostStar.objects.get_or_create(name=name.rsplit(" ", 1)[0], defaults={"distance_pc": pc})
            Exoplanet.objects.create(host_star=star, planet_name=name, radius_earth=radius, discovery_year=2030)


def _approach(neo, date_str, km):
    y, m, d = map(int, date_str.split("-"))
    CloseApproach.objects.create(
        neo=neo,
        approach_date=date_str,
        approach_datetime_utc=datetime(y, m, d, 12, 0, tzinfo=dt_tz.utc) + timedelta(minutes=int(neo.nasa_id[-1])),
        velocity_km_s=Decimal("14.2"),
        velocity_km_h=Decimal("51120"),
        miss_distance_km=km,
        miss_distance_au=km / Decimal("149597870.7"),
        orbiting_body="Earth",
    )
