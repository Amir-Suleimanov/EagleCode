from django.db import transaction

from .models import AthleteProfile, User


@transaction.atomic
def register_athlete(*, full_name, email, password, city, organization):
    user = User.objects.create_user(email=email, password=password, full_name=full_name)
    AthleteProfile.objects.create(user=user, city=city, organization=organization)
    return user
