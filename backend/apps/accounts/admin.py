from django.contrib import admin

from .models import UserPreference


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    # 관리자 화면에서 사용자별 표시 설정을 확인할 수 있게 (10-28 마이페이지)
    list_display = ("user", "distance_unit", "dashboard_sort", "hazard_only", "updated_at")
