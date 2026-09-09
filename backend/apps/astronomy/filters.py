"""
Exoplanet 다중 조건 검색 logic

문서 04 ─ 6.1절 qurey parameter 15개를 실제 ORM 조건으로 바꾸는 역할
view는 "filtering된 결과를 달라고만 하고 조건을 어떤 식으로 조립하는지는
filters.py가 맡는다. 

services/ 디렉터리를 따로 둔 것과 같은 분리원칙 
─ 문서 04, 9.1절 "홀 직원은 주문만 받고 재료 조달은 주방이 한다."
"""

from rest_framework import serializers
from django.db.models import F

from .models import Exoplanet
from .units import light_year_to_parsec
from .services.nasa_neo import _to_decimal
# ▲ 새로 만들지 않는다. exoplanet_archive.py가 
# 이미 _to_decimal을 이러한 형태로 사용하고 있다.
# float을 Decimal 필드 근처에 보내지 않는다는 원칙을 그대로 지킨다.


class ExoplanetSearchParams(serializers.Serializer):
    """
    querystring을 검증하고 형변환까지 끝내는 '문지기'
    
    ⚠️ Exoplanet을 저장하거나 응답으로 내보내는 serializer가 아니다.
    입력값이 통과해야 하는 검문소 역할을 수행한다.
    
    문서 04 ─ 6.1절 오류 예시("검색 조건을 확인해주세요." + fields)가
    바로 이 class가 실패했을 때 나오는 응답이다.
    is_valid(raise_exception=True) 한 줄이면 exception_handler.py의
    dict 처리 분기가 알아서 fields로 포장해준다.
    ─ 지난 세션에 만든 장치가 그대로 재사용되는 것.
    """
    name = serializers.CharField(required=False, allow_blank=True)
    host = serializers.CharField(required=False, allow_blank=True)
    
    radius_min = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    radius_max = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    mass_min = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    mass_max = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    temp_min = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    temp_max = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    distance_min_ly = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    distance_max_ly = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    period_min = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    period_max = serializers.FloatField(required=False, error_messages={"invalid": "숫자를 입력해 주세요."})
    
    year_min = serializers.IntegerField(required=False, error_messages={"invalid": "정수를 입력해 주세요."})
    year_max = serializers.IntegerField(required=False, error_messages={"invalid": "정수를 입력해 주세요."})
    
    method = serializers.CharField(required=False, allow_blank=True)
    sort = serializers.CharField(required=False, allow_blank=True)
    
    
# Query Parameter 이름 → ORM Lookup String
# distance_min_ly/max_ly는 단위 변환이 끼기 때문에 이 표에 넣지 않고 아래에서 따로 처리한다.
RANGE_LOOKUPS = {
    "radius_min": "radius_earth__gte",
    "radius_max": "radius_earth__lte",
    "mass_min": "mass_earth__gte",
    "mass_max": "mass_earth__lte",
    "temp_min": "equilibrium_temp_k__gte",
    "temp_max": "equilibrium_temp_k__lte",
    "period_min": "orbital_period_days__gte",
    "period_max": "orbital_period_days__lte",
    "year_min": "discovery_year__gte",
    "year_max": "discovery_year__lte",
}

# sort parameter → 실제 column. NEO의 SORT_FIELD_MAP과 같은 패턴이지만
# 값이 String이 아니라 F() 표현식인 이유는 아래 _resolve_sort() 설명 참조  
SORT_FIELD_MAP = {
    "name": "planet_name",
    "distance": "host_star__distance_pc",
    "radius": "radius_earth",
    "mass": "mass_earth",
    "year": "discovery_year",
}


