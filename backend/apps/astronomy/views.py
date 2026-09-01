from datetime import datetime

from django.utils import timezone

from config.exception_handler import InvalidDate, UpstreamError
from .models import NeoFetchLog
from .services.nasa_neo import fetch_feed


def _parse_query_date(date_str):
    """
    querystring date parameter를 검증하고 date 객체로 바꾼다.
    값이 없으면 오늘 날짜를 기본값으로 쓴다. (04_api_specification.md 5.1절 기본값 규칙)
    
    형식이 틀리면(예: "2026/08/21") InvalidDate를 던진다.
    exception_handler.py가 이걸 받아서 자동으로
    {"error": {"code": "INVALID_DATE", ...}} 봉투로 포장해준다.
    """
    if not date_str:
        return timezone.localdate()
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise InvalidDate()
    
    
def _ensure_date_cached(target_date):
    """
    neo_fetch_log에 이 날짜 기록이 있는지 확인하고, 없다면 NASA에서 가져온다.
    
    비유: 편의점 발주 장부를 먼저 펼쳐본다.
    '오늘 이 물품을 발주 넣었다'는 기록이 있으면 선반(DB)을 확인만 하고,
    기록이 없으면 그때 발주(NASA 호출)를 넣는다.
    element_count가 0이었던 날도 '기록 있음'으로 걸리기 때문에,
    "아직 수집 안 함"과 "수집은 했으나 0건(수집할 데이터가 없음)"이 섞이지 않는다.
    (02_database_design.md 3.7절 — neo_fetch_log를 만든 이유)
    
    반환값: is_cached: bool, fetched_at: datetime
    """    
    log = NeoFetchLog.objects.filter(fetch_date=target_date).first()
    
    if log is not None:
        return True, log.fetched_at
    
    # 캐시 미스 — 여기서만 NASA를 부른다.
    try:
        fetch_feed(target_date.strftime("%Y-%m-%d"))
    except Exception as exc:
        # requests 라이브러리가 던지는 구체적인 예외를(ConnectionError, HTTPError 등)
        # views가 일일이 알 필요는 없다.
        # "NASA 쪽에 문제가 있었다"는 사실 하나로 뭉뚱그려 UpstreamError로 올린다.
        raise UpstreamError() from exc
    
    # fetch_feed가 방금 neo_fetch_log에 기록을 남겼으므로,
    # 이 시점의 "지금"이 곧 fetched_at이다.
    return False, timezone.now()    
