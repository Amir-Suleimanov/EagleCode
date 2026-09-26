from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    AthleteViewSet,
    CityViewSet,
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    RegisterView,
)

router = SimpleRouter(trailing_slash=False)
router.register("athletes", AthleteViewSet, basename="athlete")
router.register("cities", CityViewSet, basename="city")

urlpatterns = [
    path("auth/register", RegisterView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/refresh", RefreshView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/me", MeView.as_view()),
    path("", include(router.urls)),
]
