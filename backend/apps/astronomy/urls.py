from django.urls import path
from .views import NeoDashboardView, NeoDetailView

urlpatterns = [
    path("neo/", NeoDashboardView.as_view(), name="neo-dashboard"),
    path("neo/<str:nasa_id>/", NeoDetailView.as_view(), name="neo-detail"),
]
