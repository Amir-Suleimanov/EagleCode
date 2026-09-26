import random
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from apps.competitions.models import Application, Competition, CompetitionResult
from apps.competitions.services import publish_result
from apps.contests.services import finalize_contest
from apps.ratings.models import Achievement
from apps.ratings.services import add_meters
from apps.users.models import AthleteProfile, City, Discipline, User

from .seed_demo import (
    ALGO,
    BRACKETS_TASK,
    DISCIPLINES,
    LIVE_TASKS,
    MAX_SUBARRAY_TASK,
    PASSWORD,
    SUM_TASK,
)
from .seed_demo import Command as DemoCommand

MALE = ["Магомед", "Ахмед", "Расул", "Шамиль", "Гаджи", "Мурад", "Арсен", "Камиль", "Руслан",
        "Ибрагим", "Абдулла", "Тимур", "Саид", "Омар", "Али", "Рамазан", "Хабиб", "Ислам"]
FEMALE = ["Амина", "Патимат", "Зарема", "Марьям", "Хадижат", "Аминат", "Салихат", "Джамиля",
          "Мадина", "Сабина", "Айшат", "Написат"]
SURNAMES = ["Алиев", "Магомедов", "Гаджиев", "Абдуллаев", "Омаров", "Рамазанов", "Исмаилов",
            "Курбанов", "Гасанов", "Ахмедов", "Султанов", "Шамилов", "Хасбулатов", "Юсупов",
            "Мусаев", "Керимов", "Джабраилов", "Нурмагомедов", "Батыров", "Садыков"]
EXTRA_CITIES = [("Избербаш", 42.56, 47.87), ("Кизляр", 43.85, 46.71), ("Кизилюрт", 43.20, 46.87),
                ("Дагестанские Огни", 42.12, 48.19), ("Южно-Сухокумск", 44.66, 45.65)]
ORGS = ["ДГТУ", "ДГУ", "ДГПУ", "IT-куб Махачкала", "Кванториум Дербент", "Лицей №39",
        "Физматлицей №30", "Школа программистов Каспийск", "Технопарк ДГТУ", "Колледж связи"]
TITLES = ["Без разряда", "III разряд", "II разряд", "I разряд", "КМС", "МС"]
PAST_EVENTS = [
    ("Весенний кубок по алгоритмическому программированию", ALGO, 150),
    ("Хакатон «Цифровой Дагестан»", "Программирование продуктовое", 120),
    ("Первенство РД по робототехнике", "Программирование робототехники", 95),
    ("CTF «Горная крепость»", "Программирование систем информационной безопасности", 80),
    ("Летняя школа олимпиадного программирования — финал", ALGO, 60),
    ("Кубок БАС «Небо Дагестана»", "Программирование беспилотных авиационных систем", 45),
    ("Осенний турнир ДГТУ", ALGO, 25),
]
EXTRA_TASKS = [
    {"title": "Палиндром", "statement": "Дана строка. Выведите YES, если она читается одинаково в обе стороны.",
     "tests": [("abba", "YES", True), ("abc", "NO", False), ("a", "YES", False)]},
    {"title": "Простые числа", "statement": "Посчитайте количество простых чисел, не превосходящих n (n ≤ 10⁶).",
     "tests": [("10", "4", True), ("1", "0", False), ("100", "25", False), ("1000000", "78498", False)]},
    {"title": "НОД", "statement": "Даны два натуральных числа. Выведите их наибольший общий делитель.",
     "tests": [("12 18", "6", True), ("7 13", "1", False), ("100 75", "25", False)]},
    {"title": "Фибоначчи по модулю", "statement": "Выведите n-е число Фибоначчи по модулю 10⁹+7 (n ≤ 10⁶).",
     "tests": [("10", "55", True), ("1", "1", False), ("1000", "517691607", False)]},
]  # fmt: skip
CONTESTS = [
    ("Тренировочный раунд №1", 30, [SUM_TASK, EXTRA_TASKS[0], EXTRA_TASKS[2]], 600),
    ("Тренировочный раунд №2", 23, [MAX_SUBARRAY_TASK, EXTRA_TASKS[1], BRACKETS_TASK], 800),
    ("Командная олимпиада школьников — личный зачёт", 14,
     [SUM_TASK, EXTRA_TASKS[3], MAX_SUBARRAY_TASK, EXTRA_TASKS[1]], 1200),
    ("Кубок ректора ДГТУ — онлайн-тур", 7, [LIVE_TASKS[0], LIVE_TASKS[1], EXTRA_TASKS[2]], 1000),
]  # fmt: skip
MARKER = "@demo.eaglecode.ru"


