import uuid

from django.conf import settings
from django.db import models


class Competition(models.Model):
    class Status(models.TextChoices):
        REGISTRATION = "registration", "Регистрация"
        UPCOMING = "upcoming", "Скоро"
        ACTIVE = "active", "Идёт"
        FINISHED = "finished", "Завершено"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    discipline = models.ForeignKey(
        "users.Discipline", on_delete=models.PROTECT, related_name="competitions"
    )
    location = models.CharField(max_length=255)
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    registration_ends_at = models.DateTimeField()
    capacity = models.PositiveIntegerField()
    reward_meters = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.REGISTRATION, db_index=True
    )
    schedule = models.JSONField(default=list)

    class Meta:
        ordering = ["-starts_at"]


class Application(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Ожидает"
        APPROVED = "approved", "Одобрена"
        REJECTED = "rejected", "Отклонена"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    athlete = models.ForeignKey(
        "users.AthleteProfile", on_delete=models.CASCADE, related_name="applications"
    )
    competition = models.ForeignKey(
        Competition, on_delete=models.CASCADE, related_name="applications"
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="reviewed_applications",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["athlete", "competition"], name="unique_competition_application"
            )
        ]


class CompetitionResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey(Competition, on_delete=models.PROTECT, related_name="results")
    athlete = models.ForeignKey(
        "users.AthleteProfile", on_delete=models.PROTECT, related_name="results"
    )
    place = models.PositiveIntegerField()
    score = models.CharField(max_length=100)
    meters_awarded = models.PositiveIntegerField()
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="published_results"
    )
    published_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-published_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["athlete", "competition"], name="unique_competition_result"
            )
        ]
