"""
마이페이지 API 주소 ─ /api/account/... (문서 04, 4.6절)
인증(로그인·가입) 주소 /api/auth/와 나눈 이유: 인증은 "들어오기", account는 "들어온 뒤 내 계정 관리"라 성격이 다르다.
"""

from django.urls import path

from .views import AccountView, EmailChangeView, PasswordChangeView, PreferenceView

urlpatterns = [
    path("", AccountView.as_view(), name="account"),
    path("preferences/", PreferenceView.as_view(), name="account-preferences"),
    path("email/", EmailChangeView.as_view(), name="account-email"),
    path("password/", PasswordChangeView.as_view(), name="account-password"),
]
