import { Award, BarChart3, ClipboardCheck, Code2, Gauge, Map, Medal, Settings, Trophy, UserRound, UsersRound } from 'lucide-react';

export const userNav = [
  { to: '/app/profile', label: 'Профиль', icon: UserRound },
  { to: '/app/contests', label: 'Контесты', icon: Code2 },
  { to: '/app/rating', label: 'Рейтинг', icon: BarChart3 },
  { to: '/app/competitions', label: 'Соревнования', icon: Trophy },
  { to: '/app/results', label: 'Результаты', icon: Medal },
  { to: '/app/achievements', label: 'Достижения', icon: Award },
  { to: '/app/map', label: 'Карта', icon: Map },
  { to: '/app/levels', label: 'Уровни Орла', icon: Gauge },
];

export const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: Gauge, end: true },
  { to: '/admin/contests', label: 'Контесты', icon: Code2 },
  { to: '/admin/users', label: 'Участники', icon: UsersRound },
  { to: '/admin/competitions', label: 'Соревнования', icon: Trophy },
  { to: '/admin/applications', label: 'Заявки', icon: ClipboardCheck },
  { to: '/admin/results', label: 'Результаты', icon: Medal },
  { to: '/admin/rating', label: 'Рейтинг и метры', icon: BarChart3 },
  { to: '/admin/levels', label: 'Уровни', icon: Settings },
];
