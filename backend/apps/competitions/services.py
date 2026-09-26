from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.notifications.helpers import application_message
from apps.notifications.services import notify
from apps.ratings.models import MeterTransaction
from apps.ratings.services import add_meters

from .models import Application, CompetitionResult


@transaction.atomic
def submit_application(*, athlete, competition):
    if (
        competition.status != competition.Status.REGISTRATION
        or competition.registration_ends_at < timezone.now()
    ):
        raise ValidationError({"competitionId": "Регистрация на соревнование закрыта."})
    application, created = Application.objects.get_or_create(
        athlete=athlete, competition=competition
    )
    if not created:
        raise ValidationError({"competitionId": "Заявка уже подана."})
    return application


@transaction.atomic
def review_application(*, application, status, reviewed_by):
    application = Application.objects.select_for_update().get(pk=application.pk)
    if application.status != Application.Status.PENDING:
        raise ValidationError({"status": "Решение по заявке уже принято."})
    if status not in [Application.Status.APPROVED, Application.Status.REJECTED]:
        raise ValidationError({"status": "Допустимы approved или rejected."})
    application.status = status
    application.reviewed_by = reviewed_by
    application.reviewed_at = timezone.now()
    application.save(update_fields=["status", "reviewed_by", "reviewed_at"])
    title, message = application_message(application.competition.title, status)
    notify(user=application.athlete.user, kind="application", title=title, message=message)
    return application


@transaction.atomic
def publish_result(*, competition, athlete, place, score, meters_awarded, published_by):
    if not Application.objects.filter(
        competition=competition, athlete=athlete, status=Application.Status.APPROVED
    ).exists():
        raise ValidationError({"athleteId": "У спортсмена нет одобренной заявки."})
    result = CompetitionResult.objects.create(
        competition=competition,
        athlete=athlete,
        place=place,
        score=score,
        meters_awarded=meters_awarded,
        published_by=published_by,
    )
    if meters_awarded:
        add_meters(
            athlete_id=athlete.id,
            amount=meters_awarded,
            reason=f"Результат: {score}",
            protocol=f"AUTO-{result.id}",
            created_by=published_by,
            source=MeterTransaction.Source.RESULT,
            result=result,
        )
    return result
