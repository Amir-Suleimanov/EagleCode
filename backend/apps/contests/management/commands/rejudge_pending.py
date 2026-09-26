from django.core.management.base import BaseCommand

from apps.contests.judge import judge_submission
from apps.contests.models import Submission


class Command(BaseCommand):
    help = "Re-run submissions left queued or running by a server restart"

    def handle(self, *args, **options):
        stuck = Submission.objects.filter(
            status__in=[Submission.Status.QUEUED, Submission.Status.RUNNING]
        ).values_list("id", flat=True)
        for submission_id in list(stuck):
            judge_submission(submission_id)
        self.stdout.write(self.style.SUCCESS(f"Rejudged: {len(stuck)}"))
