"""
NEO API 응답을 만드는 serializers.

핵심 원칙: 이 파일의 시작점은 Neo가 아니라 CloseApproach다.
"오늘 접근하는 소행성 목록"이라는 질문은 실제로는
"오늘 날짜의 접근 사건들, 각각 어느 소행성 소속인지"라는 질문이기 때문.
(02_database_design.md 8.2절 query 패턴 참조)
"""

from rest_framework import serializers
from .units import km_to_lunar_distance


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
