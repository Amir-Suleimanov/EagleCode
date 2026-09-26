from rest_framework import serializers

from apps.competitions.models import Application, Competition, CompetitionResult
from apps.users.models import AthleteProfile, Discipline


class CompetitionSerializer(serializers.ModelSerializer):
    discipline = serializers.SlugRelatedField(slug_field="name", queryset=Discipline.objects.all())
    startsAt = serializers.DateTimeField(source="starts_at")
    endsAt = serializers.DateTimeField(source="ends_at")
    registrationEndsAt = serializers.DateTimeField(source="registration_ends_at", required=False)
    rewardMeters = serializers.IntegerField(source="reward_meters", min_value=0)
    location = serializers.CharField(max_length=255, required=False)
    capacity = serializers.IntegerField(min_value=1, required=False)
    schedule = serializers.JSONField(required=False)
    rules = serializers.CharField(allow_blank=True, required=False)
    externalPlatform = serializers.CharField(
        source="external_platform", allow_blank=True, max_length=80, required=False
    )
    externalUrl = serializers.URLField(source="external_url", allow_blank=True, required=False)
    taskCount = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = [
            "id",
            "title",
            "description",
            "discipline",
            "format",
            "location",
            "startsAt",
            "endsAt",
            "registrationEndsAt",
            "capacity",
            "rewardMeters",
            "status",
            "schedule",
            "rules",
            "externalPlatform",
            "externalUrl",
            "taskCount",
        ]

    def get_taskCount(self, competition) -> int:
        return competition.tasks.count()

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError({"endsAt": "Окончание должно быть позже начала."})
        contest = attrs.get("format", getattr(self.instance, "format", None)) == "contest"
        if contest:
            if self.instance is None:
                # Contests always start life as a draft and move on via the status endpoint.
                attrs["status"] = Competition.Status.DRAFT
                attrs.setdefault("location", "Онлайн")
                attrs.setdefault("capacity", 1000)
                attrs.setdefault("schedule", [])
            else:
                attrs.pop("status", None)
                if self.instance.status == Competition.Status.FINISHED:
                    raise serializers.ValidationError({"detail": "Контест завершён."})
            attrs["registration_ends_at"] = ends_at
        elif self.instance is None:
            missing = [
                name
                for name, key in [
                    ("location", "location"),
                    ("capacity", "capacity"),
                    ("registrationEndsAt", "registration_ends_at"),
                ]
                if key not in attrs
            ]
            if missing:
                raise serializers.ValidationError({name: "Обязательное поле." for name in missing})
        return attrs


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
