from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.competitions.models import Application, Competition
from apps.competitions.services import publish_result
from apps.ratings.models import MeterTransaction
from apps.ratings.services import add_meters
from apps.users.models import Discipline


@pytest.mark.django_db
def test_manual_meters_update_ledger_and_balance(admin_user, athlete_user):
    entry = add_meters(
        athlete_id=athlete_user.athlete_profile.id,
        amount=500,
        reason="Тест",
        protocol="T-1",
        created_by=admin_user,
    )
    athlete_user.athlete_profile.refresh_from_db()
    assert entry.amount == 500
    assert athlete_user.athlete_profile.meters_balance == 500
    assert athlete_user.notifications.count() == 1


@pytest.mark.django_db
def test_balance_cannot_be_negative(admin_user, athlete_user):
    with pytest.raises(ValidationError):
        add_meters(
            athlete_id=athlete_user.athlete_profile.id,
            amount=-1,
            reason="Ошибка",
            protocol="T-2",
            created_by=admin_user,
        )
    assert MeterTransaction.objects.count() == 0


@pytest.mark.django_db
def test_result_is_atomic_and_awards_meters(admin_user, athlete_user):
    discipline = Discipline.objects.create(name="Бег")
    now = timezone.now()
    competition = Competition.objects.create(
        title="Старт",
        description="Тест",
        discipline=discipline,
        location="Махачкала",
        starts_at=now,
        ends_at=now + timedelta(hours=2),
        registration_ends_at=now - timedelta(days=1),
        capacity=10,
        reward_meters=1000,
        status=Competition.Status.FINISHED,
        schedule=[],
    )
    Application.objects.create(
        athlete=athlete_user.athlete_profile,
        competition=competition,
        status=Application.Status.APPROVED,
    )
    result = publish_result(
        competition=competition,
        athlete=athlete_user.athlete_profile,
        place=1,
        score="10.00",
        meters_awarded=700,
        published_by=admin_user,
    )
    athlete_user.athlete_profile.refresh_from_db()
    assert result.meter_transaction.amount == 700
    assert athlete_user.athlete_profile.meters_balance == 700
