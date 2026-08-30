from django.contrib import admin
from .models import Neo, HostStar, Exoplanet

# admin.site.register()만 사용해도 목록이 출력되긴 하지만,
# 각 행이 "Neo object (1)"처럼 밋밋하게 출력된다.
# list_display로 컬럼들을 표로 출력되게 지정 해주는 것이 관례이다.
# 비유: Excel Sheet — 헤더 없이 셀 값만 쭉 나열되는 것 보다는
# 어떤 컬럼을 볼지 미리 골라서 나타내는 것이 확인하기 훨씬 수월한 것과 같다. 

@admin.register(Neo)
class NeoAdmin(admin.ModelAdmin):
    list_display = ("name", "nasa_id", "diameter_min_m", "diameter_max_m", "is_hazardous")
    # nasa_id를 넣은 이유: "NASA 사원번호" — models.py 주석에도 명시되어 있듯
    # 같은 이름의 소행성을 구분할 때 유용하다. is_hazardous는 위험 여부를 한눈에 보기 위해.

    list_filter = ("is_hazardous",)
    # list_filter를 적용하면 화면 오른쪽에 "필터: 위험/위험하지 않음" 버튼이 생긴다.
    # is_hazardous에 db_index=True를 적용한 것도 이런 식으로 필터링에 자주 사용되기 때문이다.
    # 결국, Admin 필터도 내부적으로 그 컬럼의 WHERE 조건을 쏘는거라 인덱스의 이점을 그대로 받는다.


@admin.register(HostStar)
class HostStarAdmin(admin.ModelAdmin):
    list_display = ("name", "distance_pc", "spectral_type", "temperature_k")


@admin.register(Exoplanet)
class ExoplanetAdmin(admin.ModelAdmin):
    list_display = ("planet_name", "host_star", "radius_earth", "discovery_year", "discovery_method")
    list_filter = ("discovery_method",)

    # host_star를 list_display에 그대로 적용하면 Django가 HostStar.__str__()
    # (= self.name)을 자동으로 출력한다. models.py에 __str__을 미리 정의해둔 덕분에
    # 이 화면에서 "HostStar object (3)" 같은 형식 대신 "Kepler-317" 같은 형식으로 바로 출력된다.
