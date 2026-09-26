from .models import Application, Competition, CompetitionResult


def competitions(params=None, user=None):
    params = params or {}
    queryset = Competition.objects.select_related("discipline")
    is_admin = (
        user is not None and user.is_authenticated and (user.role == "admin" or user.is_superuser)
    )
    if not is_admin:
        queryset = queryset.exclude(status=Competition.Status.DRAFT)
    # "format" is reserved by DRF for renderer negotiation, hence "kind".
    if competition_format := params.get("kind"):
        queryset = queryset.filter(format=competition_format)
    if status := params.get("status"):
        queryset = queryset.filter(status=status)
    if discipline := params.get("discipline"):
        queryset = queryset.filter(discipline__name=discipline)
    if search := params.get("search"):
        queryset = queryset.filter(title__icontains=search)
    return queryset.order_by("-starts_at", "title")


def applications_for(user, params=None):
    params = params or {}
    queryset = Application.objects.select_related("athlete__user", "competition")
    if user.role != "admin" and not user.is_superuser:
        queryset = queryset.filter(athlete__user=user)
    if status := params.get("status"):
        queryset = queryset.filter(status=status)
    if competition_id := params.get("competitionId"):
        queryset = queryset.filter(competition_id=competition_id)
    return queryset.order_by("-created_at")


def results(params=None):
    params = params or {}
    queryset = CompetitionResult.objects.select_related("athlete__user", "competition")
    if athlete_id := params.get("athleteId"):
        queryset = queryset.filter(athlete_id=athlete_id)
    if competition_id := params.get("competitionId"):
        queryset = queryset.filter(competition_id=competition_id)
    return queryset.order_by("-published_at")
