from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.competitions.models import Application, CompetitionResult
from apps.competitions.selectors import applications_for, competitions, results
from apps.competitions.services import publish_result, review_application, submit_application
from common.permissions import IsPlatformAdmin

from .serializers import (
    ApplicationSerializer,
    ApplicationStatusSerializer,
    CompetitionResultSerializer,
    CompetitionSerializer,
)


class CompetitionViewSet(ModelViewSet):
    serializer_class = CompetitionSerializer

    def get_queryset(self):
        return competitions(self.request.query_params)

    def get_permissions(self):
        return (
            super().get_permissions()
            if self.action in ["list", "retrieve"]
            else [IsPlatformAdmin()]
        )

    def perform_destroy(self, instance):
        if instance.applications.exists() or instance.results.exists():
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"detail": "Нельзя удалить соревнование с заявками или результатами."}
            )
        instance.delete()


class ApplicationViewSet(ModelViewSet):
    queryset = Application.objects.none()
    serializer_class = ApplicationSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return applications_for(self.request.user, self.request.query_params)

    def get_permissions(self):
        return [IsPlatformAdmin()] if self.action == "partial_update" else super().get_permissions()

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        athlete = serializer.validated_data["athlete"]
        if request.user.role != "admin" and athlete.user_id != request.user.id:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Нельзя подать заявку от другого спортсмена.")
        application = submit_application(
            athlete=athlete, competition=serializer.validated_data["competition"]
        )
        return Response(self.get_serializer(application).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        serializer = ApplicationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = review_application(
            application=self.get_object(),
            status=serializer.validated_data["status"],
            reviewed_by=request.user,
        )
        return Response(self.get_serializer(application).data)


class ResultViewSet(ModelViewSet):
    queryset = CompetitionResult.objects.none()
    serializer_class = CompetitionResultSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return results(self.request.query_params)

    def get_permissions(self):
        return (
            super().get_permissions()
            if self.action in ["list", "retrieve"]
            else [IsPlatformAdmin()]
        )

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = publish_result(published_by=request.user, **serializer.validated_data)
        return Response(self.get_serializer(result).data, status=status.HTTP_201_CREATED)
