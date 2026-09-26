import { useEffect, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { contestSteps, isPending, submissionStatusLabel, verdictLabel } from '../../domain/contest';
import type { Competition, Submission } from '../../types';
import { Badge, cx } from '../ui/Primitives';

export function ContestStatusStepper({ status }: { status: Competition['status'] }) {
  const current = contestSteps.findIndex((step) => step.status === status);
  return (
    <ol className="contest-stepper" aria-label="Этапы контеста">
      {contestSteps.map((step, index) => (
        <li key={step.status} className={cx(index < current && 'done', index === current && 'current')} aria-current={index === current ? 'step' : undefined}>
          <span>{index < current ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>{step.label}
        </li>
      ))}
    </ol>
  );
}

const pad = (value: number) => String(value).padStart(2, '0');

export function Countdown({ competition }: { competition: Pick<Competition, 'status' | 'startsAt' | 'endsAt'> }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const target = competition.status === 'active' ? competition.endsAt : competition.status === 'registration' ? competition.startsAt : null;
  if (!target) return null;
  const left = Math.max(0, Math.floor((Date.parse(target) - now) / 1000));
  const days = Math.floor(left / 86_400);
  const clock = `${pad(Math.floor(left / 3600) % 24)}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`;
  return (
    <div className={cx('countdown', competition.status === 'active' && left < 600 && 'is-urgent')} role="timer" aria-live="off">
      <small>{competition.status === 'active' ? 'До окончания' : 'До старта'}</small>
      <strong>{days > 0 ? `${days} д ${clock}` : clock}</strong>
    </div>
  );
}

export function SubmissionVerdict({ submission }: { submission: Submission }) {
  if (isPending(submission.status)) return <Badge className="verdict-pending"><LoaderCircle size={12} className="spin" /> {submissionStatusLabel[submission.status]}</Badge>;
  if (submission.status === 'pending_review') return <Badge tone="gold">Ждёт проверки</Badge>;
  if (submission.status === 'failed') return <Badge tone="danger">Сбой проверки</Badge>;
  if (submission.manualScore !== null && !submission.verdict) return <Badge tone="primary">Оценено</Badge>;
  if (!submission.verdict) return <Badge>—</Badge>;
  const label = verdictLabel[submission.verdict];
  return <Badge tone={submission.verdict === 'accepted' ? 'primary' : 'danger'} className="verdict-badge"><b>{label.short}</b> {label.full}</Badge>;
}

export function ScoreValue({ score, max }: { score: number | null; max: number }) {
  if (score === null) return <span className="score-value muted">—</span>;
  return <span className={cx('score-value', score === max && 'is-full', score === 0 && 'is-zero')}>{score}<small>/{max}</small></span>;
}
