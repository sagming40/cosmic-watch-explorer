from datetime import datetime

from django.utils import timezone
from django.core.cache import cache   # ⭐ 추가
from django.db.models import Count, Min, Max   # ⭐ 추가

from rest_framework import generics   # ⭐ 추가 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from config.exception_handler import InvalidDate, UpstreamError, ResourceNotFound
from config.pagination import CommonPagination   # ⭐ 추가

from .models import Neo, CloseApproach, NeoFetchLog, Exoplanet, HostStar  # ⭐ Exoplanet, HostStar 추가
from .serializers import (
    NeoApproachSerializer, NeoDetailSerializer, ApproachRowSerializer,  # ⭐ ApproachRowSerializer 추가
    ExoplanetRowSerializer, ExoplanetDetailSerializer, # ⭐ 추가
)  
from .services.nasa_neo import fetch_feed, fetch_neo_detail
from .units import km_to_lunar_distance, parsec_to_light_year  # ⭐ parsec_to_light_year 추가
from .filters import build_exoplanet_queryset  # ⭐ 추가


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


class NeoDetailView(APIView):
    """
    GET /api/neo/{nasa_id}/ ─ 문서 04, 5.2절 상세.

    ⚠️ 이 view도 조건부로 NASA를 호출한다.
    04_api_specification.md 420행 ─ "이 endpoint만 NASA API를 호출한다."는 문장은
    5.1절만 존재했을 때의 전제이다. 문서 정리 시 갱신 필요.
    """
    throttle_scope = "neo_detail_fetch"

    def get_throttles(self):
        # NeoDashboardView와 같은 이유 ─ orbital_data 캐시 미스가
        # 확정된 순간에만 직접 검사한다. dispatch()의 자동 검사는 꺼둔다.
        return []

    def get(self, request, nasa_id):
        # ① Neo 행 자체가 없으면 즉시 404. NASA는 호출하지 않는다.
        #   ─ 존재하지 않는 ID를 계속 두드려도 NASA로 나가지 않도록.
        #
        # select_related("orbital_data")를 미리 걸어두는 이유:
        # OneToOneField 관계는 값이 없어도 예외없이 None으로 채워진다. (LEFT JOIN 이기 때문)
        # 아래에서 getattr 없이 바로 neo.orbital_data로 확인 가능.
        neo = (
            Neo.objects
            .select_related("orbital_data")
            .filter(nasa_id=nasa_id)
            .first()
        )
        if neo is None:
            raise ResourceNotFound("해당 소행성을 찾을 수 없습니다.")

        # ② 궤도 정보가 비어 있으면(=이 소행성을 한 번도 Lookup 한 적 없음)
        #   그 시점에 처음으로 NASA를 호출한다. ─ cache miss가 확정된 순간 selh throttling
        #
        # →
        #
        # ⚠️ select_related("orbital_data")를 걸어놨어도 이 결과는 바뀌지 않는다.
        # select_related는 "쿼리를 한 번 더 왕복하지 않도록 미리 LEFT JOIN 해둔다"는 뜻일 뿐,
        # "관계가 비어 있어도 조용히 None을 준다"는 약속이 아니다.
        # 반대편(OneToOneField)이 비어 있으면 Django는 그 사실을 예외로 알려준다.
        # → NeoDetailSerializer.get_orbital_data에서 이미 썼던 것과 똑같은 패턴을
        #   여기서도 그대로 써야 한다. (같은 문제를 두 번째로 만난 것)
        orbital = getattr(neo, "orbital_data", None)
        if orbital is None:
            throttle = ScopedRateThrottle()
            if not throttle.allow_request(request, self):
                self.throttled(request, throttle.wait())

            try:
                neo, _, _ = fetch_neo_detail(nasa_id)
                # fetch_neo_detail이 돌려주는 neo로 통째로 교체한다.
                # Lookup에만 있는 designation 같은 field가 이 시점에 새로 채워지기 때문에,
                # ①에서 가져온 예전 neo를 계속 사용하면 갱신된 값을 놓친다.
                # 
                # 이 neo는 select_related가 걸리지 않은 '새 조회 결과'이다.
                # 아래에서 orbital_data에 접근하면 Django가 그 시점에 query를 한 번더 날린다.
                # ─ 목록이 아니라 객체 하나뿐인 상세 페이지라 N+1 걱정은 없다.
            except Exception as exc:
                raise UpstreamError() from exc
            # NASA Lookup이 404를 준 경우는 fetch_neo_detail 내부에서 이미 처리되어
            # 여기까지 예외없이 내려온다. ─ orbital_data가 None인 채로 응답된다.
            # ⭐ 값이 없으면 없는대로. 억지로 채우지 않는다.

        return Response(NeoDetailSerializer(neo).data)


