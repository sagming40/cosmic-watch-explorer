from django.urls import path

from .views import CsrfView, LoginView, LogoutView, MeView, SignupView

urlpatterns = [
    path("csrf/", CsrfView.as_view(), name="auth-csrf"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("signup/", SignupView.as_view(), name="auth-signup"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
]
