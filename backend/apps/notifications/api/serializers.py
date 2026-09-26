from django.utils import timezone
from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    readAt = serializers.DateTimeField(source="read_at", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    read = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Notification
        fields = ["id", "kind", "title", "message", "readAt", "createdAt", "read"]
        read_only_fields = ["kind", "title", "message"]

    def update(self, instance, validated_data):
        if validated_data.get("read"):
            instance.read_at = timezone.now()
            instance.save(update_fields=["read_at"])
        return instance
