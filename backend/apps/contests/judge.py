import json
import subprocess
import uuid
from concurrent.futures import ThreadPoolExecutor

from django.conf import settings
from django.db import close_old_connections

from .models import Submission

RUNNER_OVERHEAD_MB = 64
_executor = None


class JudgeError(Exception):
    pass


def enqueue(submission_id):
    global _executor
    if settings.JUDGE_SYNC:
        judge_submission(submission_id)
        return
    if _executor is None:
        _executor = ThreadPoolExecutor(
            max_workers=settings.JUDGE_WORKERS, thread_name_prefix="judge"
        )
    _executor.submit(_judge_in_thread, submission_id)


def _judge_in_thread(submission_id):
    close_old_connections()
    try:
        judge_submission(submission_id)
    finally:
        close_old_connections()


def judge_submission(submission_id):
    from .services import fail_judging, save_judge_report

    submission = Submission.objects.select_related("task").get(pk=submission_id)
    task = submission.task
    tests = list(task.tests.all())
    Submission.objects.filter(pk=submission.pk).update(status=Submission.Status.RUNNING)
    payload = {
        "source": submission.source,
        "timeLimitMs": task.time_limit_ms,
        "memoryLimitMb": task.memory_limit_mb,
        "tests": [
            {"input": test.input, "output": test.expected_output, "sample": test.is_sample}
            for test in tests
        ],
    }
    budget = 20 + len(tests) * (task.time_limit_ms / 1000 + 1)
    try:
        report = run_in_container(
            payload, memory_mb=task.memory_limit_mb + RUNNER_OVERHEAD_MB, timeout_s=budget
        )
    except (JudgeError, OSError, ValueError) as error:
        fail_judging(submission=submission, error=error)
        return
    save_judge_report(submission=submission, report=report)


def run_in_container(payload, *, memory_mb, timeout_s):
    """Runs untrusted code in a throwaway container: no network, capped CPU, RAM and pids.

    Code and tests travel through stdin, so nothing from the host is mounted inside.
    """
    name = f"eaglecode-judge-{uuid.uuid4().hex[:12]}"
    command = [
        "docker", "run", "--rm", "-i", "--name", name,
        "--network", "none",
        f"--memory={memory_mb}m", f"--memory-swap={memory_mb}m",
        "--cpus=1", "--pids-limit=64",
        "--read-only", "--tmpfs", "/tmp:rw,exec,size=64m",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        settings.JUDGE_IMAGE,
    ]  # fmt: skip
    try:
        completed = subprocess.run(
            command,
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout_s,
        )
    except subprocess.TimeoutExpired as error:
        subprocess.run(["docker", "kill", name], capture_output=True)
        raise JudgeError("Проверка не уложилась в общий лимит времени.") from error
    if completed.returncode != 0:
        raise JudgeError(completed.stderr.strip()[-2000:] or f"exit {completed.returncode}")
    return json.loads(completed.stdout)