class NeoApproachListView(generics.ListAPIView):
    """
    GET /api/neo/{nasa_id}/approaches/ ─ 문서 04, 5.3절 접근 기록 전체

    5.1/5.2와 다르게 NASA 호출을 하지 않는다. DB에 이미 저장된 CloseApproach를
    그대로 나열하고 페이지만 나누는 "순수 조회" 역할이기 때문에 Throttle도 필요없다.
    ─ Throttle은 항상 "NASA를 부르는 지점"에만 걸었다. → 해당 사항 없음 
    """
    serializer_class = ApproachRowSerializer
    # pagination_class는 settings.py에 DEFAULT_PAGINATION_CLASS로 이미 전역
    # 적용되어 있어 생략이 되어도 동작은 같다. 그래도 명시를 해두면,
    # "이 view는 pagination을 사용한다"는게 코드 단계에서 바로 확인 가능하다.
    pagination_class = CommonPagination

    def get_queryset(self):
        nasa_id = self.kwargs["nasa_id"]

        # ① 부모 Resource(Neo) 존재 여부를 먼저 확인한다.
        #   5.2와 같은 원칙 ─ "접근 기록 0건"과 "그런 소행성 자체가 없음"을 구분한다.
        #   확인을 하지 않으면 오타로 잘못된 ID를 입력해도 200 + []이 출력되어,
        #   사용자가 착각하게 된다 → "이 소행성은 접근 기록이 없구나"
        if not Neo.objects.filter(nasa_id=nasa_id).exists():
            raise ResourceNotFound("해당 소행성을 찾을 수 없습니다.")

        queryset = CloseApproach.objects.filter(neo__nasa_id=nasa_id)

        # ② body 필터 ─ 문서 5.3 기본값은 '(전체)'. 5.1의 기본값 'Earth'와 다르다.
        #   Earth를 default 값으로 걸면 지구가 아닌 접근들이 조용히 사라진다.
        #   확보한 분포가 필터 없이 그대로 정상 출력 되어야 함 
        #   ─ Earth 161 / Merc 114 / Venus 94 / Moon 3 / Mars 2
        body = self.request.query_params.get("body")
        if body:
            queryset = queryset.filter(orbiting_body=body)

        # ③ 과거 → 미래 시간순. '전체 기록'을 훑어보는 용도라 연대기처럼 읽히게 된다.
        #   NeoDetailView.recent_approaches의 '앞으로 다가올 순'과는 목적이 달라
        #   정렬 방향도 다르다 ─ "다음에 어떤 소행성이 다가오나" / "전체 역사"
        return queryset.order_by("approach_datetime_utc")


