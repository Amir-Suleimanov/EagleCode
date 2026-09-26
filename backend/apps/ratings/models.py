import uuid

from django.conf import settings
from django.db import models


class EagleLevel(models.Model):
    code = models.CharField(primary_key=True, max_length=12)
    order = models.PositiveSmallIntegerField(unique=True)
    name = models.CharField(max_length=120)
    min_meters = models.PositiveIntegerField(unique=True)

    class Meta:
        ordering = ["order"]


class MeterTransaction(models.Model):
    class Source(models.TextChoices):
        MANUAL = "manual", "Ручная операция"
        RESULT = "result", "Результат"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    athlete = models.ForeignKey(
        "users.AthleteProfile", on_delete=models.PROTECT, related_name="meter_transactions"
    )
    amount = models.IntegerField()
    reason = models.CharField(max_length=255)
    protocol = models.CharField(max_length=255)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.MANUAL)
    result = models.OneToOneField(
        "competitions.CompetitionResult",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="meter_transaction",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_meter_transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(condition=~models.Q(amount=0), name="meter_amount_nonzero")
        ]


class Achievement(models.Model):
    class Status(models.TextChoices):
        VERIFIED = "verified", "Подтверждено"
        PROGRESS = "progress", "В процессе"
        LOCKED = "locked", "Заблокировано"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    athlete = models.ForeignKey(
        "users.AthleteProfile", on_delete=models.CASCADE, related_name="achievements"
    )
    title = models.CharField(max_length=160)
    description = models.TextField()
    category = models.CharField(max_length=80)
    status = models.CharField(max_length=16, choices=Status.choices)
    earned_at = models.DateField(null=True, blank=True)
