from datetime import timedelta
from types import SimpleNamespace

import pytest
from django.utils import timezone

from apps.competitions.models import Competition, CompetitionResult
from apps.contests import judge
from apps.contests.helpers import build_standings, compare_output, overall_verdict, task_score
from apps.contests.models import Submission, Task, TestCase
from apps.users.models import AthleteProfile, Discipline, User

START = timezone.now()


def entry(athlete, task, score, minute):
    return SimpleNamespace(
        athlete_id=athlete,
        task_id=task,
        score=score,
        created_at=START + timedelta(minutes=minute),
    )


def test_scoring_helpers():
    assert task_score(100, 3, 4) == 75
    assert task_score(100, 0, 0) == 0
    assert overall_verdict(["accepted", "time_limit", "wrong_answer"]) == "time_limit"
    assert overall_verdict(["accepted"]) == "accepted"
    assert compare_output("1 2\n3\n", "1 2 3")


def test_standings_best_attempt_tiebreak_and_shared_place():
    tasks = [SimpleNamespace(id="A"), SimpleNamespace(id="B")]
    submissions = [
        entry("ann", "A", 40, 5),
        entry("ann", "A", 100, 30),
        entry("ann", "A", 20, 50),  # a worse later attempt must not lower the score
        entry("bob", "A", 100, 10),
        entry("bob", "B", 30, 20),
        entry("cat", "A", 100, 10),
        entry("cat", "B", 30, 20),
    ]
    rows = build_standings(
        tasks=tasks,
        submissions=submissions,
        participants={"ann": "Анна", "bob": "Борис", "cat": "Катя", "dan": "Данияр"},
        started_at=START,
    )
    table = {row["fullName"]: (row["place"], row["total"]) for row in rows}
    assert table == {
        "Борис": (1, 130),
        "Катя": (1, 130),
        "Анна": (3, 100),
        "Данияр": (4, 0),
    }
    ann = next(row for row in rows if row["fullName"] == "Анна")
    assert ann["tasks"][0] == {"taskId": "A", "score": 100, "attempts": 3, "bestMinute": 30}


@pytest.fixture
def contest(admin_user):
    discipline = Discipline.objects.create(name="Программирование алгоритмическое")
    now = timezone.now()
    return Competition.objects.create(
        title="Тестовый контест",
        description="Описание",
        discipline=discipline,
        format=Competition.Format.CONTEST,
        location="Онлайн",
        starts_at=now + timedelta(hours=1),
        ends_at=now + timedelta(hours=3),
        registration_ends_at=now + timedelta(hours=3),
        capacity=100,
        reward_meters=1000,
        status=Competition.Status.DRAFT,
        created_by=admin_user,
    )


@pytest.fixture
def auto_task(contest):
    task = Task.objects.create(
        competition=contest, order=1, title="A+B", statement="Сложите", max_score=100
    )
    for order, (data, answer) in enumerate([("1 2", "3"), ("5 5", "10")], start=1):
        TestCase.objects.create(
            task=task, order=order, input=data, expected_output=answer, is_sample=order == 1
        )
    return task


@pytest.fixture
def manual_task(contest):
    return Task.objects.create(
        competition=contest,
        order=2,
        title="Эссе",
        statement="Опишите подход",
        max_score=50,
        check_type=Task.CheckType.MANUAL,
    )


def set_status(client, contest, status):
    return client.post(f"/api/competitions/{contest.id}/status", {"status": status}, format="json")


@pytest.mark.django_db
def test_contest_is_created_as_draft_and_hidden_from_athletes(api_client, admin_user, athlete_user):
    Discipline.objects.create(name="Программирование продуктовое")
    api_client.force_authenticate(admin_user)
    now = timezone.now()
    response = api_client.post(
        "/api/competitions",
        {
            "title": "Новый контест",
            "description": "Кратко",
            "discipline": "Программирование продуктовое",
            "format": "contest",
            "startsAt": now.isoformat(),
            "endsAt": (now + timedelta(hours=2)).isoformat(),
            "rewardMeters": 500,
            "rules": "Без интернета",
        },
        format="json",
    )
    assert response.status_code == 201, response.data
    assert response.data["status"] == "draft"
    assert response.data["location"] == "Онлайн"

    api_client.force_authenticate(athlete_user)
    assert api_client.get("/api/competitions").data == []
    assert api_client.get(f"/api/competitions/{response.data['id']}/tasks").status_code == 404


@pytest.mark.django_db
def test_publish_requires_tasks_and_follows_the_chain(api_client, admin_user, contest):
    api_client.force_authenticate(admin_user)
    assert set_status(api_client, contest, "registration").status_code == 400
    Task.objects.create(competition=contest, title="A", statement="…")
    assert set_status(api_client, contest, "finished").status_code == 400
    assert set_status(api_client, contest, "registration").status_code == 200
    response = set_status(api_client, contest, "active")
    assert response.data["status"] == "active"
    contest.refresh_from_db()
    assert contest.starts_at <= timezone.now()


