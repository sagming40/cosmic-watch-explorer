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


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import CloseApproach
from .serializers import NeoApproachSerializer
from .units import km_to_lunar_distance

# sort 파라미터 → 실제 정렬 기준 컬럼 매핑
# 비유: "거리 순", "속도 순", "크기 순" 정렬 버튼을 누르면 
# 주방(ORM)이 읽을 수 있는 실제 컬럼명("miss_distance_km")으로 바꿔주는 번역표
SORT_FIELD_MAP = {
    "distance": "miss_distance_km",
    "velocity": "-velocity_km_s",    # 빠른 순 = 내림차순이 자연스러움
    "size": "-neo__diameter_max_m",
}   


class NeoDashboardView(APIView):
    """
    GET /api/neo — 문서 04, 5.1절 대시보드.
    """  
    throttle_scope = "neo_fetch"
    # ⚠️ throttle_classes는 여기 등록하지 않는다.
    #
    # settings.py의 DEFAULT_THROTTLE_CLASSES가 전역으로 ScopedRateThrottle을
    # 지정해뒀기 때문에, throttle_scope만 있어도 DRF가 dispatch() 단계에서
    # 캐시 히트/미스 상관없이 "요청마다 자동으로" 검사를 실행해버린다.
    # 셀프 스로틀링 검증 — 실제로 이 함정에 걸렸다 (캐시 히트 요청 → 429)
    
    def get_throttles(self):
        # dispatch()의 자동 검사를 무력화한다.
        # 빈 목록을 주면 자동으로 검사할 throttle이 없어져, 
        # initial() 단계에서 아무 일도 일어나지 않는다.
        # 실제 검사는 get() 안, cache miss가 확정된 순간에 직접한다.
        return []
    
    def get(self, request):
        target_date = _parse_query_date(request.query_params.get("date"))
        sort = request.query_params.get("sort", "distance")
        body = request.query_params.get("body", "Earth")
        
        # ① 캐시 판정 먼저 — 여기서 미스가 확정되면 그 즉시 throttle을 직접 체크한다.
        log = NeoFetchLog.objects.filter(fetch_date=target_date).first()
        if log is None:
            # ⭐ 실제 self throttling — 직접 인스턴스를 만들어 검사한다.
            # get_throttles()가 [](빈 목록)을 주는 한, 이 검사가 유일한 검사이다.
            throttle = ScopedRateThrottle()
            if not throttle.allow_request(request, self):
                # DRF 자동 검사와 동일한 방식으로 429 throw/
                # throttle.wait() = "몇 초 후에 다시 시도"하라는 안내 시간
                self.throttled(request, throttle.wait())
            
            try:
                fetch_feed(target_date.strftime("%Y-%m-%d"))
            except Exception as exc:
                raise UpstreamError() from exc
            
            is_cached = False
            fetched_at = timezone.now()
        else:
            is_cached = True
            fetched_at = log.fetched_at
        
        # ② 목록 조회 — 02_database_design.md 8.2절 쿼리 패턴    
        order_field = SORT_FIELD_MAP.get(sort, "miss_distance_km")
        queryset = (
            CloseApproach.objects
            .filter(approach_date=target_date, orbiting_body=body)
            .select_related("neo")
            .order_by(order_field)
        )        
        
        # list() 한 번에 메모리로 끌어온다.
        # 이 줄 이후로는 DB를 다시 왕복하지 않고, 아래 요약 계산도 전부
        # Python list 위에서만 이루어진다.
        # 설계 결정 ① — 요약과 목록이 같은 데이터에서 나와야 함
        approaches = list(queryset)
        
        # ③ 요약 계산 — 별도 query 없이 방금 가져온 list를 순회한다.
        total_count = len(approaches)
        hazardous_count = sum(1 for ca in approaches if ca.neo.is_hazardous)
        
        if approaches:
            closest = min(approaches, key=lambda ca: ca.miss_distance_km)
            closest_km = closest.miss_distance_km
            closest_ld = km_to_lunar_distance(closest_km) 
        else:
            # 그날 접근이 0건 이었던 경우 — NULL 그대로 유지.
            closest_km = None
            closest_ld = None
            
        return Response({
            "date": target_date.isoformat(),
            "summary": {
                "total_count": total_count,
                "hazardous_count": hazardous_count,
                "closest_ld": closest_ld,
                "closest_km": closest_km,
            },
            "cache": {
                "is_cached": is_cached,
                "fetched_at": fetched_at,
            },
            "results": NeoApproachSerializer(approaches, many=True).data,
        })        
