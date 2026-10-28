"""
"다음 근접 접근" 카운트다운 데이터 ─ NASA/JPL Close Approach Data(CAD) API (10-28 M6, 05 문서 M7-2에서 당김)

왜 NeoWs(우리 DB)가 아니라 JPL CAD인가
- 우리 DB에는 "누군가 조회한 날짜"의 접근만 있다. 거기서 "다음 접근"을 고르면 아무도 안 연 날짜의 접근이 빠진다
  ─ 기기마다 DB가 달라서 같은 시각에도 기기마다 다른 답이 나온다(속을 수 있는 값).
- CAD는 "지금 이후, 거리 N 이하"를 그대로 물어볼 수 있다. NeoWs가 쓰는 원본(JPL 궤도 계산)과 같은 곳이고, 키가 필요 없다.
  비유: 동네 도서관(우리 DB)에 들어온 책만 뒤지지 말고, 국립중앙도서관(JPL) 목록에 바로 묻는 것.

기준 = 0.05 AU(약 19.5 LD) 안쪽 ─ JPL CNEOS 근접 접근 표의 기본값이자 PHA 판정 거리(대시보드 FAQ와 같은 숫자).
  1 LD 안쪽만 고르면 1년에 한두 번뿐이라(10-28 실측: 앞으로 365일 동안 1건) 대부분 빈 화면이 된다.

통신은 nasa_neo의 _request_json(같은 재시도 Session·같은 NasaUnavailable)을 그대로 쓴다 ─ 실패 처리 규칙이 하나로 유지된다.
DB에는 저장하지 않는다 ─ 몇 시간이면 바뀌는 "예보"라서 캐시(메모리)에만 둔다.

⚠️ 상세 링크용 ID는 JPL에 묻지 않는다 (10-28 브라우저 확인에서 바꿈)
   처음엔 SBDB API로 SPK-ID를 받았는데, 같은 2018 GS1이 SBDB는 50802451(새 번호), 우리 DB(NeoWs)는 3802428(옛 번호)였다.
   게다가 상세 API는 우리 DB에 없는 ID면 NASA를 안 부르고 404다 → 링크가 "찾는 항목이 없습니다"로 열렸다.
   → 뷰가 우리 DB에서 이름(JPL fullname = NeoWs name, 같은 모양)으로 찾고, 없으면 화면이 그날 대시보드로 보낸다.
"""

import logging
from datetime import datetime, timedelta, timezone as dt_tz
from decimal import Decimal

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from apps.astronomy.services.nasa_neo import NasaUnavailable, _request_json

logger = logging.getLogger(__name__)

# 주소 앞부분은 settings.JPL_API_BASE ─ E2E에선 닿지 않는 주소로 바꿔 실제 JPL을 부르지 않는다 (playwright.config.ts)
CAD_PATH = "/cad.api"
SOURCE_NAME = "NASA/JPL SBDB Close Approach Data API"

MAX_DISTANCE_AU = Decimal("0.05")
WINDOW_DAYS = 60     # 0.05 AU 안쪽은 60일에 약 30건(10-28 실측) → 비는 일은 사실상 없지만, 비면 빈 상태로
FETCH_LIMIT = 20     # 한 번에 앞으로 20건 받아 두고, 지나간 것은 버리며 쓴다

_UPCOMING_KEY = "jpl_cad:upcoming"
_UPCOMING_SECONDS_DELTA = timedelta(hours=6)   # 예보는 몇 시간 단위로 다시 계산된다 ─ 6시간마다 새로
_FAIL_KEY = "jpl_cad:failed"
_FAIL_SECONDS = 60                 # 실패하면 1분 동안은 다시 두드리지 않는다 (요청마다 8초씩 기다리게 하지 않게)

# JPL 시각은 TDB(태양계 역학시) ─ UTC보다 69.184초 빠르다 (TT−UTC = 32.184 + 윤초 37, 2017년 이후 그대로).
# 카운트다운이 초 단위라 빼 준다. (NeoWs 접근 시각은 분 단위라 기존 코드는 그대로 둠)
_TDB_MINUS_UTC = timedelta(seconds=69.184)
_JD_UNIX_EPOCH = 2440587.5   # 1970-01-01 00:00의 율리우스일(JD)


# ═══════════════════════════════════════════════════════════════════
# 응답 한 줄 → dict
# ═══════════════════════════════════════════════════════════════════
def _jd_to_utc(jd_str):
    """JD(TDB) "2461344.607871972" → UTC datetime. cd("2026-Oct-31 02:35")는 분까지만이라 jd를 쓴다"""
    seconds = (float(jd_str) - _JD_UNIX_EPOCH) * 86400
    return datetime.fromtimestamp(seconds, tz=dt_tz.utc) - _TDB_MINUS_UTC


