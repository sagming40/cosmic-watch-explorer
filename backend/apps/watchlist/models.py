from django.db import models
from django.conf import settings
# settings를 가져오는 이유
# 이 프로젝트는 유저 모델을 커스텀 하지 않고 Django 기본 User를 사용하고 있지만,
# 코드에서 "from django.contrib.auth.models import User"를 직접 쓰지 않고,
# settings.AUTH_USER_MODEL로 우회해서 참조하는 것이 Django의 관례이다.
# 나중에 프로젝트 도중 User 모델을 커스텀하게 되는 경우가 종종 있는데,
# 전역 import 방식으로 참조해둔 코드는 settings.py 한 곳만 수정하면 되지만,
# User를 직접 import해둔 코드는 한줄한줄 다 찾아서 수정 해야 한다.


class NeoWatchlist(models.Model):
    """
    사용자가 관심 있게 지켜보는 소행성 목록
    astronomy 앱과 다르게 NASA에서 제공하는 데이터가 아니다.
    '사용자가 직접 만든 데이터' 앱을 astronomy/watchlist로 분리한 이유
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='neo_watchlist'
    )
    # ⬆️ on_delete=CASCADE인 이유: 계정을 탈퇴하면 탈퇴한 유저의 관심 목록도
    # 같이 사라지는 것이 자연스러움. 탈퇴한 계정의 데이터가 유령처럼 DB에 남아있으면 안 됨.

    neo = models.ForeignKey(
        'astronomy.Neo', on_delete=models.CASCADE
    )
    # ⬆️ 문자열로 사용 — "순서 문제 우회 방법"
    # 이번 경우에는 순서 문제가 아닌 **앱 자체가 다른 파일**이기 때문이다.
    # 같은 파일 안의 Neo 클래스를 똑같이 Neo라고 사용할 수 있던 것과 다르게
    # 다른 앱에 있는 모델을 참조할 경우 '앱이름.모델이름' 형식의 문자열을 사용해야 한다.
    # Django에서 이 문자열을 보고 astronomy 앱 안의 Neo를 찾을 때 알아서 연결해준다.

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'neo_watchlist'
        constraints = [
            models.UniqueConstraint(fields=['user', 'neo'], name='uk_nw_user_neo')
        ]
        # ⬆️ UniqueConstraint가 "소행성 중복 북마크 불가"를 보장함
        # CloseApproach의 UniqueConstraint와 원리는 같지만 목적이 다르다.
        # CloseApproach — "중복 수집 불가" / NeoWatchlist — "중복 북마크 불가"
        # UniqueConstraint 제약 덕분에 "소행성 중복 POST 요청"을 하면 "ERROR 409 반환"이 가능해짐 
        # (문서 02 — 3.6절 / M2 완료 기준)

class ExoplanetWatchlist(models.Model):
    """
    사용자가 관심 있게 지켜보는 외계행성 목록
    NeoWatchlist와 구조는 완전히 대칭이고, 참조 대상만 다르다.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exoplanet_watchlist'
    )
    exoplanet = models.ForeignKey(
        'astronomy.Exoplanet', on_delete=models.CASCADE
    )
    # ⬆️ NeoWatchlist — 'astronomy.Neo'로 명시했던 것과 같은 원리.
    # app_label('astronomy') + 모델이름('Exoplanet')을 문자열로 참조

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exoplanet_watchlist'
        constraints = [
            models.UniqueConstraint(fields=['user', 'exoplanet'], name='uk_ew_user_ep')
        ]
        # ⬆️ 같은 원리: "외계행성 중복 북마크"를 DB 레벨에서 차단.  
