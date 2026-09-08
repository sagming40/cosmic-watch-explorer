"""
Watchlist API 응답을 만드는 serializer. 문서 04 ─ 7절

astronomy의 serializer들과 시작점이 다르다.
astronomy ─ Neo/Exoplanet 자신에서 출발
watchlist ─ NeoWatchlist/ExoplanetWatchlist 인스턴스에서 출발

이유: saved_at(=created_at)이 Watchlist 테이블에만 존재하는 값이기 때문이다.
Neo나 Exoplanet 객체만 가지고는 언제 저장했는지를 알 수 있는 방법이 없다.
─ NeoApproachSerializer가 CloseApproach에서 시작해 obj.neo로 넘어 갔던 것과 정확히 같은 방향의 설계이다. 
"""

from django.utils import timezone

from rest_framework import serializers

from apps.astronomy.units import km_to_lunar_distance, parsec_to_light_year
# ↑ 앱 경계를 넘는 import. 순환 참조 걱정이 없는 이유
# ─ watchlist/models.py가 이미 'astronomy.Neo' 문자열로 astronomy를 참조하기 때문에
# 화살표가 watchlist → astronomy 한 방향으로만 나 있다. astronomy는 watchlist를 모른다.


class NextApproachSerializer(serializers.Serializer):
    """
    문서 04 ─ 7.2절 next_approach 블록. {datetime_utc, miss_distance_ld} 딱 2개뿐.
    
    astronomy의 ApproachDetailSerializer(7개 필드짜리 상세용)를 재사용하지 않는 이유
    ─ "다음 접근이 언제인지"만 보여주면 되는 요약용이라 필드 구성 자체가 다르다.
    HostStarMiniSerializer를 새로 만드는 것과 같은 이유의 결정.
    """
    datetime_utc = serializers.DateTimeField(source="approach_datetime_utc")
    miss_distance_ld = serializers.SerializerMethodField()
    
    def get_miss_distance_ld(self, obj):
        return km_to_lunar_distance(obj.miss_distance_km)


class NeoWatchlistRowSerializer(serializers.Serializer):
    """
    GET /api/watchlist/neo/ 목록 한 줄. 문서 04 ─ 7.2절.
    source는 NeoWatchlist 인스턴스 (Neo 자신이 아니다).
    """
    nasa_id = serializers.CharField(source="neo.nasa_id")
    name = serializers.CharField(source="neo.name")
    is_hazardous = serializers.BooleanField(source="neo.is_hazardous")
    diameter_min_m = serializers.DecimalField(
        source="neo.diameter_min_m", max_digits=14, decimal_places=4
    )    
    diameter_max_m = serializers.DecimalField(
        source="neo.diameter_max_m", max_digits=14, decimal_places=4
    )
    saved_at = serializers.DateTimeField(source="created_at")
    # ↑ 모델 필드명은 created_at이지만 응답 키는 saved_at ─ source로 이어붙인다.
    # Watchlist 전용 용어 ─ 사용자에게는 "만들어진 시각"보다 "저장한 시각"이 더 자연스럽다.
    
    next_approach = serializers.SerializerMethodField()
    
    def get_next_approach(self, obj):
        """
        오늘 이후 '지구' 접근 중 가장 빠른 것. 문서 04 ─ 7.2절 구현 힌트를 그대로 따른다.
        
        ⚠️ NeoDetailView.recent_approaches ─ 모든 천체를 기준으로 미래 접근 5건을 보여준다.
        → "정보 제공"용. orbiting_body와 무관하다.

        get_next_approach ─ 화면 6 "다음 접근 예정일"을 위한 것이라 기준을 '지구'로 좁힌다.
        → 같은 CloseApproach를 다른 질문으로 재사용하는 두 번째 사례

        approach_date(날짜만)를 사용하는 이유
        ─ NeoDetailView는 approach_datetime_utc(정밀 시각)로 정렬했지만,
        문서에 approach_date를 기준으로 명시해 두었다.
        
        같은 모델 안에 두 컬럼이 공존하는 이유 
        approach_date ─ NeoDashboardView가 하루 단위로 조회할 때.
        approach_date_utc ─ 정밀 정렬이 필요할 때
        """
        approach = (
            obj.neo.approaches
            .filter(approach_date__gte=timezone.localdate(), orbiting_body="Earth")
            .order_by("approach_date")
            .first()
        )
        if approach is None:
            return None
        return NextApproachSerializer(approach).data


class NeoWatchlistCreateSerializer(serializers.Serializer):
    """
    POST /api/watchlist/neo/ 요청 검증용 문지기. 응답 조립에는 사용하지 않는다.
    SignupSerializer/LoginSerializer와 같은 결의 패턴 ─ "들어온 값이 유효한 형식인지"만 확인한다.
    그 nasa_id가 실제로 존재하는가"는 view에서 별도로 확인한다. (형식 검증 / 존재 확인 분리).
    """
    nasa_id = serializers.CharField()


class HostStarMiniSerializer(serializers.Serializer):
    """
    문서 04 ─ 7.5절 host_star 요약. {name, distance_ly} 딱 2개 뿐

    astronomy.HostStarBriefSerializer ─ (3개 fields: name/distance_pc/distance_ly)를
    그대로 재사용하면 명세에는 존재하지 않는 distance_pc가 딸려 나간다.
    NextApproachSerializer를 astronomy 상세용과 별도로 만든 것과 같은 이유의 결정
    """    
    name = serializers.CharField()
    distance_ly = serializers.SerializerMethodField()

    def get_distance_ly(self, obj):
        return parsec_to_light_year(obj.distance_pc)


class ExoplanetWatchlistRowSerializer(serializers.Serializer):
    """
    GET /api/watchlist/exoplanets/ 목록 한 줄. 문서 04 ─ 7.5절.
    NeoWatchlistRowSerializer와 완전히 대칭 구조 ─ 소스가 ExoplanetWatchlist 인스턴스인 것도 같다.
    """
    id = serializers.IntegerField(source="exoplanet.id")
    planet_name = serializers.CharField(source="exoplanet.planet_name")
    radius_earth = serializers.DecimalField(
        source="exoplanet.radius_earth", max_digits=12, decimal_places=6, allow_null=True
    )
    saved_at = serializers.DateTimeField(source="created_at")
    host_star = serializers.SerializerMethodField()

    def get_host_star(self, obj):
        return HostStarMiniSerializer(obj.exoplanet.host_star).data


class ExoplanetWatchlistCreateSerializer(serializers.Serializer):
    """
    POST /api/watchlist/exoplanets/ 요청 검증용.
    NeoWatchlistCreateSerializer와 대칭.
    """
    exoplanet_id = serializers.IntegerField()
