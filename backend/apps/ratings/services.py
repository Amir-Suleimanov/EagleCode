from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.notifications.helpers import meters_message
from apps.notifications.services import notify
from apps.users.models import AthleteProfile

from .models import MeterTransaction


@transaction.atomic
def add_meters(
    *,
    athlete_id,
    amount,
    reason,
    protocol,
    created_by,
    source=MeterTransaction.Source.MANUAL,
    result=None,
):
    athlete = AthleteProfile.objects.select_for_update().get(pk=athlete_id)
    new_balance = athlete.meters_balance + amount
    if amount == 0:
        raise ValidationError({"amount": "Количество метров не может быть равно нулю."})
    if new_balance < 0:
        raise ValidationError({"amount": "Баланс метров не может быть отрицательным."})
    entry = MeterTransaction.objects.create(
        athlete=athlete,
        amount=amount,
        reason=reason,
        protocol=protocol,
        source=source,
        result=result,
        created_by=created_by,
    )
    athlete.meters_balance = new_balance
    athlete.save(update_fields=["meters_balance"])
    title, message = meters_message(amount, reason)
    notify(user=athlete.user, kind="meters", title=title, message=message)
    return entry


@transaction.atomic
def update_level(*, level, name=None, min_meters=None):
    if name is not None:
        level.name = name
    if min_meters is not None:
        if level.order == 1 and min_meters != 0:
            raise ValidationError({"minMeters": "Первый уровень должен начинаться с нуля."})
        previous = type(level).objects.filter(order__lt=level.order).order_by("-order").first()
        following = type(level).objects.filter(order__gt=level.order).order_by("order").first()
        if (
            previous
            and min_meters <= previous.min_meters
            or following
            and min_meters >= following.min_meters
        ):
            raise ValidationError(
                {"minMeters": "Порог должен находиться между соседними уровнями."}
            )
        level.min_meters = min_meters
    level.save()
    return level