class ExoplanetListView(generics.ListAPIView):
    """
    GET /api/exoplanets/ ─ 문서 04, 6.1절 catalog 검색.
    cosmic-watch-explorer 프로젝트 Backend의 핵심 기능 ─ NASA 호출 없이 DB에 있는
    6,354건을 다중 조건으로 걸러 내는 순수 조회이므로 Throttle 대상이 아니다.
    NeoApproachListView와 같은 이유 ─ NASA를 부르는 지점에만 계량기를 단다.
    """ 
    serializer_class = ExoplanetRowSerializer
    pagination_class = CommonPagination
    
    def get_queryset(self):
        # build_exoplanet_quertset이 검증 실패 시 ValidationError를 그대로 throw
        # try/except를 사용하지 않는 이유 ─ filters.py 문서화 그대로,
        # exception_handler.py가 이미 dict detail을 fields로 포장해준다.
        queryset, applied = build_exoplanet_queryset(self.request.query_params)
        
        # list()가 응답을 조립할 때 쓸 수 있도록 self에 잡깐 달아둔다.
        # as_view()는 요청마다 새 인스턴스를 생성해주므로 다른 사용자 요청과 섞일 걱정은 없다.
        # ─ NEO 뷰들도 전부 이 위에서 동작해왔다.
        self.applied_filters = applied
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        CommonPagination이 만드는 5개 키(count/page/page_size/total_pages/results)에
        applied_filters 하나만 얹는다.
        
        CommonPagination 클래스 자체를 건드리지 않는 이유
        ─ 페이지네이션은 "몇 번째 페이지인지"민 알면 되는 부품이지, "무슨 조건으로 검색했는지" 까지는 알 필요가 없다.
        NeoApproachListView도 같은 CommonPagination을 사용하는데, 
        NeoApproachListView에는 applied_filters가 섞여 나가면 안된다.
        """  
        response = super().list(request, *args, **kwargs)
        response.data["applied_filters"] = self.applied_filters
        return response


class ExoplanetDetailView(APIView):
    """
    GET /api/exoplanets/{id}/ ─ 문서 04, 6.2절 상세.
    
    NASA를 호출하지 않는다 
    ─ Exoplanet 데이터는 최초 1회만 수집하면 추가 수집이 필요없는 데이터다.
    즉, NEO 처럼 "궤도정보가 없으면 그 때 가져온다" 같은 조건부 호출이 필요없다.
    
    select_related("host_star")를 사용하여 미리 JOIN해 둔 이유 
    ─ NeoDetailView가 orbital_data를 미리 당겨왔던 것과 같다.
    """ 
    def get(self, request, pk):
        exoplanet = (
            Exoplanet.objects
            .select_related("host_star")
            .filter(pk=pk)
            .first()
        )
        if exoplanet is None:
            raise ResourceNotFound("해당 외계행성을 찾을 수 없습니다.")
        
        return Response(ExoplanetDetailSerializer(exoplanet).data)

# meta 응답을 저장해두는 cache key. 이 String이 두 번째 등장하면 안된다.
# 상수로 한 곳에만 둔다. ─ LUNAR_DISTANCE_KM을 units.py 한 곳에만 둔 것과 같은 이유.
EXOPLANET_META_CACHE_KEY = "exoplanet_meta"
EXOPLANET_META_CACHE_TTL = 60 * 60  # 1시간 (문서 04 ─ 6.3절)


class ExoplanetMetaView(APIView):
    """
    GET /api/exoplanets/meta/ ─ 문서 04, 6.3절 필터 선택지.
    
    ⚠️ 명세와 다른 방법으로 변경한 이유
    
    원래 설계 ─ @cache_page(60 * 60) 데코레이터
    변경한 설계 ─ 직접 캐싱
    
    이유 세 가지:
    1) cache_page는 본래 HTMLView를 전제로 만들어져 DRF Response와 궁합이 미묘하다.
       ─ 렌더링 시점 문제로 우회 코드가 필요해진다.
    2) neo_fetch_log 함수를 만들 때 세운 원칙과 결이 같다.
       ─ 캐시 유/무 여부가 코드에서 눈으로 보여야 한다.
    3) cache.get() 한 줄이 곧 이 API가 어떤 역할인지를 보여주는 문서가 된다.
    
    참고: DRF ScopedRateThrottle이 요청 횟수를 세는 곳도 이것과 같은 Django 기본 캐시이다. (LocMemCache)
         서버를 재시작하면 이 cache도 같이 초기화 된다. ─ Self Throttling 검증에서 이미 마주쳤던 사실이다.
    """          
    def get(self, request):
        cached = cache.get(EXOPLANET_META_CACHE_KEY)
        if cached is not None:
            return Response(cached)
        
        data = self._build_meta()
        cache.set(EXOPLANET_META_CACHE_KEY, data, EXOPLANET_META_CACHE_TTL)
        return Response(data)
    
    def _build_meta(self):
        # ① 발견 방법별 개수 ─ NULL(미측정)은 드롭다운에 넣을 항목이 아니므로 제외.
        # 03_user_scenarios_and_uiux.md 필터 드롭다운용
        methods = (
            Exoplanet.objects
            .exclude(discovery_method__isnull=True)
            .values("discovery_method")
            .annotate(count=Count("id"))
            .order_by("-count")
        )      
        discovery_methods = [
            {"value": row["discovery_method"], "count": row["count"]}
            for row in methods
        ]
        
        # ② 입력 필드 min/max ─ Min()/Max()는 NULL 행을 자동으로 건너뛴다.
        # radius_earth IS NULL 1,612건이 있어도 이 집계엔 영향을 주지 않는다.
        radius = Exoplanet.objects.aggregate(min=Min("radius_earth"), max=Max("radius_earth"))
        mass = Exoplanet.objects.aggregate(min=Min("mass_earth"), max=Max("mass_earth"))
        year = Exoplanet.objects.aggregate(min=Min("discovery_year"), max=Max("discovery_year"))
        
        # distance_ly는 DB에 존재하지 않는 계산 컬럼이다. 
        # 저장 단위(pc)로 먼저 min/max를 구한 후 표시 단위(ly)로 변환한다.
        # 거리는 pc가 커질수록 ly도 커지는 단조 증가 관계이다.
        # 즉, "pc min(최솟값) → ly min(최솟값)"으로 순서가 뒤집히지 않는다.
        distance_pc_range = HostStar.objects.aggregate(
            min=Min("distance_pc"), max=Max("distance_pc")
        )
        
        return {
            "discovery_methods": discovery_methods,
            "ranges": {
                "radius_earth": {"min": radius["min"], "max": radius["max"]},
                "mass_earth": {"min": mass["min"], "max": mass["max"]},
                "discovery_year": {"min": year["min"], "max": year["max"]},
                "distance_ly": {
                    "min": parsec_to_light_year(distance_pc_range["min"]),
                    "max": parsec_to_light_year(distance_pc_range["max"]),
                },
            },
            "total_count": Exoplanet.objects.count(),
        } 
