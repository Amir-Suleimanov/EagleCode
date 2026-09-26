import { Trophy } from 'lucide-react';
import { taskLetter } from '../../domain/contest';
import type { ContestTask, StandingRow } from '../../types';
import { cx, EmptyState } from '../ui/Primitives';

interface StandingsTableProps { rows: StandingRow[]; tasks: Pick<ContestTask, 'id' | 'title' | 'maxScore'>[]; highlightAthleteId?: string; final?: boolean }

export function StandingsTable({ rows, tasks, highlightAthleteId, final = false }: StandingsTableProps) {
  if (!rows.length) return <EmptyState title="Участников пока нет" description="Таблица заполнится после первых отправленных решений." />;
  const maxTotal = tasks.reduce((sum, task) => sum + task.maxScore, 0);
  return (
    <div className="table-scroll">
      <table className="data-table standings-table">
        <caption className="sr-only">{final ? 'Итоговая таблица' : 'Текущая таблица'}</caption>
        <thead>
          <tr>
            <th scope="col">Место</th>
            <th scope="col">Участник</th>
            {tasks.map((task, index) => <th scope="col" key={task.id} className="task-col" title={task.title}>{taskLetter(index)}</th>)}
            <th scope="col" className="align-right">Баллы</th>
            <th scope="col" className="align-right" title="Минута последнего улучшения — решает при равенстве баллов">Время</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.athleteId} className={cx(row.athleteId === highlightAthleteId && 'is-self')}>
              <td><span className={cx('rank', row.place <= 3 && `rank-${row.place}`)}>{row.place <= 3 && final && <Trophy size={13} />}#{row.place}</span></td>
              <td><strong>{row.fullName}</strong>{row.athleteId === highlightAthleteId && <small className="self-tag">вы</small>}</td>
              {row.tasks.map((cell, index) => {
                const max = tasks[index]?.maxScore ?? 0;
                return (
                  <td key={cell.taskId} className={cx('task-cell', cell.attempts === 0 && 'is-empty', cell.score === max && max > 0 && 'is-full', cell.attempts > 0 && cell.score < max && 'is-partial')}>
                    {cell.attempts === 0 ? '·' : <><strong>{cell.score}</strong><small>{cell.attempts} {cell.attempts === 1 ? 'попытка' : 'поп.'}{cell.bestMinute !== null && ` · ${cell.bestMinute}′`}</small></>}
                  </td>
                );
              })}
              <td className="align-right metric-number">{row.total}<small className="muted"> / {maxTotal}</small></td>
              <td className="align-right mono-cell">{row.penaltyMinutes}′</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
