import { describe, expect, it } from 'vitest';
import { buildStandings } from './standings';

const START = '2026-09-26T10:00:00Z';
const at = (minute: number) => new Date(Date.parse(START) + minute * 60_000).toISOString();

describe('buildStandings', () => {
  it('keeps the best attempt, breaks ties by time and shares exact ties', () => {
    const rows = buildStandings(['A', 'B'], [
      { athleteId: 'ann', taskId: 'A', score: 100, createdAt: at(30) },
      { athleteId: 'ann', taskId: 'A', score: 20, createdAt: at(50) },
      { athleteId: 'bob', taskId: 'A', score: 100, createdAt: at(10) },
      { athleteId: 'bob', taskId: 'B', score: 30, createdAt: at(20) },
      { athleteId: 'cat', taskId: 'A', score: 100, createdAt: at(10) },
      { athleteId: 'cat', taskId: 'B', score: 30, createdAt: at(20) },
    ], { ann: 'Анна', bob: 'Борис', cat: 'Катя', dan: 'Данияр' }, START);
    expect(rows.map((row) => [row.fullName, row.place, row.total])).toEqual([
      ['Борис', 1, 130], ['Катя', 1, 130], ['Анна', 3, 100], ['Данияр', 4, 0],
    ]);
    expect(rows[2].tasks[0]).toEqual({ taskId: 'A', score: 100, attempts: 2, bestMinute: 30 });
  });
});
