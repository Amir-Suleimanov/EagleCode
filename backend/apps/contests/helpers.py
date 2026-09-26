def compare_output(actual: str, expected: str) -> bool:
    return actual.split() == expected.split()


def task_score(max_score: int, passed: int, total: int) -> int:
    return max_score * passed // total if total else 0


def overall_verdict(test_verdicts: list[str]) -> str:
    """The first failing test decides the verdict, as on Codeforces."""
    return next((verdict for verdict in test_verdicts if verdict != "accepted"), "accepted")


def minutes_between(start, moment) -> int:
    return max(0, int((moment - start).total_seconds() // 60))


def build_standings(*, tasks, submissions, participants, started_at):
    """Rank athletes by total score, then by the minute of their last improvement.

    ``participants`` maps athlete id to full name; ``submissions`` must expose
    ``task_id``, ``athlete_id``, ``score`` and ``created_at``. Athletes whose
    total and time match exactly share the place (1, 1, 3).
    """
    cells = {}
    for submission in sorted(submissions, key=lambda item: item.created_at):
        cell = cells.setdefault(
            (submission.athlete_id, submission.task_id),
            {"score": 0, "attempts": 0, "bestAt": None},
        )
        cell["attempts"] += 1
        score = submission.score
        if score is not None and score > cell["score"]:
            cell["score"] = score
            cell["bestAt"] = submission.created_at

    rows = []
    for athlete_id, full_name in participants.items():
        row_tasks, total, penalty = [], 0, 0
        for task in tasks:
            cell = cells.get((athlete_id, task.id), {"score": 0, "attempts": 0, "bestAt": None})
            best_minute = minutes_between(started_at, cell["bestAt"]) if cell["bestAt"] else None
            if best_minute is not None:
                penalty = max(penalty, best_minute)
            total += cell["score"]
            row_tasks.append(
                {
                    "taskId": str(task.id),
                    "score": cell["score"],
                    "attempts": cell["attempts"],
                    "bestMinute": best_minute,
                }
            )
        rows.append(
            {
                "athleteId": str(athlete_id),
                "fullName": full_name,
                "total": total,
                "penaltyMinutes": penalty,
                "tasks": row_tasks,
            }
        )

    rows.sort(key=lambda row: (-row["total"], row["penaltyMinutes"], row["fullName"]))
    for index, row in enumerate(rows):
        previous = rows[index - 1] if index else None
        same = previous and (previous["total"], previous["penaltyMinutes"]) == (
            row["total"],
            row["penaltyMinutes"],
        )
        row["place"] = previous["place"] if same else index + 1
    return rows


def contest_meters(reward: int, total: int, max_total: int) -> int:
    return round(reward * total / max_total) if max_total else 0


def submission_message(task_title: str, score: int, max_score: int) -> tuple[str, str]:
    return "Решение проверено", f"«{task_title}»: {score} из {max_score} баллов."


def contest_result_message(title: str, place: int, total: int) -> tuple[str, str]:
    return "Итоги контеста", f"«{title}»: {place} место, {total} баллов."
