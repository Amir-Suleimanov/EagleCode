from apps.competitions.models import Application

from .helpers import build_standings
from .models import Submission, Task


def is_admin(user):
    return user.is_authenticated and (user.role == "admin" or user.is_superuser)


def tasks_for(competition):
    return Task.objects.filter(competition=competition).prefetch_related("tests")


def submissions_for(user, params=None):
    params = params or {}
    queryset = Submission.objects.select_related("task", "athlete__user")
    if not is_admin(user):
        queryset = queryset.filter(athlete__user=user)
    if competition_id := params.get("competitionId"):
        queryset = queryset.filter(task__competition_id=competition_id)
    if task_id := params.get("taskId"):
        queryset = queryset.filter(task_id=task_id)
    if params.get("needsReview") == "true":
        queryset = queryset.filter(status=Submission.Status.PENDING_REVIEW)
    return queryset.order_by("-created_at")


def participants(competition):
    applications = Application.objects.filter(
        competition=competition, status=Application.Status.APPROVED
    ).select_related("athlete__user")
    return {item.athlete_id: item.athlete.user.full_name for item in applications}


def standings(competition):
    return build_standings(
        tasks=list(Task.objects.filter(competition=competition)),
        submissions=Submission.objects.filter(task__competition=competition).only(
            "task_id", "athlete_id", "auto_score", "manual_score", "created_at"
        ),
        participants=participants(competition),
        started_at=competition.starts_at,
    )


def pending_review_count(competition):
    return Submission.objects.filter(
        task__competition=competition, status=Submission.Status.PENDING_REVIEW
    ).count()