def _sigma_minutes(text):
    """
    시각 오차 t_sigma_f → 분.  "< 00:01" → 0, "01:00" → 60, "2_19:21" → 4041(2일 19시간 21분), 없으면 None
    궤도가 덜 정해진 천체는 몇 시간~며칠씩 틀릴 수 있다 ─ 초 단위 카운트다운 옆에 꼭 같이 보여 줄 값.
    """
    if not text:
        return None
    text = text.strip()
    if text.startswith("<"):
        return 0
    try:
        days, _, hm = text.rpartition("_")
        hours, minutes = hm.split(":")
        return int(days or 0) * 1440 + int(hours) * 60 + int(minutes)
    except ValueError:
        return None


def _to_decimal_or_none(value):
    return Decimal(value) if value not in (None, "") else None


def _parse_rows(payload):
    fields = payload.get("fields") or []
    rows = []
    for values in payload.get("data") or []:
        r = dict(zip(fields, values))
        rows.append({
            "designation": r["des"],
            "name": (r.get("fullname") or r["des"]).strip(),   # "       (2025 UK9)" ─ 앞 공백은 JPL 표 정렬용
            "approach_at": _jd_to_utc(r["jd"]),
            "time_sigma_minutes": _sigma_minutes(r.get("t_sigma_f")),
            "dist_au": Decimal(r["dist"]),
            "dist_min_au": _to_decimal_or_none(r.get("dist_min")),
            "dist_max_au": _to_decimal_or_none(r.get("dist_max")),
            "velocity_km_s": _to_decimal_or_none(r.get("v_rel")),
            "absolute_magnitude_h": _to_decimal_or_none(r.get("h")),
        })
    return rows


# ═══════════════════════════════════════════════════════════════════
# 통신 (+ 캐시)
# ═══════════════════════════════════════════════════════════════════
def _fetch_upcoming():
    payload = _request_json(settings.JPL_API_BASE + CAD_PATH, {
        "date-min": "now",
        "date-max": f"+{WINDOW_DAYS}",
        "dist-max": str(MAX_DISTANCE_AU),
        "sort": "date",
        "fullname": "true",
        "limit": FETCH_LIMIT,
    })
    try:
        return _parse_rows(payload)
    except (KeyError, ValueError, ArithmeticError):
        # 응답 모양이 바뀐 것 ─ 우리 버그와 구분하려고 종류만 남긴다 (값·URL은 남기지 않는다)
        raise NasaUnavailable("CAD 응답 형식이 예상과 다름") from None


def get_next_approach():
    """
    지금 이후 가장 먼저 오는 0.05 AU 안쪽 지구 접근 1건과 받은 시각을 돌려준다 → (row 또는 None, fetched_at)

    - 받아 둔 목록에 아직 안 지난 접근이 있으면 그걸 쓴다 (JPL 안 부름)
    - 목록이 없거나 6시간이 지났거나, 받아 둔 게 전부 지나갔으면 새로 받는다
    - 새로 받기 실패: 받아 둔 목록에 안 지난 게 남아 있으면 그걸로, 없으면 NasaUnavailable (뷰가 503)
    """
    now = timezone.now()
    saved = cache.get(_UPCOMING_KEY)   # {"rows": [...], "fetched_at": datetime} ─ 만료 없이 두고 나이는 직접 잰다(실패 때 예전 목록을 쓰려고)
    usable = [r for r in saved["rows"] if r["approach_at"] > now] if saved else []
    need_fetch = (
        saved is None
        or now - saved["fetched_at"] > _UPCOMING_SECONDS_DELTA
        or (saved["rows"] and not usable)   # 받아 둔 게 전부 지나감. 처음부터 0건이었으면 6시간 동안 그대로 "없음"
    )

    if need_fetch and not cache.get(_FAIL_KEY):
        try:
            rows = _fetch_upcoming()
            saved = {"rows": rows, "fetched_at": now}
            cache.set(_UPCOMING_KEY, saved, None)
            usable = [r for r in rows if r["approach_at"] > now]
            need_fetch = False
        except NasaUnavailable as exc:
            logger.warning("[jpl_cad] CAD 실패(%s)", exc)
            cache.set(_FAIL_KEY, True, _FAIL_SECONDS)

    if need_fetch and not usable:
        # 새로 못 받았고 남은 것도 없다 ─ "없음"이라고 말하면 거짓말이 된다
        raise NasaUnavailable("CAD 갱신 실패, 남은 예보 없음")

    return (usable[0] if usable else None), saved["fetched_at"]
