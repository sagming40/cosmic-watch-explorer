"""
NEO API 응답을 만드는 serializers.

핵심 원칙: 이 파일의 시작점은 Neo가 아니라 CloseApproach다.
"오늘 접근하는 소행성 목록"이라는 질문은 실제로는
"오늘 날짜의 접근 사건들, 각각 어느 소행성 소속인지"라는 질문이기 때문.
(02_database_design.md 8.2절 query 패턴 참조)
"""

from rest_framework import serializers
from django.utils import timezone   # ⭐ 추가
from .units import km_to_lunar_distance
from .units import parsec_to_light_year   # ⭐ 추가


class ApproachDetailSerializer(serializers.Serializer):
    """
    접근 사건 한 건의 상세 정보
    CloseApproach 인스턴스 하나를 그대로 넘겨받아 만든다.
    """
    datetime_utc = serializers.DateTimeField(source="approach_datetime_utc")
    # source= : "JSON 키 이름"과 "모델 필드 이름"이 다를 때 연결해주는 다리
    # 문서 응답은 datetime_utc이고, 모델 필드명은 approach_datetime_utc로 서로 달라서 이어줘야 한다.
    
    miss_distance_km = serializers.DecimalField(max_digits=18, decimal_places=4)
    miss_distance_au = serializers.DecimalField(max_digits=12, decimal_places=8)
    velocity_km_s = serializers.DecimalField(max_digits=12, decimal_places=6)
    velocity_km_h = serializers.DecimalField(max_digits=14, decimal_places=4)
    orbiting_body = serializers.CharField()
    
    # 모델에 없는 계산값 — units.py 서랍에서 꺼내 쓴다.
    miss_distance_ld = serializers.SerializerMethodField()
    
    def get_miss_distance_ld(self, obj):
        return km_to_lunar_distance(obj.miss_distance_km)


class ApproachRowSerializer(ApproachDetailSerializer):
    """
    문서 02 ― 5.3절(접근 기록 전체) 목록 한 줄. 5.2절의 recent_approaches도 이 클래스를 사용한다.

    ApproachDetailSerializer를 상속받고 approach_date 하나만 더 얹는다.
    비유: 도시락 안에 반찬 한 가지를 추가한 것 ― 원래 있었던 밥과 반찬들을 그대로 물려받는다.

    통일을 하는 이유: 03_user_scenarios_and_uiux.md의 ApproachTable 컴포넌트가
    상세 화면(5건)과 "더 보기" 화면(전체) 양 쪽에서 공유된다.
    두 응답 필드 구성이 다르면 FE 단에서 화면을 각각 다르게 처리해야 한다.
    """
    approach_date = serializers.DateField()
    # 부모의 7개 필드는 건드리지 않는다. 여기에 적힌 것만 추가된다.
    # 출력 순서 상 approach_date가 맨 뒤로 가는데, JSON은 키 순서가 의미 없으니 상관없다.


class OrbitalDataSerializer(serializers.Serializer):
    """
    궤도 정보 14개 필드. 04_api_specification.md 5.2절 orbital_data 블록 그대로.

    전부 null 허용 필드이다. NASA가 관측이 부족한 소행성의 궤도를 전부 계산해둔 것이 아니다.
    ― 없는 값은 없는 채로 내려보낸다. (02_database_design.md 1.1절 ― null을 임의 값으로 바꾸지 않는다.)
    """ 
    orbit_id = serializers.CharField()
    orbit_determination_datetime_utc = serializers.DateTimeField()
    first_observation_date = serializers.DateField()
    last_observation_date = serializers.DateField()
    data_arc_days = serializers.IntegerField()
    observations_used = serializers.IntegerField()

    # 자릿수는 models.py의 선언과 글자까지 맞춘다.
    # 여기서 자릿수를 줄이면 DB에 있는 정밀값이 응답에서 잘려나간다.
    eccentricity = serializers.DecimalField(max_digits=14, decimal_places=10)
    semi_major_axis_au = serializers.DecimalField(max_digits=14, decimal_places=10)
    inclination_deg = serializers.DecimalField(max_digits=12, decimal_places=8)
    orbital_period_days = serializers.DecimalField(max_digits=16, decimal_places=8)
    perihelion_distance_au = serializers.DecimalField(max_digits=14, decimal_places=10)
    aphelion_distance_au = serializers.DecimalField(max_digits=14, decimal_places=10) 

    orbit_class_type = serializers.CharField()
    orbit_class_description = serializers.CharField()


