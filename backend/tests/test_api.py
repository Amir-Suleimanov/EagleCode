import pytest

# The landing page and the signup form are rendered before anyone can log in,
# so the catalogue they read must stay reachable without a token.
PUBLIC_READ_ENDPOINTS = ["/api/cities", "/api/competitions", "/api/athletes", "/api/levels"]
PRIVATE_ENDPOINTS = [
    "/api/applications",
    "/api/results",
    "/api/notifications",
    "/api/rating/transactions",
]


@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", PUBLIC_READ_ENDPOINTS)
def test_public_catalogue_is_readable_anonymously(api_client, city, endpoint):
    assert api_client.get(endpoint).status_code == 200


@pytest.mark.django_db
@pytest.mark.parametrize("endpoint", PRIVATE_ENDPOINTS)
def test_private_endpoints_still_require_auth(api_client, endpoint):
    assert api_client.get(endpoint).status_code == 401


@pytest.mark.django_db
def test_anonymous_cannot_write_to_public_catalogue(api_client, city):
    assert api_client.post("/api/competitions", {}, format="json").status_code == 401


@pytest.mark.django_db
def test_public_roster_hides_emails(api_client, athlete_user):
    anonymous = api_client.get("/api/athletes").data
    assert anonymous and "email" not in anonymous[0]

    api_client.force_authenticate(athlete_user)
    assert "email" in api_client.get("/api/athletes").data[0]


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
def test_refresh_rejects_unusable_token(api_client, athlete_user):
    tokens = api_client.post(
        "/api/auth/login",
        {"email": athlete_user.email, "password": "demo123"},
        format="json",
    ).data
    first = api_client.post(
        "/api/auth/refresh", {"refreshToken": tokens["refreshToken"]}, format="json"
    )
    assert first.status_code == 200

    replayed = api_client.post(
        "/api/auth/refresh", {"refreshToken": tokens["refreshToken"]}, format="json"
    )
    assert replayed.status_code == 401

    malformed = api_client.post("/api/auth/refresh", {"refreshToken": "nonsense"}, format="json")
    assert malformed.status_code == 401


@pytest.mark.django_db
def test_logout_is_idempotent(api_client, athlete_user):
    tokens = api_client.post(
        "/api/auth/login",
        {"email": athlete_user.email, "password": "demo123"},
        format="json",
    ).data
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['accessToken']}")

    for _ in range(2):
        response = api_client.post(
            "/api/auth/logout", {"refreshToken": tokens["refreshToken"]}, format="json"
        )
        assert response.status_code == 204

    assert (
        api_client.post(
            "/api/auth/refresh", {"refreshToken": tokens["refreshToken"]}, format="json"
        ).status_code
        == 401
    )


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
