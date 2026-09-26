import { eagleLevels } from '../domain/eagleLevels';
import type { MockDatabase } from '../types';

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
    { id: 'n1', userId: 'u-athlete', kind: 'meters', title: 'Рейтинг обновлён', message: '+650 м. 3 место — Нарын-Кала', readAt: null, createdAt: '2026-09-14T18:00:00' },
    { id: 'n2', userId: 'u-athlete', kind: 'application', title: 'Заявка одобрена', message: 'Решение по соревнованию «Кубок Дагестана по лёгкой атлетике»: участие подтверждено.', readAt: null, createdAt: '2026-09-10T09:30:00' },
    { id: 'n3', userId: 'u-athlete', kind: 'meters', title: 'Рейтинг обновлён', message: '+180 м. Личный рекорд', readAt: '2026-08-22T08:00:00', createdAt: '2026-08-21T15:20:00' },
  ],
  cities: [
    { id: 'c1', name: 'Махачкала', district: 'городской округ', coordinates: [42.98, 47.5] },
    { id: 'c2', name: 'Дербент', district: 'городской округ', coordinates: [42.06, 48.29] },
    { id: 'c3', name: 'Хасавюрт', district: 'городской округ', coordinates: [43.25, 46.59] },
    { id: 'c4', name: 'Каспийск', district: 'городской округ', coordinates: [42.88, 47.64] },
    { id: 'c5', name: 'Буйнакск', district: 'городской округ', coordinates: [42.82, 47.12] },
  ],
  athletes: [
    { id: 'a2', fullName: 'Амина Гаджиева', email: 'amina@example.ru', organization: 'СШОР Дербент', cityId: 'c2', disciplines: ['Лёгкая атлетика', 'Бег'], sportTitle: 'КМС', meters: 15_840, avatarInitials: 'АГ', joinedAt: '2025-11-12' },
    { id: 'a3', fullName: 'Расул Магомедов', email: 'rasul@example.ru', organization: 'ДЮСШ Хасавюрт', cityId: 'c3', disciplines: ['Вольная борьба'], sportTitle: 'МС', meters: 15_120, avatarInitials: 'РМ', joinedAt: '2025-09-04' },
    { id: 'a4', fullName: 'Патимат Омарова', email: 'patimat@example.ru', organization: 'ДГУ', cityId: 'c1', disciplines: ['Стрельба из лука'], sportTitle: 'КМС', meters: 14_460, avatarInitials: 'ПО', joinedAt: '2026-01-18' },
    { id: 'a1', fullName: 'Магомед Алиев', email: 'athlete@eaglecode.ru', organization: 'ДГТУ', cityId: 'c1', disciplines: ['Лёгкая атлетика', 'Триатлон'], sportTitle: 'I разряд', meters: 12_480, avatarInitials: 'МА', joinedAt: '2025-10-01' },
    { id: 'a5', fullName: 'Зарема Абдуллаева', email: 'zarema@example.ru', organization: 'Спортклуб Каспийск', cityId: 'c4', disciplines: ['Плавание'], sportTitle: 'КМС', meters: 9_880, avatarInitials: 'ЗА', joinedAt: '2026-02-10' },
    { id: 'a6', fullName: 'Мурад Ахмедов', email: 'murad@example.ru', organization: 'ДЮСШ Буйнакск', cityId: 'c5', disciplines: ['Бокс'], sportTitle: 'I разряд', meters: 7_320, avatarInitials: 'МА', joinedAt: '2026-03-17' },
  ],
  competitions: [
    { id: 'cp1', title: 'Кубок Дагестана по лёгкой атлетике', description: 'Республиканский старт среди взрослых и юниоров: беговые дисциплины, эстафеты и прыжки.', discipline: 'Лёгкая атлетика', location: 'Махачкала, стадион «Труд»', startsAt: '2026-10-12T09:00:00', endsAt: '2026-10-13T18:00:00', registrationEndsAt: '2026-10-08T23:59:00', capacity: 240, rewardMeters: 2_500, status: 'registration', schedule: ['09:00 — регистрация', '10:00 — квалификация', '16:00 — финалы'] },
    { id: 'cp2', title: 'Открытый турнир по вольной борьбе', description: 'Личный зачёт в семи весовых категориях с электронной фиксацией протоколов.', discipline: 'Вольная борьба', location: 'Хасавюрт, дворец спорта', startsAt: '2026-10-26T10:00:00', endsAt: '2026-10-27T18:00:00', registrationEndsAt: '2026-10-20T23:59:00', capacity: 180, rewardMeters: 1_800, status: 'upcoming', schedule: ['08:00 — взвешивание', '10:00 — предварительные встречи', '17:00 — финалы'] },
    { id: 'cp3', title: 'Заплыв «Каспийская миля»', description: 'Открытая вода, дистанции 1 и 3 километра для участников разного уровня.', discipline: 'Плавание', location: 'Каспийск, городской пляж', startsAt: '2026-11-02T08:00:00', endsAt: '2026-11-02T14:00:00', registrationEndsAt: '2026-10-28T23:59:00', capacity: 120, rewardMeters: 1_200, status: 'registration', schedule: ['08:00 — брифинг', '09:30 — старт 1 км', '11:00 — старт 3 км'] },
    { id: 'cp4', title: 'Горный забег «Нарын-Кала»', description: 'Трейловый маршрут по историческим и горным участкам Дербента.', discipline: 'Трейлраннинг', location: 'Дербент, Нарын-Кала', startsAt: '2026-09-14T07:00:00', endsAt: '2026-09-14T15:00:00', registrationEndsAt: '2026-09-01T23:59:00', capacity: 300, rewardMeters: 2_000, status: 'finished', schedule: ['07:00 — старт', '13:00 — закрытие дистанции', '14:00 — награждение'] },
  ],
  applications: [
    { id: 'ap1', athleteId: 'a1', competitionId: 'cp1', status: 'approved', createdAt: '2026-09-20T10:00:00' },
    { id: 'ap2', athleteId: 'a5', competitionId: 'cp3', status: 'pending', createdAt: '2026-09-24T11:20:00' },
    { id: 'ap3', athleteId: 'a3', competitionId: 'cp2', status: 'pending', createdAt: '2026-09-25T08:40:00' },
  ],
  results: [
    { id: 'r1', competitionId: 'cp4', athleteId: 'a1', place: 3, score: '01:18:42', metersAwarded: 650, publishedAt: '2026-09-14T18:00:00' },
    { id: 'r2', competitionId: 'cp4', athleteId: 'a2', place: 1, score: '01:09:12', metersAwarded: 1_200, publishedAt: '2026-09-14T18:00:00' },
  ],
  transactions: [
    { id: 't1', athleteId: 'a1', amount: 650, reason: '3 место — Нарын-Кала', protocol: 'RD-2026-0914', createdAt: '2026-09-14T18:00:00' },
    { id: 't2', athleteId: 'a1', amount: 180, reason: 'Личный рекорд', protocol: 'RD-2026-0821', createdAt: '2026-08-21T15:20:00' },
  ],
  achievements: [
    { id: 'ach1', athleteId: 'a1', title: 'Первый старт', description: 'Первое подтверждённое участие в соревновании', category: 'Участие', status: 'verified', earnedAt: '2025-11-08' },
    { id: 'ach2', athleteId: 'a1', title: 'Бронза республики', description: 'Призовое место на республиканском старте', category: 'Награды', status: 'verified', earnedAt: '2026-09-14' },
    { id: 'ach3', athleteId: 'a1', title: 'Орёл IV', description: 'Достигнута отметка 5 000 метров', category: 'Уровни', status: 'verified', earnedAt: '2026-05-12' },
    { id: 'ach4', athleteId: 'a1', title: 'Серия из пяти стартов', description: 'Завершить пять соревнований за сезон', category: 'Сезон', status: 'progress' },
    { id: 'ach5', athleteId: 'a1', title: 'Орёл V', description: 'Набрать 14 000 метров', category: 'Уровни', status: 'locked' },
  ],
  levels: eagleLevels,
};
