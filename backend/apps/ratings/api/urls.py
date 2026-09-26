from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import AchievementListView, AddMetersView, LevelViewSet, TransactionListView

router = SimpleRouter(trailing_slash=False)
router.register("levels", LevelViewSet, basename="level")
urlpatterns = [
    path("rating/transactions", TransactionListView.as_view()),
    path("rating/meters", AddMetersView.as_view()),
    path("athletes/<uuid:athlete_id>/achievements", AchievementListView.as_view()),
    path("", include(router.urls)),
]