class Command(DemoCommand):
    help = "Fill the database with a large, realistic demo population (runs after seed_demo)"

    @transaction.atomic
    def handle(self, *args, **options):
        if User.objects.filter(email__endswith=MARKER).exists():
            self.stdout.write("Bulk demo data already present")
            return
        self.now = timezone.now()
        self.rng = random.Random(2026)
        self.admin = User.objects.get(email="admin@eaglecode.ru")
        for name, lat, lon in EXTRA_CITIES:
            City.objects.get_or_create(
                name=name, defaults={"district": "городской округ", "latitude": lat, "longitude": lon}
            )
        athletes = self.create_athletes(64) + list(
            AthleteProfile.objects.exclude(user__email__endswith=MARKER)
        )
        self.past_events(athletes)
        self.contests(athletes)
        self.bonuses(athletes)
        self.stdout.write(self.style.SUCCESS(f"Bulk demo data ready: {len(athletes)} athletes"))

    def create_athletes(self, count):
        cities = list(City.objects.all())
        disciplines = list(Discipline.objects.filter(name__in=DISCIPLINES))
        profiles = []
        for index in range(count):
            female = self.rng.random() < 0.35
            first = self.rng.choice(FEMALE if female else MALE)
            last = self.rng.choice(SURNAMES) + ("а" if female else "")
            user = User.objects.create_user(
                email=f"athlete{index + 1:02d}{MARKER}", password=PASSWORD, full_name=f"{first} {last}"
            )
            profile = AthleteProfile.objects.create(
                user=user,
                organization=self.rng.choice(ORGS),
                city=self.rng.choice(cities),
                sport_title=self.rng.choices(TITLES, weights=[5, 4, 4, 3, 2, 1])[0],
            )
            profile.disciplines.set(self.rng.sample(disciplines, self.rng.randint(1, 2)))
            profiles.append(profile)
        return profiles

    def past_events(self, athletes):
        for title, discipline, days_ago, in PAST_EVENTS:
            starts = self.now - timedelta(days=days_ago)
            competition = Competition.objects.create(
                title=title,
                description=f"Официальное соревнование Федерации. Протокол опубликован {days_ago} дней назад.",
                discipline=Discipline.objects.get(name=discipline),
                location=self.rng.choice(["Махачкала, Технопарк ДГТУ", "Дербент, IT-куб", "Каспийск, ДГУ"]),
                starts_at=starts,
                ends_at=starts + timedelta(hours=8),
                registration_ends_at=starts - timedelta(days=5),
                capacity=200,
                reward_meters=self.rng.choice([1500, 2000, 2500, 3000]),
                status=Competition.Status.FINISHED,
                schedule=["10:00 — открытие", "11:00 — старт", "18:00 — награждение"],
            )
            field = self.rng.sample(athletes, self.rng.randint(14, 26))
            for place, athlete in enumerate(field, start=1):
                Application.objects.create(
                    athlete=athlete, competition=competition, status=Application.Status.APPROVED,
                    reviewed_by=self.admin, reviewed_at=starts,
                )
                points = max(10, 400 - place * 13 - self.rng.randint(0, 9))
                publish_result(
                    competition=competition, athlete=athlete, place=place, score=f"{points} баллов",
                    meters_awarded=max(50, round(competition.reward_meters * (1 - (place - 1) / len(field)))),
                    published_by=self.admin,
                )
            CompetitionResult.objects.filter(competition=competition).update(published_at=competition.ends_at)

    def contests(self, athletes):
        for title, days_ago, specs, reward in CONTESTS:
            starts = self.now - timedelta(days=days_ago)
            competition = self.contest(
                title, "Онлайн-контест Федерации с автоматической проверкой решений.",
                starts, starts + timedelta(hours=3), Competition.Status.ACTIVE, reward,
            )
            tasks = self.tasks(competition, specs)
            for athlete in self.rng.sample(athletes, self.rng.randint(18, 32)):
                self.join(competition, athlete)
                skill = self.rng.random()
                for task in tasks:
                    if self.rng.random() > 0.35 + skill * 0.6:
                        continue
                    total = task.tests.count()
                    minute = self.rng.randint(5, 170)
                    for _ in range(self.rng.randint(0, 2)):  # earlier failed attempts
                        self.submit(competition, task, athlete, max(1, minute - self.rng.randint(3, 30)),
                                    self.rng.randint(0, total - 1), "# ранняя попытка",
                                    verdict=self.rng.choice(["wrong_answer", "time_limit", "runtime_error"]))
                    passed = total if self.rng.random() < skill else self.rng.randint(1, total)
                    self.submit(competition, task, athlete, minute, passed, "# решение участника")
            competition.status = Competition.Status.FINISHED
            competition.save(update_fields=["status"])
            finalize_contest(competition=competition, by=self.admin)

    def bonuses(self, athletes):
        reasons = ["Решение недели на тренировке", "Разбор задач для младших", "Серия из 10 решённых задач",
                   "Наставничество в IT-кубе", "Лучший разбор контеста"]
        for athlete in self.rng.sample(athletes, 30):
            add_meters(
                athlete_id=athlete.id, amount=self.rng.choice([100, 150, 200, 300, 500]),
                reason=self.rng.choice(reasons), protocol=f"RD-{self.rng.randint(1000, 9999)}",
                created_by=self.admin,
            )
        for athlete in athletes:
            athlete.refresh_from_db()
            if athlete.meters_balance >= 1000 and self.rng.random() < 0.6:
                Achievement.objects.get_or_create(
                    athlete=athlete, title="Первый контест",
                    defaults={"description": "Участие в контесте Федерации", "category": "Участие",
                              "status": Achievement.Status.VERIFIED, "earned_at": self.now.date()},
                )
