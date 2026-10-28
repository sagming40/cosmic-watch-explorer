"""
계정 앱 모델 ─ 사용자 계정 자체는 Django 기본 User를 그대로 쓴다. 여기엔 "사용자별 표시 설정"만 둔다.
문서 02 ─ user_preference (10-28 추가)
"""

from django.conf import settings
from django.db import models


class UserPreference(models.Model):
    """
    마이페이지 "표시 설정" ─ 대시보드를 열 때 처음 보일 모양.

    서버(DB)에 두는 이유: 사용자가 회사 PC·집 PC·노트북을 오가며 쓴다.
    브라우저 저장소(localStorage)에 두면 기기마다 따로 놀아서 매번 다시 맞춰야 한다.

    행은 "처음 설정을 바꿀 때" 만든다 ─ 없으면 아래 기본값과 같다고 본다(DEFAULTS).
    그래서 기존 사용자를 위한 데이터 마이그레이션이 필요 없다.
    """

    DISTANCE_UNITS = [("km", "km"), ("au", "AU")]
    DASHBOARD_SORTS = [("distance", "거리"), ("velocity", "속도"), ("size", "크기")]
    DEFAULTS = {"distance_unit": "km", "dashboard_sort": "distance", "hazard_only": False}

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preference")
    # ⬆️ CASCADE ─ 탈퇴하면 설정도 같이 지운다 (Watchlist와 같은 이유)
    distance_unit = models.CharField(max_length=4, choices=DISTANCE_UNITS, default="km")
    # ⬆️ 대시보드 목록의 보조 거리 단위. 기본 단위 LD는 고정이고 옆에 붙는 단위만 고른다
    dashboard_sort = models.CharField(max_length=10, choices=DASHBOARD_SORTS, default="distance")
    hazard_only = models.BooleanField(default=False)
    # ⬆️ 대시보드에서 "위험 분류만 보기"를 처음부터 켜 둘지
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_preference"

    def __str__(self):
        return f"{self.user_id} 설정"
