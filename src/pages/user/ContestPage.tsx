import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Code2, ExternalLink, FileText, ListChecks, Lock, Medal, Trophy } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ContestStatusStepper, Countdown, ScoreValue } from '../../components/contest/ContestParts';
import { StandingsTable } from '../../components/contest/StandingsTable';
import { SubmissionDetails, SubmissionTable } from '../../components/contest/Submissions';
import { SubmitPanel, TaskStatement } from '../../components/contest/TaskWorkspace';
import { Overlay } from '../../components/ui/Overlay';
import { Badge, Button, Card, cx, EmptyState, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime, statusLabel, taskLetter } from '../../domain/contest';
import { useApplications, useCompetition, useContestTasks, useResults, useStandings, useSubmissions } from '../../hooks/useData';
import { dataClient } from '../../services/client';

type Tab = 'tasks' | 'submissions' | 'standings';

export default function ContestPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const competition = useCompetition(id);
  const status = competition.data?.status;
  const tasks = useContestTasks(id, status);
  const submissions = useSubmissions({ competitionId: id });
  const standings = useStandings(id, status === 'active');
  const applications = useApplications();
  const results = useResults();
  const join = useMutation({ mutationFn: () => dataClient.joinContest(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }) });

  const bestByTask = useMemo(() => {
    const best = new Map<string, number>();
    for (const item of submissions.data ?? []) best.set(item.taskId, Math.max(best.get(item.taskId) ?? 0, item.score ?? 0));
    return best;
  }, [submissions.data]);

  if (competition.isError) return <ErrorState onRetry={() => { competition.refetch(); }} />;
  if (!competition.data || !tasks.data || !submissions.data) return <LoadingState />;

  const contest = competition.data;
  const tab = (params.get('tab') as Tab | null) ?? (contest.status === 'finished' ? 'standings' : 'tasks');
  const taskList = tasks.data;
  const selectedIndex = Math.max(0, taskList.findIndex((task) => task.id === params.get('task')));
  const selected = taskList[selectedIndex];
  const open = contest.status === 'active' || contest.status === 'finished';
  const joined = applications.data?.some((item) => item.competitionId === id && item.athleteId === user?.athleteId && item.status === 'approved');
  const ownResult = results.data?.find((item) => item.competitionId === id && item.athleteId === user?.athleteId);
  const maxTotal = taskList.reduce((sum, task) => sum + task.maxScore, 0);
  const openSubmission = submissions.data.find((item) => item.id === openId) ?? null;
  const go = (next: Partial<Record<'tab' | 'task', string>>) => setParams((current) => { const merged = new URLSearchParams(current); Object.entries(next).forEach(([key, value]) => merged.set(key, value)); return merged; }, { replace: true });

  return (
    <>
      <Link to="/app/contests" className="back-link">← Ко всем контестам</Link>
      <Card as="section" className="contest-hero">
        <div className="contest-hero-main">
          <p className="eyebrow">ONLINE CONTEST // {contest.discipline.toUpperCase()}</p>
          <h1>{contest.title}</h1>
          <p>{contest.description}</p>
          <div className="contest-facts">
            <span><CalendarClock size={16} /><small>Начало</small>{formatDateTime(contest.startsAt)}</span>
            <span><CalendarClock size={16} /><small>Окончание</small>{formatDateTime(contest.endsAt)}</span>
            <span><ListChecks size={16} /><small>Задания</small>{contest.taskCount} · {open ? maxTotal : '—'} баллов</span>
            <span><Medal size={16} /><small>Награда</small>до {contest.rewardMeters.toLocaleString('ru-RU')} м</span>
          </div>
        </div>
        <div className="contest-hero-side">
          <Badge tone={contest.status === 'active' ? 'primary' : contest.status === 'finished' ? 'muted' : 'gold'}>{contest.status === 'active' && <span className="status-dot" />}{statusLabel(contest)}</Badge>
          <Countdown competition={contest} />
          {contest.externalUrl && <a className="text-link materials-link" href={contest.externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {contest.externalPlatform || 'Внешняя площадка'}</a>}
        </div>
        <ContestStatusStepper status={contest.status} />
      </Card>

      {contest.rules && <details className="card rules-card"><summary><FileText size={16} /> Правила контеста</summary><p>{contest.rules}</p></details>}

      {contest.status === 'finished' && (
        <Card className={cx('final-result', ownResult && ownResult.place <= 3 && 'is-podium')}>
          <span className="result-place">{ownResult ? `#${ownResult.place}` : '—'}</span>
          <div>
            <p className="eyebrow">ИТОГ // ОПУБЛИКОВАН</p>
            <h2>{ownResult ? `${ownResult.place} место · ${ownResult.score} баллов` : 'Вы не участвовали в этом контесте'}</h2>
            <p>{ownResult ? `Результат сохранён в профиле, начислено +${ownResult.metersAwarded.toLocaleString('ru-RU')} м к рейтингу.` : 'Итоговая таблица доступна ниже.'}</p>
          </div>
          {ownResult && <Link className="button button-secondary" to="/app/profile">В профиль</Link>}
        </Card>
      )}

      {contest.status === 'registration' && (
        <Card className="contest-waiting">
          <Lock />
          <div><h2>Задания откроются в момент старта</h2><p>Контест опубликован. Подтвердите участие заранее — или просто отправьте решение после старта, участие оформится автоматически.</p></div>
          {joined ? <span className="success-box"><CheckCircle2 /> Вы участвуете</span> : <Button onClick={() => join.mutate()} busy={join.isPending}>Участвовать</Button>}
        </Card>
      )}

      {open && (
        <>
          <div className="tabs page-tabs" role="tablist" aria-label="Разделы контеста">
            {([['tasks', `Задания · ${taskList.length}`], ['submissions', `Мои решения · ${submissions.data.length}`], ['standings', contest.status === 'finished' ? 'Итоговая таблица' : 'Таблица']] as const).map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => go({ tab: key })}>{label}</button>
            ))}
          </div>

          {tab === 'tasks' && (selected ? (
            <div className="contest-workspace">
              <nav className="task-nav" aria-label="Задания">
                {taskList.map((task, index) => {
                  const best = bestByTask.get(task.id);
                  return (
                    <button key={task.id} type="button" className={cx('task-nav-item', index === selectedIndex && 'active', best === task.maxScore && 'is-solved')} aria-current={index === selectedIndex ? 'true' : undefined} onClick={() => go({ tab: 'tasks', task: task.id })}>
                      <span className="task-letter">{taskLetter(index)}</span>
                      <span className="task-nav-copy"><strong>{task.title}</strong><small>{task.checkType === 'auto' ? <><Code2 size={12} /> автопроверка</> : <><FileText size={12} /> ручная</>}</small></span>
                      <ScoreValue score={best ?? null} max={task.maxScore} />
                    </button>
                  );
                })}
              </nav>
              <div className="stack">
                <TaskStatement task={selected} letter={taskLetter(selectedIndex)} />
                <SubmitPanel key={selected.id} task={selected} disabled={contest.status !== 'active'} />
                <Card>
                  <div className="card-title"><h3>Попытки по заданию {taskLetter(selectedIndex)}</h3><Trophy size={18} /></div>
                  <SubmissionTable submissions={submissions.data.filter((item) => item.taskId === selected.id)} onOpen={(item) => setOpenId(item.id)} />
                </Card>
              </div>
            </div>
          ) : <EmptyState title="Заданий нет" description="Организатор ещё не добавил задания." />)}

          {tab === 'submissions' && <Card><SubmissionTable submissions={submissions.data} onOpen={(item) => setOpenId(item.id)} /></Card>}

          {tab === 'standings' && (
            <Card>
              <div className="card-title"><div><p className="eyebrow">{contest.status === 'finished' ? 'FINAL // PROTOCOL' : 'LIVE // ОБНОВЛЯЕТСЯ'}</p><h2>{contest.status === 'finished' ? 'Итоговая таблица' : 'Текущая таблица'}</h2></div></div>
              {standings.data ? <StandingsTable rows={standings.data} tasks={taskList} highlightAthleteId={user?.athleteId} final={contest.status === 'finished'} /> : <LoadingState />}
              <p className="table-note">Места: сумма баллов, при равенстве — кто раньше набрал итог (минута последнего улучшения). Полное совпадение — общее место.</p>
            </Card>
          )}
        </>
      )}

      <Overlay open={Boolean(openSubmission)} title={openSubmission ? `${openSubmission.taskTitle} — решение` : ''} kind="drawer" onClose={() => setOpenId(null)}>
        {openSubmission && <SubmissionDetails submission={openSubmission} />}
      </Overlay>
    </>
  );
}
