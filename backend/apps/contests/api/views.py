from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.competitions.api.serializers import ApplicationSerializer, CompetitionSerializer
from apps.competitions.models import Competition
from apps.contests.models import Submission, Task
from apps.contests.selectors import is_admin, standings, submissions_for, tasks_for
from apps.contests.services import (
    change_status,
    ensure_editable,
    grade_submission,
    join_contest,
    rejudge,
    replace_tests,
    submit_solution,
    sync_statuses,
)
from common.permissions import IsPlatformAdmin

from .serializers import (
    GradeSerializer,
    StandingRowSerializer,
    StatusSerializer,
    SubmissionSerializer,
    TaskSerializer,
    TestCaseSerializer,
)

OPEN_STATUSES = [Competition.Status.ACTIVE, Competition.Status.FINISHED]


def athlete_of(user):
    profile = getattr(user, "athlete_profile", None)
    if profile is None:
        raise PermissionDenied("Отправлять решения могут только спортсмены.")
    return profile


def visible_competition(request, pk):
    sync_statuses()
    competition = get_object_or_404(Competition, pk=pk)
    if competition.status == Competition.Status.DRAFT and not is_admin(request.user):
        raise NotFound()
    return competition


class CompetitionStatusView(APIView):
    permission_classes = [IsPlatformAdmin]

    @extend_schema(request=StatusSerializer, responses=CompetitionSerializer)
    def post(self, request, pk):
        serializer = StatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        competition = change_status(
            competition=get_object_or_404(Competition, pk=pk),
            status=serializer.validated_data["status"],
            by=request.user,
        )
        return Response(CompetitionSerializer(competition).data)


class CompetitionTasksView(APIView):
    @extend_schema(responses=TaskSerializer(many=True))
    def get(self, request, pk):
        competition = visible_competition(request, pk)
        if not is_admin(request.user) and competition.status not in OPEN_STATUSES:
            return Response([])
        return Response(TaskSerializer(tasks_for(competition), many=True).data)


class JoinContestView(APIView):
    @extend_schema(request=None, responses=ApplicationSerializer)
    def post(self, request, pk):
        application = join_contest(
            athlete=athlete_of(request.user), competition=visible_competition(request, pk)
        )
        return Response(ApplicationSerializer(application).data)


class StandingsView(APIView):
    @extend_schema(responses=StandingRowSerializer(many=True))
    def get(self, request, pk):
        competition = visible_competition(request, pk)
        return Response(StandingRowSerializer(standings(competition), many=True).data)


class TaskViewSet(ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsPlatformAdmin]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Task.objects.prefetch_related("tests")

    def perform_create(self, serializer):
        ensure_editable(serializer.validated_data["competition"])
        serializer.save()

    def perform_update(self, serializer):
        ensure_editable(serializer.instance.competition)
        serializer.save()

    def perform_destroy(self, instance):
        ensure_editable(instance.competition)
        if instance.submissions.exists():
            raise ValidationError({"detail": "По заданию уже есть решения — удалить нельзя."})
        instance.delete()

    @extend_schema(request=TestCaseSerializer(many=True), responses=TestCaseSerializer(many=True))
    @action(detail=True, methods=["get", "put"], url_path="tests")
    def tests(self, request, pk=None):
        task = self.get_object()
        if request.method == "PUT":
            serializer = TestCaseSerializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            replace_tests(task=task, tests=serializer.validated_data)
        return Response(TestCaseSerializer(task.tests.all(), many=True).data)


class SubmissionViewSet(ModelViewSet):
    queryset = Submission.objects.none()
    serializer_class = SubmissionSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return submissions_for(self.request.user, self.request.query_params)

    def get_permissions(self):
        if self.action in ["partial_update", "rejudge"]:
            return [IsPlatformAdmin()]
        return super().get_permissions()

    def create(self, request):
        sync_statuses()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = submit_solution(
            athlete=athlete_of(request.user),
            task=serializer.validated_data["task"],
            language=serializer.validated_data["language"],
            source=serializer.validated_data["source"],
        )
        return Response(self.get_serializer(submission).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=GradeSerializer, responses=SubmissionSerializer)
    def partial_update(self, request, *args, **kwargs):
        serializer = GradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission = grade_submission(
            submission=self.get_object(),
            manual_score=serializer.validated_data["manualScore"],
            comment=serializer.validated_data["comment"],
            by=request.user,
        )
        return Response(self.get_serializer(submission).data)

    @extend_schema(request=None, responses=SubmissionSerializer)
    @action(detail=True, methods=["post"])
    def rejudge(self, request, pk=None):
        return Response(self.get_serializer(rejudge(submission=self.get_object())).data)
