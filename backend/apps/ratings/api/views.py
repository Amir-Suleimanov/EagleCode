from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.ratings.selectors import achievements_for, levels, transactions_for
from apps.ratings.services import add_meters, update_level
from common.permissions import IsPlatformAdmin

from .serializers import AchievementSerializer, EagleLevelSerializer, MeterTransactionSerializer


class LevelViewSet(ModelViewSet):
    serializer_class = EagleLevelSerializer
    lookup_field = "code"
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return levels()

    def get_permissions(self):
        return (
            super().get_permissions()
            if self.action in ["list", "retrieve"]
            else [IsPlatformAdmin()]
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["levels"] = list(levels())
        return context

    def partial_update(self, request, *args, **kwargs):
        level = self.get_object()
        serializer = self.get_serializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        level = update_level(
            level=level,
            name=serializer.validated_data.get("name"),
            min_meters=serializer.validated_data.get("min_meters"),
        )
        return Response(self.get_serializer(level).data)


class TransactionListView(ListAPIView):
    serializer_class = MeterTransactionSerializer

    def get_queryset(self):
        return transactions_for(self.request.user)


class AddMetersView(GenericAPIView):
    permission_classes = [IsPlatformAdmin]
    serializer_class = MeterTransactionSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = add_meters(created_by=request.user, **serializer.validated_data)
        return Response(self.get_serializer(entry).data, status=201)


class AchievementListView(ListAPIView):
    serializer_class = AchievementSerializer

    def get_queryset(self):
        athlete_id = self.kwargs["athlete_id"]
        if self.request.user.role != "admin" and str(self.request.user.athlete_profile.id) != str(
            athlete_id
        ):
            raise PermissionDenied("Достижения доступны только владельцу профиля и администратору.")
        return achievements_for(athlete_id)
