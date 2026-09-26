from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.competitions.models import Application, Competition
from apps.ratings.models import Achievement, EagleLevel
from apps.users.models import AthleteProfile, City, Discipline, User

LEVELS = [
    ("I", 1, "Первый взлёт", 0),
    ("II", 2, "Уверенный старт", 1_000),
    ("III", 3, "Спортивный характер", 2_500),
    ("IV", 4, "Сильное крыло", 5_000),
    ("V", 5, "Мастер высоты", 14_000),
    ("VI", 6, "Лидер района", 25_000),
    ("VII", 7, "Чемпион республики", 50_000),
    ("VIII", 8, "Наставник", 75_000),
    ("IX", 9, "Легенда спорта", 100_000),
    ("X", 10, "Вершина Дагестана", 150_000),
]


class Command(BaseCommand):
    help = "Create or update EagleCode demonstration data"

    @transaction.atomic
    def handle(self, *args, **options):
        cities = {}
        for name, district, lat, lon in [
            ("Махачкала", "городской округ", 42.98, 47.50),
            ("Дербент", "городской округ", 42.06, 48.29),
            ("Хасавюрт", "городской округ", 43.25, 46.59),
            ("Каспийск", "городской округ", 42.88, 47.64),
            ("Буйнакск", "городской округ", 42.82, 47.12),
        ]:
            cities[name], _ = City.objects.update_or_create(
                name=name, defaults={"district": district, "latitude": lat, "longitude": lon}
            )
        disciplines = {
            name: Discipline.objects.get_or_create(name=name)[0]
            for name in [
                "Лёгкая атлетика",
                "Триатлон",
                "Вольная борьба",
                "Плавание",
                "Бокс",
                "Стрельба из лука",
                "Трейлраннинг",
            ]
        }
        for code, order, name, minimum in LEVELS:
            EagleLevel.objects.update_or_create(
                code=code, defaults={"order": order, "name": name, "min_meters": minimum}
            )

        admin, _ = User.objects.update_or_create(
            email="admin@eaglecode.ru",
            defaults={"full_name": "Шамиль Гаджиев", "role": User.Role.ADMIN, "is_staff": True},
        )
        admin.set_password("demo123")
        admin.save(update_fields=["password"])
        athlete_user, _ = User.objects.update_or_create(
            email="athlete@eaglecode.ru",
            defaults={"full_name": "Магомед Алиев", "role": User.Role.ATHLETE},
        )
        athlete_user.set_password("demo123")
        athlete_user.save(update_fields=["password"])
        athlete, _ = AthleteProfile.objects.update_or_create(
            user=athlete_user,
            defaults={
                "organization": "ДГТУ",
                "city": cities["Махачкала"],
                "sport_title": "I разряд",
                "meters_balance": 12_480,
            },
        )
        athlete.disciplines.set([disciplines["Лёгкая атлетика"], disciplines["Триатлон"]])

        now = timezone.now()
        competition, _ = Competition.objects.update_or_create(
            title="Кубок Дагестана по лёгкой атлетике",
            defaults={
                "description": "Республиканский старт среди взрослых и юниоров.",
                "discipline": disciplines["Лёгкая атлетика"],
                "location": "Махачкала, стадион «Труд»",
                "starts_at": now + timedelta(days=16),
                "ends_at": now + timedelta(days=17),
                "registration_ends_at": now + timedelta(days=12),
                "capacity": 240,
                "reward_meters": 2500,
                "status": Competition.Status.REGISTRATION,
                "schedule": ["09:00 — регистрация", "10:00 — квалификация", "16:00 — финалы"],
            },
        )
        Application.objects.get_or_create(
            athlete=athlete,
            competition=competition,
            defaults={
                "status": Application.Status.APPROVED,
                "reviewed_by": admin,
                "reviewed_at": now,
            },
        )
        Achievement.objects.get_or_create(
            athlete=athlete,
            title="Орёл IV",
            defaults={
                "description": "Достигнута отметка 5 000 метров",
                "category": "Уровни",
                "status": Achievement.Status.VERIFIED,
                "earned_at": now.date(),
            },
        )
        self.stdout.write(self.style.SUCCESS("Demo data is ready"))
