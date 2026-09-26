from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.competitions.models import Application, Competition
from apps.contests.helpers import task_score
from apps.contests.models import Submission, Task, TestCase
from apps.contests.services import finalize_contest
from apps.ratings.models import Achievement, EagleLevel
from apps.users.models import AthleteProfile, City, Discipline, User

PASSWORD = "demo123"
ALGO = "Программирование алгоритмическое"
DISCIPLINES = [
    ALGO,
    "Программирование продуктовое",
    "Программирование робототехники",
    "Программирование беспилотных авиационных систем",
    "Программирование систем информационной безопасности",
]
LEGACY_DISCIPLINES = [
    "Лёгкая атлетика",
    "Триатлон",
    "Вольная борьба",
    "Плавание",
    "Бокс",
    "Стрельба из лука",
    "Трейлраннинг",
]
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
ATHLETES = [
    # email, name, organization, city, title, meters, disciplines
    ("athlete@eaglecode.ru", "Магомед Алиев", "ДГТУ", "Махачкала", "I разряд", 12_480,
     [ALGO, "Программирование продуктовое"]),
    ("amina@eaglecode.ru", "Амина Гаджиева", "ДГУ", "Дербент", "КМС", 15_840, [ALGO]),
    ("rasul@eaglecode.ru", "Расул Магомедов", "Кванториум Хасавюрт", "Хасавюрт", "I разряд",
     15_120, ["Программирование робототехники", ALGO]),
    ("patimat@eaglecode.ru", "Патимат Омарова", "ДГТУ", "Махачкала", "КМС", 14_460,
     ["Программирование систем информационной безопасности", ALGO]),
    ("zarema@eaglecode.ru", "Зарема Абдуллаева", "IT-куб Каспийск", "Каспийск", "II разряд",
     9_880, ["Программирование продуктовое"]),
    ("murad@eaglecode.ru", "Мурад Ахмедов", "Школа программистов Буйнакск", "Буйнакск",
     "I разряд", 7_320, ["Программирование беспилотных авиационных систем", ALGO]),
]  # fmt: skip
RULES = (
    "Решения принимаются на Python 3.12: ввод из стандартного ввода, вывод в стандартный вывод.\n"
    "Балл за задачу — доля пройденных тестов, засчитывается лучшая попытка.\n"
    "При равенстве баллов выше тот, кто раньше набрал итоговую сумму; "
    "полное совпадение — общее место."
)

SUM_TASK = {
    "title": "Сумма двух чисел",
    "statement": (
        "Даны два целых числа a и b (|a|, |b| ≤ 10⁹).\n\n"
        "Ввод: одна строка с числами a и b.\nВывод: их сумма."
    ),
    "tests": [("1 2", "3", True), ("-5 5", "0", False), ("1000000000 1000000000", "2000000000",
              False), ("-7 -8", "-15", False), ("0 0", "0", False)],
}  # fmt: skip
MAX_SUBARRAY_TASK = {
    "title": "Максимальный подотрезок",
    "statement": (
        "Дан массив из n целых чисел. Найдите максимальную сумму непустого непрерывного "
        "подотрезка.\n\nВвод: n (1 ≤ n ≤ 2·10⁵), затем n чисел.\nВывод: одно число."
    ),
    "tests": [("5\n-2 1 -3 4 -1", "4", True), ("3\n-1 -2 -3", "-1", False),
              ("6\n2 -1 2 3 -9 4", "6", False), ("1\n7", "7", False),
              ("8\n1 2 3 -100 4 5 6 -1", "15", False)],
}  # fmt: skip
BRACKETS_TASK = {
    "title": "Скобочная последовательность",
    "statement": (
        "Дана строка из символов «(», «)», «[», «]» длиной до 10⁵.\n\n"
        "Выведите YES, если последовательность правильная, иначе NO."
    ),
    "tests": [("([])", "YES", True), ("([)]", "NO", False), ("((", "NO", False),
              ("[]()[[()]]", "YES", False), (")(", "NO", False)],
}  # fmt: skip
LIVE_TASKS = [
    {
        "title": "A. Разминка",
        "statement": (
            "Дано натуральное n (n ≤ 10⁹). Выведите сумму всех чисел от 1 до n.\n\n"
            "Подсказка: цикл до миллиарда не уложится в секунду."
        ),
        "tests": [("3", "6", True), ("1", "1", False), ("100", "5050", False),
                  ("1000000000", "500000000500000000", False)],
    },
    {
        "title": "B. Горные тропы",
        "statement": (
            "Маршрут задан высотами n точек. Найдите длину самого длинного участка, на котором "
            "высота строго возрастает.\n\nВвод: n (1 ≤ n ≤ 10⁵), затем n чисел.\n"
            "Вывод: длина участка."
        ),
        "tests": [("6\n1 2 2 3 4 5", "4", True), ("1\n5", "1", False),
                  ("5\n5 4 3 2 1", "1", False), ("7\n1 3 5 7 9 11 13", "7", False)],
    },
    {
        "title": "C. Идея для Федерации",
        "statement": (
            "Опишите, как бы вы автоматизировали проведение школьных олимпиад по "
            "программированию в районах Дагестана, или пришлите ссылку на прототип.\n\n"
            "Оценивается организатором вручную: польза, реализуемость, аргументация."
        ),
        "check_type": Task.CheckType.MANUAL,
        "max_score": 50,
        "tests": [],
    },
]  # fmt: skip


