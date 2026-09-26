from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    CompetitionStatusView,
    CompetitionTasksView,
    JoinContestView,
    StandingsView,
    SubmissionViewSet,
    TaskViewSet,
)

router = SimpleRouter(trailing_slash=False)
router.register("tasks", TaskViewSet, basename="task")
router.register("submissions", SubmissionViewSet, basename="submission")
urlpatterns = [
    path("competitions/<uuid:pk>/status", CompetitionStatusView.as_view()),
    path("competitions/<uuid:pk>/tasks", CompetitionTasksView.as_view()),
    path("competitions/<uuid:pk>/join", JoinContestView.as_view()),
    path("competitions/<uuid:pk>/standings", StandingsView.as_view()),
    path("", include(router.urls)),
]
