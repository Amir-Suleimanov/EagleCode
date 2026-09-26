import type { Competition, CompetitionStatus, SubmissionStatus, Verdict } from '../types';

/** Official sport-programming disciplines; the backend seed creates the same list. */
export const PROGRAMMING_DISCIPLINES = [
  'Программирование алгоритмическое',
  'Программирование продуктовое',
  'Программирование робототехники',
  'Программирование беспилотных авиационных систем',
  'Программирование систем информационной безопасности',
];

export const competitionStatusLabel: Record<CompetitionStatus, string> = {
  draft: 'Черновик', registration: 'Регистрация открыта', upcoming: 'Скоро', active: 'Идёт сейчас', finished: 'Завершено',
};

/** The case names the contest lifecycle «Черновик → Опубликован → Идёт → Завершён». */
export const contestSteps: { status: CompetitionStatus; label: string }[] = [
  { status: 'draft', label: 'Черновик' },
  { status: 'registration', label: 'Опубликован' },
  { status: 'active', label: 'Идёт' },
  { status: 'finished', label: 'Завершён' },
];

export const statusLabel = (competition: Pick<Competition, 'format' | 'status'>) =>
  competition.format === 'contest' ? contestSteps.find((step) => step.status === competition.status)?.label ?? competitionStatusLabel[competition.status] : competitionStatusLabel[competition.status];

export const competitionPath = (competition: Pick<Competition, 'id' | 'format'>) =>
  competition.format === 'contest' ? `/app/contests/${competition.id}` : `/app/competitions/${competition.id}`;

export const verdictLabel: Record<Verdict, { short: string; full: string }> = {
  accepted: { short: 'OK', full: 'Принято' },
  wrong_answer: { short: 'WA', full: 'Неверный ответ' },
  time_limit: { short: 'TL', full: 'Превышено время' },
  memory_limit: { short: 'ML', full: 'Превышена память' },
  runtime_error: { short: 'RE', full: 'Ошибка выполнения' },
  compile_error: { short: 'CE', full: 'Ошибка компиляции' },
};

export const submissionStatusLabel: Record<SubmissionStatus, string> = {
  queued: 'В очереди', running: 'Проверяется', judged: 'Проверено', pending_review: 'Ждёт проверки', reviewed: 'Оценено', failed: 'Сбой проверки',
};

export const isPending = (status: SubmissionStatus) => status === 'queued' || status === 'running';

export const taskLetter = (index: number) => String.fromCharCode(65 + index);

export const formatDateTime = (value: string) => new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

/** `datetime-local` inputs need local time without seconds or zone. */
export const toLocalInput = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
