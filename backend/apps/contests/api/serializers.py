from rest_framework import serializers

from apps.competitions.models import Competition
from apps.contests.models import Submission, Task, TestCase


class TestCaseSerializer(serializers.ModelSerializer):
    __test__ = False

    expectedOutput = serializers.CharField(source="expected_output", trim_whitespace=False)
    input = serializers.CharField(allow_blank=True, trim_whitespace=False)
    isSample = serializers.BooleanField(source="is_sample", default=False)

    class Meta:
        model = TestCase
        fields = ["input", "expectedOutput", "isSample"]


class TaskSerializer(serializers.ModelSerializer):
    competitionId = serializers.PrimaryKeyRelatedField(
        source="competition", queryset=Competition.objects.all()
    )
    maxScore = serializers.IntegerField(source="max_score", min_value=1, max_value=1000)
    checkType = serializers.ChoiceField(source="check_type", choices=Task.CheckType.choices)
    timeLimitMs = serializers.IntegerField(
        source="time_limit_ms", min_value=100, max_value=10000, default=1000
    )
    memoryLimitMb = serializers.IntegerField(
        source="memory_limit_mb", min_value=32, max_value=512, default=256
    )
    materialsUrl = serializers.URLField(source="materials_url", allow_blank=True, default="")
    samples = serializers.SerializerMethodField()
    testCount = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "competitionId",
            "order",
            "title",
            "statement",
            "maxScore",
            "checkType",
            "timeLimitMs",
            "memoryLimitMb",
            "materialsUrl",
            "samples",
            "testCount",
        ]

    def get_samples(self, task) -> list[dict]:
        samples = [test for test in task.tests.all() if test.is_sample]
        return TestCaseSerializer(samples, many=True).data

    def get_testCount(self, task) -> int:
        return len(task.tests.all())


class SubmissionSerializer(serializers.ModelSerializer):
    taskId = serializers.PrimaryKeyRelatedField(source="task", queryset=Task.objects.all())
    competitionId = serializers.UUIDField(source="task.competition_id", read_only=True)
    athleteId = serializers.UUIDField(source="athlete_id", read_only=True)
    athleteName = serializers.CharField(source="athlete.user.full_name", read_only=True)
    taskTitle = serializers.CharField(source="task.title", read_only=True)
    maxScore = serializers.IntegerField(source="task.max_score", read_only=True)
    source = serializers.CharField(max_length=65536, trim_whitespace=False)
    score = serializers.IntegerField(read_only=True, allow_null=True)
    autoScore = serializers.IntegerField(source="auto_score", read_only=True, allow_null=True)
    manualScore = serializers.IntegerField(source="manual_score", read_only=True, allow_null=True)
    passedTests = serializers.IntegerField(source="passed_tests", read_only=True)
    totalTests = serializers.IntegerField(source="total_tests", read_only=True)
    maxTimeMs = serializers.IntegerField(source="max_time_ms", read_only=True, allow_null=True)
    maxMemoryKb = serializers.IntegerField(source="max_memory_kb", read_only=True, allow_null=True)
    log = serializers.CharField(source="compile_log", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    reviewedAt = serializers.DateTimeField(source="reviewed_at", read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "taskId",
            "competitionId",
            "athleteId",
            "athleteName",
            "taskTitle",
            "maxScore",
            "language",
            "source",
            "status",
            "verdict",
            "score",
            "autoScore",
            "manualScore",
            "comment",
            "passedTests",
            "totalTests",
            "maxTimeMs",
            "maxMemoryKb",
            "report",
            "log",
            "createdAt",
            "reviewedAt",
        ]
        read_only_fields = ["status", "verdict", "comment", "report"]


class GradeSerializer(serializers.Serializer):
    manualScore = serializers.IntegerField(min_value=0)
    comment = serializers.CharField(allow_blank=True, default="")


class StatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            Competition.Status.REGISTRATION,
            Competition.Status.ACTIVE,
            Competition.Status.FINISHED,
        ]
    )


class StandingTaskSerializer(serializers.Serializer):
    taskId = serializers.CharField()
    score = serializers.IntegerField()
    attempts = serializers.IntegerField()
    bestMinute = serializers.IntegerField(allow_null=True)


class StandingRowSerializer(serializers.Serializer):
    place = serializers.IntegerField()
    athleteId = serializers.CharField()
    fullName = serializers.CharField()
    total = serializers.IntegerField()
    penaltyMinutes = serializers.IntegerField()
    tasks = StandingTaskSerializer(many=True)
