from django.urls import path
from .views import NeoDashboardView

urlpatterns = [
    path("neo/", NeoDashboardView.as_view(), name="neo-dashboard"),
]
