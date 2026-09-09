from django.urls import path
from .views import (
    NeoDashboardView, NeoDetailView, NeoApproachListView,
    ExoplanetListView, ExoplanetDetailView, ExoplanetMetaView,
)

urlpatterns = [
    path("neo/", NeoDashboardView.as_view(), name="neo-dashboard"),
    path("neo/<str:nasa_id>/", NeoDetailView.as_view(), name="neo-detail"),
    path("neo/<str:nasa_id>/approaches/", NeoApproachListView.as_view(), name="neo-approaches"),
    
    # meta/를 <int:pk>/보다 위에 둔다. <int:pk>는 애초에 "meta"라는 String과
    # 매칭되지 않으므로 실제로 겹치진 않지만, urls.py <str:nasa_id/> 와 같은
    # 슬래시 위치 실수를 겪은 뒤로 "구체적인 경로를 먼저 등록"하는 습관을 안전한 쪽으로 고정해둔다.
    path("exoplanets/meta/", ExoplanetMetaView.as_view(), name="exoplanet-meta"),
    path("exoplanets/", ExoplanetListView.as_view(), name="exoplanet-list"),
    path("exoplanets/<int:pk>/", ExoplanetDetailView.as_view(), name="exoplanet-detail"),
]
