from .models import Achievement, EagleLevel, MeterTransaction


def levels():
    return EagleLevel.objects.order_by("order")


def transactions_for(user):
    queryset = MeterTransaction.objects.select_related("athlete__user")
    if user.role != "admin" and not user.is_superuser:
        queryset = queryset.filter(athlete__user=user)
    return queryset.order_by("-created_at")


def achievements_for(athlete_id):
    return Achievement.objects.filter(athlete_id=athlete_id).order_by("-earned_at", "title")
