from rest_framework import serializers

from apps.competitions.models import Application, Competition, CompetitionResult
from apps.users.models import AthleteProfile, Discipline


class CompetitionSerializer(serializers.ModelSerializer):
    discipline = serializers.SlugRelatedField(slug_field="name", queryset=Discipline.objects.all())
    startsAt = serializers.DateTimeField(source="starts_at")
    endsAt = serializers.DateTimeField(source="ends_at")
    registrationEndsAt = serializers.DateTimeField(source="registration_ends_at")
    rewardMeters = serializers.IntegerField(source="reward_meters")

    class Meta:
        model = Competition
        fields = [
            "id",
            "title",
            "description",
            "discipline",
            "location",
            "startsAt",
            "endsAt",
            "registrationEndsAt",
            "capacity",
            "rewardMeters",
            "status",
            "schedule",
        ]


class ApplicationSerializer(serializers.ModelSerializer):
    athleteId = serializers.PrimaryKeyRelatedField(
        source="athlete", queryset=AthleteProfile.objects.all()
    )
    competitionId = serializers.PrimaryKeyRelatedField(
        source="competition", queryset=Competition.objects.all()
    )
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Application
        fields = ["id", "athleteId", "competitionId", "status", "createdAt"]
        read_only_fields = ["status"]


class ApplicationStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[Application.Status.APPROVED, Application.Status.REJECTED]
    )


class CompetitionResultSerializer(serializers.ModelSerializer):
    competitionId = serializers.PrimaryKeyRelatedField(
        source="competition", queryset=Competition.objects.all()
    )
    athleteId = serializers.PrimaryKeyRelatedField(
        source="athlete", queryset=AthleteProfile.objects.all()
    )
    metersAwarded = serializers.IntegerField(source="meters_awarded", min_value=0)
    publishedAt = serializers.DateTimeField(source="published_at", read_only=True)

    class Meta:
        model = CompetitionResult
        fields = [
            "id",
            "competitionId",
            "athleteId",
            "place",
            "score",
            "metersAwarded",
            "publishedAt",
        ]
