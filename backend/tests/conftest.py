import pytest
from rest_framework.test import APIClient

from apps.users.models import AthleteProfile, City, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def city(db):
    return City.objects.create(
        name="Махачкала", district="городской округ", latitude=42.98, longitude=47.50
    )


@pytest.fixture
def athlete_user(db, city):
    user = User.objects.create_user(
        email="athlete@test.ru", password="demo123", full_name="Тестовый Спортсмен"
    )
    AthleteProfile.objects.create(user=user, city=city, organization="ДГТУ")
    return user


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@test.ru",
        password="demo123",
        full_name="Администратор",
        role=User.Role.ADMIN,
        is_staff=True,
    )
