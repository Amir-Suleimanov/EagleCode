import type { ReactNode } from 'react';
import { Clock3, Cpu, MemoryStick, MessageSquareText } from 'lucide-react';
import { verdictLabel } from '../../domain/contest';
import type { Submission } from '../../types';
import { cx, EmptyState } from '../ui/Primitives';
import { CodeEditor } from './CodeEditor';
import { ScoreValue, SubmissionVerdict } from './ContestParts';

const time = (value: string) => new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

interface SubmissionTableProps { submissions: Submission[]; onOpen: (submission: Submission) => void; showAthlete?: boolean; empty?: string }

export function SubmissionTable({ submissions, onOpen, showAthlete = false, empty = 'Отправьте первое решение — вердикт появится здесь.' }: SubmissionTableProps) {
  if (!submissions.length) return <EmptyState title="Решений пока нет" description={empty} />;
  return (
    <div className="table-scroll">
      <table className="data-table submissions-table">
        <thead>
          <tr>
            <th scope="col">Время</th>
            {showAthlete && <th scope="col">Участник</th>}
            <th scope="col">Задание</th>
            <th scope="col">Вердикт</th>
            <th scope="col">Тесты</th>
            <th scope="col">Время / память</th>
            <th scope="col" className="align-right">Балл</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="clickable-row" onClick={() => onOpen(submission)}>
              <td className="mono-cell"><button className="row-link" type="button" onClick={(event) => { event.stopPropagation(); onOpen(submission); }}>{time(submission.createdAt)}</button></td>
              {showAthlete && <td>{submission.athleteName}</td>}
              <td>{submission.taskTitle}</td>
              <td><SubmissionVerdict submission={submission} /></td>
              <td className="mono-cell">{submission.language === 'text' ? 'ручная' : `${submission.passedTests}/${submission.totalTests}`}</td>
              <td className="mono-cell">{submission.maxTimeMs === null ? '—' : `${submission.maxTimeMs} мс · ${Math.round((submission.maxMemoryKb ?? 0) / 1024)} МБ`}</td>
              <td className="align-right"><ScoreValue score={submission.score} max={submission.maxScore} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubmissionDetails({ submission, children }: { submission: Submission; children?: ReactNode }) {
  return (
    <div className="stack submission-details">
      <div className="submission-summary">
        <SubmissionVerdict submission={submission} />
        <ScoreValue score={submission.score} max={submission.maxScore} />
        {submission.maxTimeMs !== null && <span><Clock3 size={14} /> {submission.maxTimeMs} мс</span>}
        {submission.maxMemoryKb !== null && <span><MemoryStick size={14} /> {Math.round(submission.maxMemoryKb / 1024)} МБ</span>}
        {submission.autoScore !== null && submission.manualScore !== null && <span><Cpu size={14} /> авто: {submission.autoScore}</span>}
      </div>
      {submission.comment && <p className="review-comment"><MessageSquareText size={15} /> {submission.comment}</p>}
      <section>
        <p className="eyebrow">{submission.language === 'text' ? 'ОТВЕТ // TEXT' : 'SOURCE // PYTHON 3.12'}</p>
        {submission.language === 'text' ? <pre className="answer-block">{submission.source}</pre> : <CodeEditor value={submission.source} readOnly label="Код решения" minHeight="160px" />}
      </section>
      {submission.report.length > 0 && (
        <section>
          <p className="eyebrow">ТЕСТЫ // {submission.passedTests} ИЗ {submission.totalTests}</p>
          <ol className="test-report">
            {submission.report.map((test) => (
              <li key={test.test} className={cx(test.verdict === 'accepted' ? 'is-ok' : 'is-fail')} title={verdictLabel[test.verdict].full}>
                <b>#{test.test}{test.sample && <small> пример</small>}</b>
                <span>{verdictLabel[test.verdict].short}</span>
                <small>{test.timeMs} мс</small>
              </li>
            ))}
          </ol>
        </section>
      )}
      {submission.log && <section><p className="eyebrow">ЖУРНАЛ</p><pre className="log-block">{submission.log}</pre></section>}
      {children}
    </div>
  );
}
