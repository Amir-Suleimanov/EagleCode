import type { StandingRow } from '../types';

interface ScoredAttempt { athleteId: string; taskId: string; score: number | null; createdAt: string }

/** Same rules as the backend: best attempt per task, total ↓, minute of last improvement ↑, exact ties share a place. */
export function buildStandings(taskIds: string[], attempts: ScoredAttempt[], participants: Record<string, string>, startedAt: string): StandingRow[] {
  const start = new Date(startedAt).getTime();
  const cells = new Map<string, { score: number; attempts: number; bestAt: number | null }>();
  for (const attempt of [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const key = `${attempt.athleteId}:${attempt.taskId}`;
    const cell = cells.get(key) ?? { score: 0, attempts: 0, bestAt: null };
    cell.attempts += 1;
    if (attempt.score !== null && attempt.score > cell.score) { cell.score = attempt.score; cell.bestAt = new Date(attempt.createdAt).getTime(); }
    cells.set(key, cell);
  }
  const rows = Object.entries(participants).map(([athleteId, fullName]) => {
    let total = 0; let penaltyMinutes = 0;
    const tasks = taskIds.map((taskId) => {
      const cell = cells.get(`${athleteId}:${taskId}`) ?? { score: 0, attempts: 0, bestAt: null };
      const bestMinute = cell.bestAt === null ? null : Math.max(0, Math.floor((cell.bestAt - start) / 60_000));
      if (bestMinute !== null) penaltyMinutes = Math.max(penaltyMinutes, bestMinute);
      total += cell.score;
      return { taskId, score: cell.score, attempts: cell.attempts, bestMinute };
    });
    return { place: 0, athleteId, fullName, total, penaltyMinutes, tasks };
  });
  rows.sort((a, b) => b.total - a.total || a.penaltyMinutes - b.penaltyMinutes || a.fullName.localeCompare(b.fullName, 'ru'));
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    row.place = previous && previous.total === row.total && previous.penaltyMinutes === row.penaltyMinutes ? previous.place : index + 1;
  });
  return rows;
}
