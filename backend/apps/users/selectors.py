from django.db.models import Count, Sum
from django.db.models.functions import Coalesce

from .models import AthleteProfile, City


def athletes(params=None):
    params = params or {}
    queryset = AthleteProfile.objects.select_related("user", "city").prefetch_related("disciplines")
    if search := params.get("search"):
        queryset = queryset.filter(user__full_name__icontains=search)
    if city_id := params.get("cityId"):
        queryset = queryset.filter(city_id=city_id)
    if discipline := params.get("discipline"):
        queryset = queryset.filter(disciplines__name=discipline)
    return queryset.order_by("-meters_balance", "user__full_name").distinct()


def cities_with_rating():
    return City.objects.annotate(
        participant_count=Count("athletes", distinct=True),
        meters=Coalesce(Sum("athletes__meters_balance"), 0),
    ).order_by("-meters", "name")
