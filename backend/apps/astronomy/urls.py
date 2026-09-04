from django.urls import path
from .views import NeoDashboardView, NeoDetailView, NeoApproachListView

urlpatterns = [
    path("neo/", NeoDashboardView.as_view(), name="neo-dashboard"),
    path("neo/<str:nasa_id>/", NeoDetailView.as_view(), name="neo-detail"),
    path("neo/<str:nasa_id>/approaches/", NeoApproachListView.as_view(), name="neo-approaches"),
]
