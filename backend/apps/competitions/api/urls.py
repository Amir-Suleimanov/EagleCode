from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import ApplicationViewSet, CompetitionViewSet, ResultViewSet

router = SimpleRouter(trailing_slash=False)
router.register("competitions", CompetitionViewSet, basename="competition")
router.register("applications", ApplicationViewSet, basename="application")
router.register("results", ResultViewSet, basename="result")
urlpatterns = [path("", include(router.urls))]
