from django.urls import path
from .views import (
    NeoWatchlistView, NeoWatchlistDeleteView,
    ExoplanetWatchlistView, ExoplanetWatchlistDeleteView,
)

urlpatterns = [
    path("neo/", NeoWatchlistView.as_view(), name="watchlist-neo"),
    path("neo/<str:nasa_id>/", NeoWatchlistDeleteView.as_view(), name="watchlist-neo-delete"),
    
    path("exoplanets/", ExoplanetWatchlistView.as_view(), name="watchlist-exoplanets"),
    path(
        "exoplanets/<int:exoplanet_id>/", 
        ExoplanetWatchlistDeleteView.as_view(), 
        name="watchlist-exoplanets-delete",
    ),
]
