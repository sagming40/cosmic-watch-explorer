"""
프로젝트 전용 권한 class

config/에 두는 이유 ─ 특정 앱의 사정이 아닌, 프로젝트 전역 약속이기 때문
→ "이 프로젝트의 401은 이 형식으로 약속한다." pagination.py, exception_handler.py와 같은 층에 있다. 
"""

from rest_framework.permissions import IsAuthenticated

from config.exception_handler import AuthRequired


class IsAuthenticatedOr401(IsAuthenticated):
    """
    판정 기준은 IsAuthenticated와 완전 동일. '거절하는 방식'만 다르다.

    비유: 경비원 두 명이 있다. 통과 기준(사원증 유/무)은 똑같다.
    경비원 1 ─ 사유를 알려주지 않고 출입이 불가하다고 통보한다.
    경비원 2 ─ 출입을 막으며 왜 출입이 불가한지 정확한 사유를 알려준다.

    부모의 has_permission()을 그대로 재사용하는 이유
    ─ 판정 logic을 복사하면 나중에 DRF 판정 기준이 바뀌었을때 직접 만든 것만 옛날 기준으로 남는다.
    """

    def has_permission(self, request, view):
        if super().has_permission(request, view):
            return True

        # False를 반환하지 않고 직접 예외를 던지는 것이 이 클래스의 존재 이유이다.
        # False를 반환하면 DRF가 대신 NotAuthenticated를 던지고 → 403으로 강등된다.
        raise AuthRequired()
