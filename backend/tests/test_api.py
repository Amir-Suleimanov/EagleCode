import pytest


@pytest.mark.django_db
def test_register_login_and_me(api_client, city):
    payload = {
        "fullName": "Новый Спортсмен",
        "email": "new@test.ru",
        "password": "demo123",
        "cityId": str(city.id),
        "organization": "СШОР",
    }
    response = api_client.post("/api/auth/register", payload, format="json")
    assert response.status_code == 201
    assert response.data["user"]["fullName"] == payload["fullName"]
    assert response.data["accessToken"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['accessToken']}")
    assert api_client.get("/api/auth/me").status_code == 200


@pytest.mark.django_db
def test_athlete_cannot_add_meters(api_client, athlete_user):
    api_client.force_authenticate(athlete_user)
    response = api_client.post(
        "/api/rating/meters",
        {
            "athleteId": str(athlete_user.athlete_profile.id),
            "amount": 100,
            "reason": "Тест",
            "protocol": "T-1",
        },
        format="json",
    )
    assert response.status_code == 403