class NeoDetailSerializer(serializers.Serializer):
    """
    문서 02 ― 5.2절 상세 응답. 이 serializer만 시작점이 Neo다.
    5.1절은 CloseApproach가 시작점. ― "오늘의 접근 사건들"이 질문이었으니까.
    5.2절은 "이 소행성이 어떤 행성인가"가 질문이라 주어가 바뀐다.
    """      
    RECENT_APPROACH_LIMIT = 5
    # '5'라는 숫자는 02번 문서 5.2절 설계 결정 ②에서 온 숫자이다. 코드안에 흩뜨려 놓지 않고,
    # 이 곳에만 둔다. 384400(1 LD/달 거리 상수)units.py에만 둔 것과 같은 이유
     
    nasa_id = serializers.CharField()
    name = serializers.CharField()
    designation = serializers.CharField()
    absolute_magnitude = serializers.DecimalField(max_digits=6, decimal_places=3)
    diameter_min_m = serializers.DecimalField(max_digits=14, decimal_places=4)
    diameter_max_m = serializers.DecimalField(max_digits=14, decimal_places=4)
    is_hazardous = serializers.BooleanField()
    is_sentry_object = serializers.BooleanField()
    jpl_url = serializers.URLField()

    is_watchlisted = serializers.SerializerMethodField()
    orbital_data = serializers.SerializerMethodField()
    recent_approaches = serializers.SerializerMethodField()
    approach_count = serializers.SerializerMethodField()

    def get_is_watchlisted(self, obj):
        # M2 인증·watchlist endpoint가 붙기 전까지는 항상 False.
        # 문서 02 ― 설계 결정 ① "비로그인 사용자에게는 항상 false"가 이미 정상 동작이다.
        # 지금 False로 고정해두는 것은 임시방편이 아니라 절반은 완성이 된 상태이다.
        # 추후 request.user를 확인한 후 판정하는 코드로 채운다.
        return False

    def get_orbital_data(self, obj):
        """
        궤도 정보가 아직 없는 소행성이라면 null을 내려준다.

        ⚠️ 여기서 obj.orbital_data를 그냥 사용하면 안 된다.
        OneToOneField의 '뒤쪽'은 행이 없을 때 None이 아니라 예외를 던진다.
        RelatedObjectDoesNotExist ― 1인 1사물함인데 그 사람이 사용할 사물함이 없는 상황

        다행이 이 예외를 AttributeError의 자식으로 만들어두었다. (Django)
        덕분에 getattr(..., None)이 그대로 통한다 ― M1에서 쓰던 안전망과 같은 패턴
        """  
        orbital = getattr(obj, "orbital_data", None)
        if orbital is None:
            return None
        return OrbitalDataSerializer(orbital).data

    def get_recent_approaches(self, obj):
        """
        오늘 이후 가장 가까운 예정 접근 5건.
        Cosmic "watch" ― 이미 지나간 접근보다 "다음 접근은 언제인가"가
        모니터링 목적에 더 맞는다고 판단하여 미래 접근 기준으로 결정.
        04_api_specification.md 5.2절엔 "최근 5건"으로만 적혀 있어 모호했던 부분이다.
        → 문서 업데이트 필요. 이 정의를 명시할 것

        미래 접근이 5건 미만이면 값이 있는 만큼만 내려준다 ― 억지로 과거로 채우지 않는다.
        (02_database_design.md 1.1절 ― NULL 보존 원칙)
        """
        rows = (
            obj.approaches
            .filter(approach_datetime_utc__gte=timezone.now())
            .order_by("approach_datetime_utc")[:self.RECENT_APPROACH_LIMIT]
        )
        return ApproachRowSerializer(rows, many=True).data

    def get_approach_count(self, obj):
        # 위 5건이 아니라 '전체' 개수. FE에서 approach_count > 5로
        # "더보기" 버튼을 띄울지 판단한다. (문서 02 ― 설계 결정 ②)
        # .count()는 행을 가져오지 않고 DB에 SELECT COUNT(*)만 물어본다.
        return obj.approaches.count()