class Command(BaseCommand):
    help = "Create or update EagleCode demonstration data"

    @transaction.atomic
    def handle(self, *args, **options):
        self.now = timezone.now()
        cities = self.seed_catalogue()
        self.admin = self.user("admin@eaglecode.ru", "Шамиль Гаджиев", admin=True)
        self.athletes = {}
        for email, name, organization, city, title, meters, disciplines in ATHLETES:
            user = self.user(email, name)
            profile, _ = AthleteProfile.objects.get_or_create(
                user=user,
                defaults={
                    "organization": organization,
                    "city": cities[city],
                    "sport_title": title,
                    "meters_balance": meters,
                },
            )
            profile.disciplines.set(Discipline.objects.filter(name__in=disciplines))
            self.athletes[email.split("@")[0]] = profile
        self.seed_offline(cities)
        self.seed_finished_contest()
        self.seed_live_contest()
        self.seed_published_contest()
        Achievement.objects.get_or_create(
            athlete=self.athletes["athlete"],
            title="Орёл IV",
            defaults={
                "description": "Достигнута отметка 5 000 метров",
                "category": "Уровни",
                "status": Achievement.Status.VERIFIED,
                "earned_at": self.now.date(),
            },
        )
        self.stdout.write(self.style.SUCCESS("Demo data is ready"))

    def seed_catalogue(self):
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
        for name in DISCIPLINES:
            Discipline.objects.get_or_create(name=name)
        for code, order, name, minimum in LEVELS:
            EagleLevel.objects.update_or_create(
                code=code, defaults={"order": order, "name": name, "min_meters": minimum}
            )
        # Stage-one demo data was athletics-themed; drop it where nothing depends on it.
        legacy = Competition.objects.filter(title="Кубок Дагестана по лёгкой атлетике")
        legacy.filter(results__isnull=True).delete()
        Discipline.objects.filter(name__in=LEGACY_DISCIPLINES, competitions__isnull=True).delete()
        return cities

    def user(self, email, name, admin=False):
        user, _ = User.objects.update_or_create(
            email=email,
            defaults={
                "full_name": name,
                "role": User.Role.ADMIN if admin else User.Role.ATHLETE,
                "is_staff": admin,
            },
        )
        user.set_password(PASSWORD)
        user.save(update_fields=["password"])
        return user

    def seed_offline(self, cities):
        events = [
            ("Кубок Дагестана по программированию робототехники",
             "Автономные роботы проходят трассу с препятствиями и заданием на навигацию.",
             "Программирование робототехники", "Махачкала, Технопарк ДГТУ", 16, 120, 2500,
             Competition.Status.REGISTRATION),
            ("CTF «Каспийский щит»",
             "Соревнование по информационной безопасности в формате attack-defense.",
             "Программирование систем информационной безопасности", "Каспийск, IT-куб", 30, 80,
             1800, Competition.Status.UPCOMING),
            ("Продуктовый хакатон ДГТУ",
             "24 часа на прототип цифрового сервиса для города — от идеи до MVP.",
             "Программирование продуктовое", "Махачкала, Технопарк ДГТУ", 37, 150, 2000,
             Competition.Status.REGISTRATION),
        ]  # fmt: skip
        for title, description, discipline, location, days, capacity, reward, status in events:
            starts = self.now + timedelta(days=days)
            Competition.objects.update_or_create(
                title=title,
                defaults={
                    "description": description,
                    "discipline": Discipline.objects.get(name=discipline),
                    "location": location,
                    "starts_at": starts,
                    "ends_at": starts + timedelta(hours=8),
                    "registration_ends_at": starts - timedelta(days=4),
                    "capacity": capacity,
                    "reward_meters": reward,
                    "status": status,
                    "schedule": ["10:00 — открытие", "11:00 — старт", "18:00 — награждение"],
                },
            )

    def contest(self, title, description, starts, ends, status, reward):
        competition, _ = Competition.objects.update_or_create(
            title=title,
            defaults={
                "description": description,
                "discipline": Discipline.objects.get(name=ALGO),
                "format": Competition.Format.CONTEST,
                "location": "Онлайн",
                "starts_at": starts,
                "ends_at": ends,
                "registration_ends_at": ends,
                "capacity": 1000,
                "reward_meters": reward,
                "status": status,
                "rules": RULES,
                "schedule": [],
                "created_by": self.admin,
            },
        )
        return competition

    def tasks(self, competition, specs):
        tasks = []
        for order, spec in enumerate(specs, start=1):
            task, _ = Task.objects.update_or_create(
                competition=competition,
                order=order,
                defaults={
                    "title": spec["title"],
                    "statement": spec["statement"],
                    "max_score": spec.get("max_score", 100),
                    "check_type": spec.get("check_type", Task.CheckType.AUTO),
                },
            )
            task.tests.all().delete()
            TestCase.objects.bulk_create(
                TestCase(
                    task=task, order=index, input=data, expected_output=answer, is_sample=sample
                )
                for index, (data, answer, sample) in enumerate(spec["tests"], start=1)
            )
            tasks.append(task)
        return tasks

    def join(self, competition, athlete):
        Application.objects.update_or_create(
            athlete=athlete,
            competition=competition,
            defaults={"status": Application.Status.APPROVED, "reviewed_at": self.now},
        )

    def submit(self, competition, task, athlete, minute, passed, source, verdict="wrong_answer"):
        """Stores an already judged attempt, so seeding never needs Docker."""
        total = task.tests.count()
        passed = min(passed, total)
        report = [
            {
                "test": index,
                "verdict": "accepted" if index <= passed else verdict,
                "timeMs": 38 + index * 3,
                "memoryKb": 9800,
                "sample": index == 1,
            }
            for index in range(1, total + 1)
        ]
        submission = Submission.objects.create(
            task=task,
            athlete=athlete,
            language=Submission.Language.PYTHON,
            source=source,
            status=Submission.Status.JUDGED,
            verdict="accepted" if passed == total else verdict,
            auto_score=task_score(task.max_score, passed, total),
            passed_tests=passed,
            total_tests=total,
            max_time_ms=38 + total * 3,
            max_memory_kb=9800,
            report=report,
        )
        Submission.objects.filter(pk=submission.pk).update(
            created_at=competition.starts_at + timedelta(minutes=minute)
        )

    def seed_finished_contest(self):
        title = "Тестовый контест по алгоритмическому программированию"
        if Competition.objects.filter(title=title, status=Competition.Status.FINISHED).exists():
            return
        starts = self.now - timedelta(hours=26)
        competition = self.contest(
            title,
            "Пробный контест Федерации: три классические задачи на ввод-вывод, массивы и строки.",
            starts,
            starts + timedelta(hours=4),
            Competition.Status.ACTIVE,
            1000,
        )
        Submission.objects.filter(task__competition=competition).delete()
        a, b, c = self.tasks(competition, [SUM_TASK, MAX_SUBARRAY_TASK, BRACKETS_TASK])
        good = "a, b = map(int, input().split())\nprint(a + b)"
        naive = "n = int(input())\na = list(map(int, input().split()))\nprint(max(a))"
        kadane = (
            "input()\nbest = cur = None\nfor x in map(int, input().split()):\n"
            "    cur = x if cur is None or cur < 0 else cur + x\n"
            "    best = cur if best is None else max(best, cur)\nprint(best)"
        )
        stack = (
            "s = input().strip()\npairs = {')': '(', ']': '['}\nst = []\nok = True\n"
            "for ch in s:\n    if ch in '([':\n        st.append(ch)\n"
            "    elif not st or st.pop() != pairs[ch]:\n        ok = False\n        break\n"
            "print('YES' if ok and not st else 'NO')"
        )
        count_only = "s = input()\nprint('YES' if len(s) % 2 == 0 else 'NO')"
        attempts = {
            "amina": [(a, 8, 5, good), (b, 40, 5, kadane), (c, 95, 5, stack)],
            "athlete": [(a, 12, 5, good), (b, 30, 2, naive), (b, 70, 5, kadane),
                        (c, 120, 3, count_only)],
            "patimat": [(a, 15, 5, good), (b, 90, 5, kadane), (c, 150, 3, count_only)],
            "rasul": [(a, 20, 5, good), (b, 60, 4, kadane), (c, 100, 0, "print('YES'")],
            "zarema": [(a, 45, 5, good), (b, 80, 1, naive)],
            "murad": [(a, 45, 5, good), (c, 80, 1, "print('NO')")],
        }  # fmt: skip
        for key, rows in attempts.items():
            athlete = self.athletes[key]
            self.join(competition, athlete)
            for task, minute, passed, source in rows:
                self.submit(competition, task, athlete, minute, passed, source)
        # A compile error keeps the example honest: it is stored but scores nothing.
        Submission.objects.filter(task=c, athlete=self.athletes["rasul"]).update(
            verdict=Submission.Verdict.COMPILE_ERROR,
            passed_tests=0,
            report=[],
            max_time_ms=None,
            compile_log="SyntaxError: '(' was never closed",
        )
        competition.status = Competition.Status.FINISHED
        competition.save(update_fields=["status"])
        finalize_contest(competition=competition, by=self.admin)

    def seed_live_contest(self):
        starts = self.now - timedelta(hours=1)
        competition = self.contest(
            "Онлайн-раунд ТехноСпортФест",
            "Отборочный раунд: две задачи с автоматической проверкой и одно творческое задание "
            "с ручной оценкой организатора.",
            starts,
            self.now + timedelta(hours=3),
            Competition.Status.ACTIVE,
            1500,
        )
        Submission.objects.filter(task__competition=competition).delete()
        a, b, c = self.tasks(competition, LIVE_TASKS)
        formula = "n = int(input())\nprint(n * (n + 1) // 2)"
        loop = "n = int(input())\nprint(sum(range(1, n + 1)))"
        for key in ["amina", "patimat", "rasul"]:
            self.join(competition, self.athletes[key])
        self.submit(competition, a, self.athletes["amina"], 6, 3, loop, verdict="time_limit")
        self.submit(competition, a, self.athletes["amina"], 11, 4, formula)
        self.submit(competition, b, self.athletes["amina"], 38, 3, "print(1)")
        self.submit(competition, a, self.athletes["patimat"], 19, 4, formula)
        Submission.objects.create(
            task=c,
            athlete=self.athletes["rasul"],
            language=Submission.Language.TEXT,
            source=(
                "Бот в Telegram для регистрации школ + автопроверка на этой платформе; "
                "прототип: https://github.com/example/olymp-bot"
            ),
            status=Submission.Status.PENDING_REVIEW,
        )

    def seed_published_contest(self):
        starts = self.now + timedelta(days=2)
        competition = self.contest(
            "Отборочный тур ТехноСпортФест-2027",
            "Открытый отбор в сборную республики по алгоритмическому программированию.",
            starts,
            starts + timedelta(hours=5),
            Competition.Status.REGISTRATION,
            2000,
        )
        self.tasks(competition, [SUM_TASK, MAX_SUBARRAY_TASK, BRACKETS_TASK])
