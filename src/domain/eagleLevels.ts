import type { Athlete, EagleLevel } from '../types';

export const eagleLevels: EagleLevel[] = [
  { id: 'I', order: 1, name: 'Первый взлёт', minMeters: 0, maxMeters: 999 },
  { id: 'II', order: 2, name: 'Уверенный старт', minMeters: 1_000, maxMeters: 2_499 },
  { id: 'III', order: 3, name: 'Спортивный характер', minMeters: 2_500, maxMeters: 4_999 },
  { id: 'IV', order: 4, name: 'Сильное крыло', minMeters: 5_000, maxMeters: 13_999 },
  { id: 'V', order: 5, name: 'Мастер высоты', minMeters: 14_000, maxMeters: 24_999 },
  { id: 'VI', order: 6, name: 'Лидер района', minMeters: 25_000, maxMeters: 49_999 },
  { id: 'VII', order: 7, name: 'Чемпион республики', minMeters: 50_000, maxMeters: 74_999 },
  { id: 'VIII', order: 8, name: 'Наставник', minMeters: 75_000, maxMeters: 99_999 },
  { id: 'IX', order: 9, name: 'Легенда спорта', minMeters: 100_000, maxMeters: 149_999 },
  { id: 'X', order: 10, name: 'Вершина Дагестана', minMeters: 150_000, maxMeters: null },
];

export function getEagleProgress(meters: number, levels: EagleLevel[] = eagleLevels) {
  const level = [...levels].reverse().find((item) => meters >= item.minMeters) ?? levels[0];
  const next = levels.find((item) => item.order === level.order + 1);
  if (!next) return { level, next: null, progress: 100, remaining: 0 };
  const span = next.minMeters - level.minMeters;
  const progress = Math.round(((meters - level.minMeters) / span) * 100);
  return { level, next, progress: Math.max(0, Math.min(100, progress)), remaining: next.minMeters - meters };
}

export function rankAthletes(athletes: Athlete[]) {
  return [...athletes].sort((a, b) => b.meters - a.meters);
}