class NeoApproachSerializer(serializers.Serializer):
    """
    대시보드 목록 한 줄. 소스는 CloseApproach 인스턴스이다. (Neo 아님)
    obj.neo로 접근 사건에 딸린 소행성 정보를 함께 꺼낸다.
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
    
    # 위쪽은 전부 "neo."로 시작하는데 이 필드만 다르다
    # approach를 통째로 별도 serializer(ApproachDetailSerializer)에게 넘겨서
    # obj 자기 자신(CloseApproach)을 다시 그대로 물려준다.
    approach = serializers.SerializerMethodField()
    
    def get_approach(self, obj):
        return ApproachDetailSerializer(obj).data


class HostStarBriefSerializer(serializers.Serializer):
    """
    문서 04 ─ 6.1절 목록 안에 들어가는 항성 정보. 딱 3개 field만.
    
    목록화면에는 "이 행성이 어느 별을 도는지, 얼마나 먼지"만 보이면 충분하다.
    분광형·표면중력 같은 8개 fields를 20건 마다 전부 실어보내면
    목록 화면이 사용하지도 않을 데이터로 응답 크기만 커진다.
    """   
    name = serializers.CharField()
    distance_pc = serializers.DecimalField(max_digits=12, decimal_places=3)
    distance_ly = serializers.SerializerMethodField()
    
    def get_distance_ly(self, obj):
        # obj는 HostStar instance. distance_pc가 None이면
        # parsec_to_light_year()이 이미 None을 그대로 반환한다.
        return parsec_to_light_year(obj.distance_pc)  


class HostStarDetailSerializer(HostStarBriefSerializer):
    """
    문서 04 ─ 6.2절 상세용 항성 정보. Breif를 상속해 5개 fields만 더 얹는다.
    
    ApproachRowSerializer가 ApproachDetailSerializer를 상속했던 것과 
    똑같은 패턴 ─ 도시락에 반찬 5개를 추가하는 것.
    id를 여기서 새로 추가하는 이유: 목록(Brief)에서는 항성을 클릭할 일이 없지만,
    상세 화면에서는 host_star 자체의 식별자가 필요할 수 있다. (문서 04 예시 "id": 88로 명시되어 있음)
    """    
    id = serializers.IntegerField()
    spectral_type = serializers.CharField(allow_null=True)
    temperature_k = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    radius_solar = serializers.DecimalField(max_digits=12, decimal_places=6, allow_null=True)
    mass_solar = serializers.DecimalField(max_digits=12, decimal_places=6, allow_null=True)
    metallicity = serializers.DecimalField(max_digits=10, decimal_places=5, allow_null=True)
    surface_gravity = serializers.DecimalField(max_digits=10, decimal_places=5, allow_null=True)


class SiblingPlanetSerializer(serializers.Serializer):
    """
    문서 04 ─ 6.2절 sibling_planets array 한 줄.
    id와 이름, 반지름만 ─ "같은 별에 이런 행성도 있다"는 안내용이라 목록/상세보다도 훨씬 가벼운 fields 구성이다.
    """ 
    id = serializers.IntegerField()
    planet_name = serializers.CharField()
    radius_earth = serializers.DecimalField(
        max_digits=12, decimal_places=6, allow_null=True
    )   


class ExoplanetRowSerializer(serializers.Serializer):
    """
    문서 04 ─ 6.1절 목록 한 줄. 시작점은 Exoplanet 자신이다.
    (NeoApproachSerializer가 CloseApproach에서 시작해 obj.neo로 넘어갔던 것과
    반대 방향 ─ 여기는 Exoplanet에서 obj.host_star로 넘어간다.)
    """
    id = serializers.IntegerField()
    planet_name = serializers.CharField()
    radius_earth = serializers.DecimalField(max_digits=12, decimal_places=6, allow_null=True)
    mass_earth = serializers.DecimalField(max_digits=14, decimal_places=6, allow_null=True)
    equilibrium_temp_k = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    orbital_period_days = serializers.DecimalField(max_digits=16, decimal_places=8, allow_null=True)
    discovery_year = serializers.IntegerField(allow_null=True)
    discovery_method = serializers.CharField(allow_null=True)
    
    host_star = HostStarBriefSerializer()
    # ↑ source를 붙이지 않는 이유: Exoplanet.host_star가 field명 그대로 존재하는
    # ForeignKey라, DRF가 obj.host_star를 알아서 찾아 HostStarBriefSerializer에 넘긴다.
    # NeoApproachSerializer의 diameter_min_m이 source="neo.diameter_min_m"으로
    # "점(.)으로 한 단계 더 들어간" 것과 달리, 여기는 field 이름 자체가 일치하여 source 지정이 필요 없다.


class ExoplanetDetailSerializer(ExoplanetRowSerializer):
    """
    문서 04 ─ 6.2절 상세. Row의 8 fields + host_star를 그대로 물려받고
    is_watchlisted / sibling_planets 2개만 새로 얹는다.
    
    ⚠️ host_star를 다시 선언해서 덮어쓴다 ─ 부모(Row)는 Brief를 사용하지만
    상세는 Detail(8 fields)을 사용해야 하기 때문. 같은 이름 fields응 자식 class에서
    다시 선언하면 부모 것을 덮어쓴다. ─ Python Class 상속의 기본 규칙이다.
    """    
    host_star = HostStarDetailSerializer()
    
    is_watchlisted = serializers.SerializerMethodField()
    sibling_planets = serializers.SerializerMethodField()
    
    def get_is_watchlisted(self, obj):
        # NeoDetailSerializer.get_is_watchlisted와 완전히 같은 이유로 항상 False.
        # M2 인증·Watchlist가 붙기 전까지는 이게 정답이다.
        return False
    
    def get_sibling_planets(self, obj):
        """
        같은 항성을 도는 '다른' 행성들. 자기 자신은 제외한다.
        
        obj.host_star.planets ─ Exoplanet.host_star의 related_name='planets'을
        그대로 사용한다. (CloseApproach.neo의 related_name='approaches'와 같은 패턴)
        문서 04 ─ 6.2절: "DB 구조 상 host_star.planets로 이미 접근 가능하므로 추가 비용이 거의 없다."
        
        exclude(pk=obj.pk) ─ "자기 자신 빼고 형제만" 걸러내는 부분.
        이 과정이 없으면 자기 자신도 sibling_planets 목록에 나타나는 이상한 결과가 된다.
        """
        siblings = obj.host_star.planets.exclude(pk=obj.pk)
        return SiblingPlanetSerializer(siblings, many=True).data