@pytest.mark.django_db
def test_full_scenario_ends_in_profile_and_rating(
    api_client,
    admin_user,
    athlete_user,
    contest,
    auto_task,
    manual_task,
    settings,
    monkeypatch,
    django_capture_on_commit_callbacks,
):
    settings.JUDGE_SYNC = True
    monkeypatch.setattr(
        judge,
        "run_in_container",
        lambda payload, **_: {
            "compileError": False,
            "log": "",
            "tests": [
                {"test": 1, "verdict": "accepted", "timeMs": 40, "memoryKb": 9000},
                {"test": 2, "verdict": "wrong_answer", "timeMs": 42, "memoryKb": 9100},
            ],
        },
    )
    api_client.force_authenticate(admin_user)
    set_status(api_client, contest, "registration")

    api_client.force_authenticate(athlete_user)
    tasks = api_client.get(f"/api/competitions/{contest.id}/tasks").data
    assert tasks == []  # statements stay hidden until the start
    assert (
        api_client.post(
            "/api/submissions",
            {"taskId": str(auto_task.id), "language": "python", "source": "print(3)"},
            format="json",
        ).status_code
        == 400
    )

    api_client.force_authenticate(admin_user)
    set_status(api_client, contest, "active")

    api_client.force_authenticate(athlete_user)
    tasks = api_client.get(f"/api/competitions/{contest.id}/tasks").data
    assert [task["title"] for task in tasks] == ["A+B", "Эссе"]
    assert tasks[0]["samples"] == [{"input": "1 2", "expectedOutput": "3", "isSample": True}]
    assert "tests" not in tasks[0]

    with django_capture_on_commit_callbacks(execute=True):
        code = api_client.post(
            "/api/submissions",
            {"taskId": str(auto_task.id), "language": "python", "source": "print(3)"},
            format="json",
        )
    assert code.status_code == 201, code.data
    judged = Submission.objects.get(pk=code.data["id"])
    assert (judged.status, judged.verdict, judged.auto_score) == ("judged", "wrong_answer", 50)

    Submission.objects.update(created_at=timezone.now() - timedelta(minutes=1))
    essay = api_client.post(
        "/api/submissions",
        {"taskId": str(manual_task.id), "language": "text", "source": "https://github.com/x"},
        format="json",
    )
    assert essay.data["status"] == "pending_review"

    api_client.force_authenticate(admin_user)
    graded = api_client.patch(
        f"/api/submissions/{essay.data['id']}",
        {"manualScore": 40, "comment": "Хорошо"},
        format="json",
    )
    assert graded.data["score"] == 40
    assert (
        api_client.patch(
            f"/api/submissions/{essay.data['id']}", {"manualScore": 999}, format="json"
        ).status_code
        == 400
    )

    standings = api_client.get(f"/api/competitions/{contest.id}/standings").data
    assert standings[0]["total"] == 90 and standings[0]["place"] == 1

    assert set_status(api_client, contest, "finished").status_code == 200
    profile = AthleteProfile.objects.get(user=athlete_user)
    result = CompetitionResult.objects.get(competition=contest, athlete=profile)
    assert (result.place, result.score, result.meters_awarded) == (1, "90 / 150", 600)
    assert profile.meters_balance == 600
    assert profile.user.notifications.filter(kind="contest").exists()
    assert (
        api_client.patch(
            f"/api/submissions/{essay.data['id']}", {"manualScore": 10}, format="json"
        ).status_code
        == 400
    )


@pytest.mark.django_db
def test_athletes_only_see_their_own_submissions(api_client, athlete_user, city, auto_task):
    other = User.objects.create_user(email="other@test.ru", password="x", full_name="Другой")
    other_profile = AthleteProfile.objects.create(user=other, city=city, organization="ДГУ")
    Submission.objects.create(
        task=auto_task,
        athlete=other_profile,
        language="python",
        source="print(1)",
        status=Submission.Status.JUDGED,
    )
    api_client.force_authenticate(athlete_user)
    assert api_client.get("/api/submissions").data == []


@pytest.mark.django_db
def test_demo_seed_is_idempotent_and_publishes_contest_results():
    from django.core.management import call_command

    call_command("seed_demo")
    call_command("seed_demo")
    finished = Competition.objects.get(
        title="Тестовый контест по алгоритмическому программированию"
    )
    places = dict(
        CompetitionResult.objects.filter(competition=finished).values_list(
            "athlete__user__email", "place"
        )
    )
    assert places["amina@eaglecode.ru"] == 1
    assert places["athlete@eaglecode.ru"] == 2  # same 250 as Патимат, but earlier
    assert places["patimat@eaglecode.ru"] == 3
    assert places["zarema@eaglecode.ru"] == places["murad@eaglecode.ru"]  # exact tie
    live = Competition.objects.get(title="Онлайн-раунд ТехноСпортФест")
    assert live.status == Competition.Status.ACTIVE and live.tasks.count() == 3


@pytest.mark.django_db
def test_judge_failure_is_recorded(auto_task, athlete_user, monkeypatch):
    def broken(*_args, **_kwargs):
        raise judge.JudgeError("docker is not running")

    monkeypatch.setattr(judge, "run_in_container", broken)
    submission = Submission.objects.create(
        task=auto_task,
        athlete=athlete_user.athlete_profile,
        language="python",
        source="print(1)",
        status=Submission.Status.QUEUED,
    )
    judge.judge_submission(submission.id)
    submission.refresh_from_db()
    assert submission.status == "failed"
    assert "docker" in submission.compile_log