def _resolve_sort(sort_param):
    """
    'distance' 또는 '-distance' → order_by()에 넣을 표현식 리스트.
    
    NULL은 항상 뒤로 보낸다(nulls_last=True) ─ 오름차순/내림차순 상관없이
    distance_pc/radius_earth/mass_earth 전부 NULL 가능성이 있는 column이라
    기본 '-'(내림차순) 정렬이 recent_approaches 처럼 "값이 없는 행"을 맨 위로 올리는 걸 방지한다.
    → radius_earth IS NULL 1,612건 ─ M1 에서 이미 검증 완료
    
    알 수 없는 sort 값은 조용히 기본 정렬로 대체한다.
    ─ sort는 6.1의 '검색 조건'이 아니라 화면 표시 순서 조작값이라,
    radius_min 같은 실제 검색 조건과 달리 400을 throw할 대상이 아니라고 판단했다.
    """  
    default = [F("planet_name").asc(nulls_last=True)]
    if not sort_param:
        return default
    
    descending = sort_param.startswith("-")
    key = sort_param[1:] if descending else sort_param
    field = SORT_FIELD_MAP.get(key)
    if field is None:
        return default
    
    expr = F(field)
    return [expr.desc(nulls_last=True)] if descending else [expr.asc(nulls_last=True)]


def build_exoplanet_queryset(query_params):
    """
    querystring으로 Exoplanet queryset을 조립한다.
    
    return: (queryset, applied_filters)
    applied_filters는 문서 04 ─ 6.1 설계 설정 ②용. 실제로 적용된 조건만 담아 되돌려준다. 
    ─ filter chip을 그리는 재료. sort는 검색 조건이 아니므로 담지 않는다.
    
    ⚠️ 검증 실패 시 이 함수는 ValidationError를 그대로 throw한다.
    view에서 따로 try/except 할 필요 없음 ─ exception_handler.py가 잡는다.
    """
    params = ExoplanetSearchParams(data=query_params)
    params.is_valid(raise_exception=True)
    data = params.validated_data
    # ↑ validated_data ─ 값이 없는 필드는 key 자체가 없다.
    #   required=False ─ 빠진 field는 dict에 나타나지 않는다. (None으로 채워지는 것이 아니다.)
    
    qs = Exoplanet.objects.select_related("host_star")
    applied = {}
    
    name = data.get("name")
    if name:
        qs = qs.filter(planet_name__icontains=name)
        applied["name"] = name
    
    host = data.get("host")
    if host:
        qs = qs.filter(host_star__name__icontains=host) 
        applied["host"] = host
        
    method = data.get("method")
    if method:
        # 요구사항 4.3 ─ 발견 방법은 "정확히 일치". name/host의 icontains와 다름.
        qs = qs.filter(discovery_method=method)
        applied["method"] = method
        
    # 순자 범위 10개 ─ 표를 순회하며 기계적으로 처리.
    # _to_decimal()을 거치는 이유: radius_earth 등은 DecimalField이고,
    # float를 그대로 넘기면 이 프로젝트가 지금까지 지켜온
    # "float을 Decimal Field 근처에 보내지 않는다"는 원칙이 깨진다.
    for key, lookup in RANGE_LOOKUPS.items():
        value = data.get(key)
        if value is not None:
            qs = qs.filter(**{lookup: _to_decimal(value)})
            applied[key] = value  # 응답엔 사람이 입력한 그대로(float) 보여준다.
    
    # distance(ly) ─ light_year_to_parsec()이 이미 Decimal을 반환하므로
    # _to_decimal()을 한 번 더 거칠 필요가 없다.
    distance_min_ly = data.get("distance_min_ly")
    if distance_min_ly is not None:
        qs = qs.filter(host_star__distance_pc__gte=light_year_to_parsec(distance_min_ly))   
        applied["distance_min_ly"] = distance_min_ly
    
    distance_max_ly = data.get("distance_max_ly")
    if distance_max_ly is not None:
        qs = qs.filter(host_star__distance_pc__lte=light_year_to_parsec(distance_max_ly))
        applied["distance_max_ly"] = distance_max_ly
    
    qs = qs.order_by(*_resolve_sort(data.get("sort")))
    
    return qs, applied                       
