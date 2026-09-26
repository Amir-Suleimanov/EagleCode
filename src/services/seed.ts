import { eagleLevels } from '../domain/eagleLevels';
import type { Competition, MockDatabase } from '../types';

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
const offline = { format: 'offline', rules: '', externalPlatform: '', externalUrl: '', taskCount: 0 } as const;
const contest = (fields: Omit<Competition, 'format' | 'location' | 'capacity' | 'schedule' | 'externalPlatform' | 'externalUrl' | 'registrationEndsAt'>): Competition =>
  ({ ...fields, format: 'contest', location: 'Онлайн', capacity: 1000, schedule: [], externalPlatform: '', externalUrl: '', registrationEndsAt: fields.endsAt });

const RULES = 'Решения принимаются на Python 3.12: чтение из стандартного ввода, вывод в стандартный вывод. Балл за задачу — доля пройденных тестов, засчитывается лучшая попытка. При равенстве баллов выше тот, кто раньше набрал итоговую сумму.';

export const seedDatabase: MockDatabase = {
  credentials: {
    'athlete@eaglecode.ru': 'demo123',
    'admin@eaglecode.ru': 'demo123',
  },
  users: [
    { id: 'u-athlete', email: 'athlete@eaglecode.ru', fullName: 'Магомед Алиев', role: 'athlete', athleteId: 'a1' },
    { id: 'u-admin', email: 'admin@eaglecode.ru', fullName: 'Шамиль Гаджиев', role: 'admin' },
  ],
  notifications: [
    { id: 'n1', userId: 'u-athlete', kind: 'contest', title: 'Итоги контеста', message: '«Тестовый контест по алгоритмическому программированию»: 2 место, 250 баллов.', readAt: null, createdAt: hoursFromNow(-20) },
    { id: 'n2', userId: 'u-athlete', kind: 'application', title: 'Заявка одобрена', message: 'Решение по соревнованию «Кубок Дагестана по программированию робототехники»: участие подтверждено.', readAt: '2026-09-11T08:00:00', createdAt: '2026-09-10T09:30:00' },
  ],
  cities: [
    { id: 'c1', name: 'Махачкала', district: 'городской округ', coordinates: [42.98, 47.5] },
    { id: 'c2', name: 'Дербент', district: 'городской округ', coordinates: [42.06, 48.29] },
    { id: 'c3', name: 'Хасавюрт', district: 'городской округ', coordinates: [43.25, 46.59] },
    { id: 'c4', name: 'Каспийск', district: 'городской округ', coordinates: [42.88, 47.64] },
    { id: 'c5', name: 'Буйнакск', district: 'городской округ', coordinates: [42.82, 47.12] },
  ],
  athletes: [
    { id: 'a2', fullName: 'Амина Гаджиева', email: 'amina@example.ru', organization: 'ДГУ', cityId: 'c2', disciplines: ['Программирование алгоритмическое'], sportTitle: 'КМС', meters: 15_840, avatarInitials: 'АГ', joinedAt: '2025-11-12' },
    { id: 'a3', fullName: 'Расул Магомедов', email: 'rasul@example.ru', organization: 'Кванториум Хасавюрт', cityId: 'c3', disciplines: ['Программирование робототехники'], sportTitle: 'I разряд', meters: 15_120, avatarInitials: 'РМ', joinedAt: '2025-09-04' },
    { id: 'a4', fullName: 'Патимат Омарова', email: 'patimat@example.ru', organization: 'ДГТУ', cityId: 'c1', disciplines: ['Программирование систем информационной безопасности'], sportTitle: 'КМС', meters: 14_460, avatarInitials: 'ПО', joinedAt: '2026-01-18' },
    { id: 'a1', fullName: 'Магомед Алиев', email: 'athlete@eaglecode.ru', organization: 'ДГТУ', cityId: 'c1', disciplines: ['Программирование алгоритмическое', 'Программирование продуктовое'], sportTitle: 'I разряд', meters: 12_480, avatarInitials: 'МА', joinedAt: '2025-10-01' },
    { id: 'a5', fullName: 'Зарема Абдуллаева', email: 'zarema@example.ru', organization: 'IT-куб Каспийск', cityId: 'c4', disciplines: ['Программирование продуктовое'], sportTitle: 'II разряд', meters: 9_880, avatarInitials: 'ЗА', joinedAt: '2026-02-10' },
    { id: 'a6', fullName: 'Мурад Ахмедов', email: 'murad@example.ru', organization: 'Школа программистов Буйнакск', cityId: 'c5', disciplines: ['Программирование беспилотных авиационных систем'], sportTitle: 'I разряд', meters: 7_320, avatarInitials: 'МА', joinedAt: '2026-03-17' },
  ],
  competitions: [
    contest({ id: 'ct-live', title: 'Онлайн-раунд ТехноСпортФест', description: 'Отборочный раунд по алгоритмическому программированию: три задачи, автоматическая проверка и живая таблица.', discipline: 'Программирование алгоритмическое', startsAt: hoursFromNow(-1), endsAt: hoursFromNow(3), rewardMeters: 1_500, status: 'active', rules: RULES, taskCount: 0 }),
    contest({ id: 'ct-test', title: 'Тестовый контест по алгоритмическому программированию', description: 'Пробный контест Федерации: три классические задачи на ввод-вывод, массивы и строки.', discipline: 'Программирование алгоритмическое', startsAt: hoursFromNow(-26), endsAt: hoursFromNow(-22), rewardMeters: 1_000, status: 'finished', rules: RULES, taskCount: 0 }),
    { ...offline, id: 'cp1', title: 'Кубок Дагестана по программированию робототехники', description: 'Командные заезды автономных роботов по трассе с препятствиями и заданием на навигацию.', discipline: 'Программирование робототехники', location: 'Махачкала, Технопарк ДГТУ', startsAt: '2026-10-12T09:00:00', endsAt: '2026-10-13T18:00:00', registrationEndsAt: '2026-10-08T23:59:00', capacity: 120, rewardMeters: 2_500, status: 'registration', schedule: ['09:00 — регистрация команд', '10:00 — квалификационные заезды', '16:00 — финал'] },
    { ...offline, id: 'cp2', title: 'CTF «Каспийский щит»', description: 'Соревнование по информационной безопасности в формате attack-defense для школьников и студентов.', discipline: 'Программирование систем информационной безопасности', location: 'Каспийск, IT-куб', startsAt: '2026-10-26T10:00:00', endsAt: '2026-10-26T18:00:00', registrationEndsAt: '2026-10-20T23:59:00', capacity: 80, rewardMeters: 1_800, status: 'upcoming', schedule: ['10:00 — брифинг', '11:00 — старт игры', '18:00 — подведение итогов'] },
    { ...offline, id: 'cp3', title: 'Продуктовый хакатон ДГТУ', description: '24 часа на прототип цифрового сервиса для города: от идеи до работающего MVP.', discipline: 'Программирование продуктовое', location: 'Махачкала, Технопарк ДГТУ', startsAt: '2026-11-02T10:00:00', endsAt: '2026-11-03T10:00:00', registrationEndsAt: '2026-10-28T23:59:00', capacity: 150, rewardMeters: 2_000, status: 'registration', schedule: ['10:00 — открытие', '12:00 — чекпойнт', '10:00 — защита проектов'] },
  ],
  applications: [
    { id: 'ap1', athleteId: 'a1', competitionId: 'cp1', status: 'approved', createdAt: '2026-09-20T10:00:00' },
    { id: 'ap2', athleteId: 'a5', competitionId: 'cp3', status: 'pending', createdAt: '2026-09-24T11:20:00' },
    { id: 'ap3', athleteId: 'a3', competitionId: 'cp2', status: 'pending', createdAt: '2026-09-25T08:40:00' },
    ...['a1', 'a2', 'a4', 'a5'].map((athleteId) => ({ id: `ap-test-${athleteId}`, athleteId, competitionId: 'ct-test', status: 'approved' as const, createdAt: hoursFromNow(-27) })),
    ...['a2', 'a4'].map((athleteId) => ({ id: `ap-live-${athleteId}`, athleteId, competitionId: 'ct-live', status: 'approved' as const, createdAt: hoursFromNow(-1) })),
  ],
  results: [
    { id: 'r1', competitionId: 'ct-test', athleteId: 'a2', place: 1, score: '300 / 300', metersAwarded: 1_000, publishedAt: hoursFromNow(-22) },
    { id: 'r2', competitionId: 'ct-test', athleteId: 'a1', place: 2, score: '250 / 300', metersAwarded: 833, publishedAt: hoursFromNow(-22) },
    { id: 'r3', competitionId: 'ct-test', athleteId: 'a4', place: 3, score: '250 / 300', metersAwarded: 833, publishedAt: hoursFromNow(-22) },
    { id: 'r4', competitionId: 'ct-test', athleteId: 'a5', place: 4, score: '100 / 300', metersAwarded: 333, publishedAt: hoursFromNow(-22) },
  ],
  transactions: [
    { id: 't1', athleteId: 'a1', amount: 833, reason: 'Результат: 250 / 300', protocol: 'AUTO-r2', createdAt: hoursFromNow(-22) },
    { id: 't2', athleteId: 'a1', amount: 180, reason: 'Решение недели на тренировке', protocol: 'RD-2026-0821', createdAt: '2026-08-21T15:20:00' },
  ],
  achievements: [
    { id: 'ach1', athleteId: 'a1', title: 'Первый контест', description: 'Первое подтверждённое участие в контесте Федерации', category: 'Участие', status: 'verified', earnedAt: '2025-11-08' },
    { id: 'ach2', athleteId: 'a1', title: 'Серебро онлайн-тура', description: 'Призовое место в контесте по алгоритмическому программированию', category: 'Награды', status: 'verified', earnedAt: '2026-09-25' },
    { id: 'ach3', athleteId: 'a1', title: 'Орёл IV', description: 'Достигнута отметка 5 000 метров', category: 'Уровни', status: 'verified', earnedAt: '2026-05-12' },
    { id: 'ach4', athleteId: 'a1', title: 'Пять контестов за сезон', description: 'Завершить пять контестов за сезон', category: 'Сезон', status: 'progress' },
    { id: 'ach5', athleteId: 'a1', title: 'Орёл V', description: 'Набрать 14 000 метров', category: 'Уровни', status: 'locked' },
  ],
  levels: eagleLevels,
  tasks: [
    { id: 'tk-sum', competitionId: 'ct-test', order: 1, title: 'Сумма двух чисел', statement: 'Даны два целых числа a и b (|a|, |b| ≤ 10⁹). Выведите их сумму.', maxScore: 100, checkType: 'auto', timeLimitMs: 1000, memoryLimitMb: 256, materialsUrl: '', tests: [{ input: '1 2', expectedOutput: '3', isSample: true }, { input: '-5 5', expectedOutput: '0', isSample: false }] },
    { id: 'tk-max', competitionId: 'ct-test', order: 2, title: 'Максимальный подотрезок', statement: 'Дан массив из n целых чисел. Найдите максимальную сумму непустого непрерывного подотрезка.\n\nПервая строка — n (1 ≤ n ≤ 2·10⁵), вторая — элементы массива.', maxScore: 100, checkType: 'auto', timeLimitMs: 1000, memoryLimitMb: 256, materialsUrl: '', tests: [{ input: '5\n-2 1 -3 4 -1', expectedOutput: '4', isSample: true }] },
    { id: 'tk-br', competitionId: 'ct-test', order: 3, title: 'Скобочная последовательность', statement: 'Дана строка из символов «(», «)», «[», «]». Выведите YES, если последовательность правильная, иначе NO.', maxScore: 100, checkType: 'auto', timeLimitMs: 1000, memoryLimitMb: 256, materialsUrl: '', tests: [{ input: '([])', expectedOutput: 'YES', isSample: true }] },
    { id: 'tk-live-a', competitionId: 'ct-live', order: 1, title: 'A. Разминка', statement: 'Дано натуральное n (n ≤ 10⁹). Выведите сумму чисел от 1 до n.', maxScore: 100, checkType: 'auto', timeLimitMs: 1000, memoryLimitMb: 256, materialsUrl: '', tests: [{ input: '3', expectedOutput: '6', isSample: true }, { input: '1000000000', expectedOutput: '500000000500000000', isSample: false }] },
    { id: 'tk-live-b', competitionId: 'ct-live', order: 2, title: 'B. Горные тропы', statement: 'Дан список высот n точек маршрута. Найдите длину самого длинного строго возрастающего непрерывного участка.', maxScore: 100, checkType: 'auto', timeLimitMs: 1000, memoryLimitMb: 256, materialsUrl: '', tests: [{ input: '6\n1 2 2 3 4 5', expectedOutput: '4', isSample: true }] },
    { id: 'tk-live-c', competitionId: 'ct-live', order: 3, title: 'C. Идея для Федерации', statement: 'Опишите в свободной форме (или пришлите ссылку на репозиторий), как бы вы автоматизировали проведение школьных олимпиад по программированию. Оценивается организатором вручную.', maxScore: 50, checkType: 'manual', timeLimitMs: 1000, memoryLimitMb: 256, materialsUrl: '', tests: [] },
  ],
  submissions: [],
};
