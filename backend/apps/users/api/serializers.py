from rest_framework import serializers

from apps.users.helpers import build_initials
from apps.users.models import AthleteProfile, City, Discipline, User


class SessionUserSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="full_name")
    athleteId = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "fullName", "role", "athleteId"]

    def get_athleteId(self, obj) -> str | None:
        return str(obj.athlete_profile.id) if hasattr(obj, "athlete_profile") else None


class RegisterSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    cityId = serializers.PrimaryKeyRelatedField(source="city", queryset=City.objects.all())
    organization = serializers.CharField(max_length=255)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RefreshTokenSerializer(serializers.Serializer):
    refreshToken = serializers.CharField()


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "name"]


class AthleteSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    cityId = serializers.UUIDField(source="city_id")
    disciplines = serializers.SlugRelatedField(
        slug_field="name", many=True, queryset=Discipline.objects.all(), required=False
    )
    sportTitle = serializers.CharField(source="sport_title", required=False)
    meters = serializers.IntegerField(source="meters_balance", read_only=True)
    avatarInitials = serializers.SerializerMethodField()
    joinedAt = serializers.DateTimeField(source="user.date_joined", read_only=True)

    class Meta:
        model = AthleteProfile
        fields = [
            "id",
            "fullName",
            "email",
            "organization",
            "cityId",
            "disciplines",
            "sportTitle",
            "meters",
            "avatarInitials",
            "joinedAt",
        ]

    def get_avatarInitials(self, obj) -> str:
        return build_initials(obj.user.full_name)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # The roster is public, but a participant's email is not: only the athlete
        # themselves and platform admins may read it.
        request = self.context.get("request")
        viewer = getattr(request, "user", None)
        owner = viewer is not None and viewer.is_authenticated and viewer == instance.user
        admin = (
            viewer is not None
            and viewer.is_authenticated
            and (viewer.role == "admin" or viewer.is_superuser)
        )
        if not owner and not admin:
            data.pop("email", None)
        return data


class CitySerializer(serializers.ModelSerializer):
    coordinates = serializers.SerializerMethodField()
    participantCount = serializers.IntegerField(source="participant_count", read_only=True)
    meters = serializers.IntegerField(read_only=True)
    position = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = ["id", "name", "district", "coordinates", "participantCount", "meters", "position"]

    def get_coordinates(self, obj) -> list[float]:
        return [float(obj.latitude), float(obj.longitude)]

    def get_position(self, obj) -> int | None:
        positions = self.context.get("positions", {})
        return positions.get(obj.id)
