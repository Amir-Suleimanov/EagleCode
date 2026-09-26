from rest_framework import serializers

from apps.ratings.helpers import max_meters_for
from apps.ratings.models import Achievement, EagleLevel, MeterTransaction
from apps.ratings.selectors import levels


class EagleLevelSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="code", read_only=True)
    minMeters = serializers.IntegerField(source="min_meters", required=False)
    maxMeters = serializers.SerializerMethodField()

    class Meta:
        model = EagleLevel
        fields = ["id", "order", "name", "minMeters", "maxMeters"]
        read_only_fields = ["order"]

    def get_maxMeters(self, obj) -> int | None:
        return max_meters_for(obj, self.context.get("levels", list(levels())))


class MeterTransactionSerializer(serializers.ModelSerializer):
    athleteId = serializers.UUIDField(source="athlete_id")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = MeterTransaction
        fields = ["id", "athleteId", "amount", "reason", "protocol", "createdAt"]


class AchievementSerializer(serializers.ModelSerializer):
    athleteId = serializers.UUIDField(source="athlete_id", read_only=True)
    earnedAt = serializers.DateField(source="earned_at", read_only=True)

    class Meta:
        model = Achievement
        fields = ["id", "athleteId", "title", "description", "category", "status", "earnedAt"]
