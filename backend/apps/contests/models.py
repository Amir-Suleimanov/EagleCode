import uuid

from django.conf import settings
from django.db import models


class Task(models.Model):
    class CheckType(models.TextChoices):
        AUTO = "auto", "Автопроверка"
        MANUAL = "manual", "Ручная проверка"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey(
        "competitions.Competition", on_delete=models.CASCADE, related_name="tasks"
    )
    order = models.PositiveSmallIntegerField(default=1)
    title = models.CharField(max_length=160)
    statement = models.TextField()
    max_score = models.PositiveIntegerField(default=100)
    check_type = models.CharField(max_length=8, choices=CheckType.choices, default=CheckType.AUTO)
    time_limit_ms = models.PositiveIntegerField(default=1000)
    memory_limit_mb = models.PositiveIntegerField(default=256)
    materials_url = models.URLField(blank=True)

    class Meta:
        ordering = ["order", "title"]


class TestCase(models.Model):
    __test__ = False  # keeps pytest from collecting the model when tests import it

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="tests")
    order = models.PositiveSmallIntegerField()
    input = models.TextField(blank=True)
    expected_output = models.TextField()
    is_sample = models.BooleanField(default=False)

    class Meta:
        ordering = ["order"]


class Submission(models.Model):
    class Language(models.TextChoices):
        PYTHON = "python", "Python 3.12"
        TEXT = "text", "Текст или ссылка"

    class Status(models.TextChoices):
        QUEUED = "queued", "В очереди"
        RUNNING = "running", "Проверяется"
        JUDGED = "judged", "Проверено автоматически"
        PENDING_REVIEW = "pending_review", "Ждёт проверки"
        REVIEWED = "reviewed", "Проверено организатором"
        FAILED = "failed", "Ошибка проверки"

    class Verdict(models.TextChoices):
        ACCEPTED = "accepted", "Принято"
        WRONG_ANSWER = "wrong_answer", "Неверный ответ"
        TIME_LIMIT = "time_limit", "Превышено время"
        MEMORY_LIMIT = "memory_limit", "Превышена память"
        RUNTIME_ERROR = "runtime_error", "Ошибка выполнения"
        COMPILE_ERROR = "compile_error", "Ошибка компиляции"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="submissions")
    athlete = models.ForeignKey(
        "users.AthleteProfile", on_delete=models.CASCADE, related_name="submissions"
    )
    language = models.CharField(max_length=8, choices=Language.choices)
    source = models.TextField()
    status = models.CharField(max_length=16, choices=Status.choices, db_index=True)
    verdict = models.CharField(max_length=16, choices=Verdict.choices, blank=True)
    auto_score = models.PositiveIntegerField(null=True, blank=True)
    manual_score = models.PositiveIntegerField(null=True, blank=True)
    comment = models.TextField(blank=True)
    passed_tests = models.PositiveIntegerField(default=0)
    total_tests = models.PositiveIntegerField(default=0)
    max_time_ms = models.PositiveIntegerField(null=True, blank=True)
    max_memory_kb = models.PositiveIntegerField(null=True, blank=True)
    report = models.JSONField(default=list, blank=True)
    compile_log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_submissions",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def score(self):
        return self.manual_score if self.manual_score is not None else self.auto_score
