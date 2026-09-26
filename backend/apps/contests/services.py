from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.competitions.models import Application, Competition, CompetitionResult
from apps.competitions.services import publish_result
from apps.notifications.services import notify
from apps.users.models import AthleteProfile, User

from .helpers import (
    contest_meters,
    contest_result_message,
    overall_verdict,
    submission_message,
    task_score,
)
from .models import Submission, Task, TestCase
from .selectors import standings

NEXT_STATUS = {
    Competition.Status.DRAFT: Competition.Status.REGISTRATION,
    Competition.Status.REGISTRATION: Competition.Status.ACTIVE,
    Competition.Status.ACTIVE: Competition.Status.FINISHED,
}
SUBMISSION_COOLDOWN = timedelta(seconds=5)


def ensure_editable(competition):
    if competition.status == Competition.Status.FINISHED:
        raise ValidationError({"detail": "Контест завершён, изменения закрыты."})


@transaction.atomic
def change_status(*, competition, status, by):
    competition = Competition.objects.select_for_update().get(pk=competition.pk)
    if NEXT_STATUS.get(competition.status) != status:
        raise ValidationError({"status": "Недопустимый переход статуса."})
    if status == Competition.Status.REGISTRATION and not competition.tasks.exists():
        raise ValidationError({"status": "Добавьте хотя бы одно задание перед публикацией."})
    now = timezone.now()
    if status == Competition.Status.ACTIVE and competition.starts_at > now:
        competition.starts_at = now
    if status == Competition.Status.FINISHED and competition.ends_at > now:
        competition.ends_at = now
    competition.status = status
    competition.save(update_fields=["status", "starts_at", "ends_at"])
    if status == Competition.Status.FINISHED:
        finalize_contest(competition=competition, by=by)
    return competition


def sync_statuses():
    """Moves contests along their timeline so nobody has to press buttons at midnight."""
    now = timezone.now()
    contests = Competition.objects.filter(format=Competition.Format.CONTEST)
    contests.filter(status=Competition.Status.REGISTRATION, starts_at__lte=now).update(
        status=Competition.Status.ACTIVE
    )
    for competition in contests.filter(status=Competition.Status.ACTIVE, ends_at__lte=now):
        try:
            change_status(competition=competition, status=Competition.Status.FINISHED, by=None)
        except ValidationError:
            continue  # a concurrent request has already finished it


@transaction.atomic
def finalize_contest(*, competition, by):
    publisher = by or competition.created_by or User.objects.filter(role=User.Role.ADMIN).first()
    max_total = sum(task.max_score for task in competition.tasks.all())
    for row in standings(competition):
        athlete = AthleteProfile.objects.select_related("user").get(pk=row["athleteId"])
        if CompetitionResult.objects.filter(competition=competition, athlete=athlete).exists():
            continue
        publish_result(
            competition=competition,
            athlete=athlete,
            place=row["place"],
            score=f"{row['total']} / {max_total}",
            meters_awarded=contest_meters(competition.reward_meters, row["total"], max_total),
            published_by=publisher,
        )
        title, message = contest_result_message(competition.title, row["place"], row["total"])
        notify(user=athlete.user, kind="contest", title=title, message=message)


def join_contest(*, athlete, competition):
    if competition.format != Competition.Format.CONTEST or competition.status not in [
        Competition.Status.REGISTRATION,
        Competition.Status.ACTIVE,
    ]:
        raise ValidationError({"detail": "Участие в этом соревновании недоступно."})
    application, _ = Application.objects.get_or_create(athlete=athlete, competition=competition)
    if application.status != Application.Status.APPROVED:
        application.status = Application.Status.APPROVED
        application.reviewed_at = timezone.now()
        application.save(update_fields=["status", "reviewed_at"])
    return application


@transaction.atomic
def submit_solution(*, athlete, task, language, source):
    competition = task.competition
    if competition.status != Competition.Status.ACTIVE or competition.ends_at <= timezone.now():
        raise ValidationError({"detail": "Приём решений закрыт: контест не идёт."})
    expected = Submission.Language.PYTHON if task.check_type == Task.CheckType.AUTO else None
    if expected and language != expected:
        raise ValidationError({"language": "Для этого задания принимается код на Python."})
    last = athlete.submissions.order_by("-created_at").values_list("created_at", flat=True).first()
    if last and timezone.now() - last < SUBMISSION_COOLDOWN:
        raise ValidationError({"detail": "Слишком часто: подождите несколько секунд."})
    join_contest(athlete=athlete, competition=competition)
    auto = task.check_type == Task.CheckType.AUTO and settings.JUDGE_ENABLED
    submission = Submission.objects.create(
        task=task,
        athlete=athlete,
        language=language,
        source=source,
        status=Submission.Status.QUEUED if auto else Submission.Status.PENDING_REVIEW,
    )
    if auto:
        from .judge import enqueue

        transaction.on_commit(lambda: enqueue(submission.id))
    return submission


def save_judge_report(*, submission, report):
    task = submission.task
    tests = report.get("tests", [])
    submission.report = tests
    submission.compile_log = report.get("log", "")
    submission.total_tests = task.tests.count()
    if report.get("compileError"):
        submission.verdict = Submission.Verdict.COMPILE_ERROR
        submission.passed_tests = 0
    else:
        submission.verdict = overall_verdict([item["verdict"] for item in tests])
        submission.passed_tests = sum(item["verdict"] == "accepted" for item in tests)
        submission.max_time_ms = max((item["timeMs"] for item in tests), default=0)
        submission.max_memory_kb = max((item["memoryKb"] for item in tests), default=0)
    submission.auto_score = task_score(
        task.max_score, submission.passed_tests, submission.total_tests
    )
    submission.status = Submission.Status.JUDGED
    submission.save()
    return submission


def fail_judging(*, submission, error):
    submission.status = Submission.Status.FAILED
    submission.compile_log = str(error)[-4000:]
    submission.save(update_fields=["status", "compile_log"])


@transaction.atomic
def grade_submission(*, submission, manual_score, comment, by):
    ensure_editable(submission.task.competition)
    if manual_score > submission.task.max_score:
        raise ValidationError({"manualScore": f"Максимум — {submission.task.max_score}."})
    submission.manual_score = manual_score
    submission.comment = comment
    submission.status = Submission.Status.REVIEWED
    submission.reviewed_by = by
    submission.reviewed_at = timezone.now()
    submission.save()
    title, message = submission_message(
        submission.task.title, manual_score, submission.task.max_score
    )
    notify(user=submission.athlete.user, kind="submission", title=title, message=message)
    return submission


def rejudge(*, submission):
    ensure_editable(submission.task.competition)
    if submission.task.check_type != Task.CheckType.AUTO:
        raise ValidationError({"detail": "Задание проверяется вручную."})
    submission.status = Submission.Status.QUEUED
    submission.save(update_fields=["status"])
    from .judge import enqueue

    transaction.on_commit(lambda: enqueue(submission.id))
    return submission


@transaction.atomic
def replace_tests(*, task, tests):
    ensure_editable(task.competition)
    task.tests.all().delete()
    TestCase.objects.bulk_create(
        TestCase(task=task, order=index, **test) for index, test in enumerate(tests, start=1)
    )
    return task.tests.all()
