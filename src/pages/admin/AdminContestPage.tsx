import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Code2, FileText, Flag, Pencil, Play, Plus, RotateCcw, Send, Trash2 } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ContestForm, GradeForm, TaskForm } from '../../components/contest/AdminForms';
import { ContestStatusStepper, Countdown } from '../../components/contest/ContestParts';
import { StandingsTable } from '../../components/contest/StandingsTable';
import { SubmissionDetails, SubmissionTable } from '../../components/contest/Submissions';
import { Overlay } from '../../components/ui/Overlay';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { formatDateTime, taskLetter } from '../../domain/contest';
import { useCompetition, useContestTasks, useStandings, useSubmissions } from '../../hooks/useData';
import { dataClient } from '../../services/client';
import type { CompetitionStatus, ContestInput, ContestTask, GradeInput, TaskInput, TestCase } from '../../types';

type Tab = 'tasks' | 'submissions' | 'standings' | 'settings';
const NEXT: Partial<Record<CompetitionStatus, { status: CompetitionStatus; label: string; hint: string }>> = {
  draft: { status: 'registration', label: 'Опубликовать', hint: 'Контест увидят спортсмены; задания откроются в момент старта.' },
  registration: { status: 'active', label: 'Начать сейчас', hint: 'Иначе контест стартует автоматически по расписанию.' },
  active: { status: 'finished', label: 'Завершить и подвести итоги', hint: 'Сформируется таблица, результаты уйдут в профили и рейтинг.' },
};

export default function AdminContestPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<ContestTask | 'new' | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const queryClient = useQueryClient();
  const competition = useCompetition(id);
  const tasks = useContestTasks(id, 'admin');
  const submissions = useSubmissions({ competitionId: id });
  const standings = useStandings(id, competition.data?.status === 'active');
  const editingTests = useQuery({ queryKey: ['task-tests', editing === 'new' ? null : editing?.id], queryFn: () => dataClient.getTaskTests((editing as ContestTask).id), enabled: Boolean(editing && editing !== 'new') });
  const refresh = () => ['competition', 'competitions', 'contest-tasks', 'submissions', 'standings', 'results', 'athletes'].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

  const advance = useMutation({ mutationFn: (status: CompetitionStatus) => dataClient.setCompetitionStatus(id, status), onSuccess: () => { refresh(); setConfirming(false); } });
  const update = useMutation({ mutationFn: (input: ContestInput) => dataClient.updateContest(id, input), onSuccess: refresh });
  const saveTask = useMutation({
    mutationFn: async ({ input, tests }: { input: TaskInput; tests: TestCase[] }) => {
      const task = editing && editing !== 'new' ? await dataClient.updateTask(editing.id, input) : await dataClient.createTask(input);
      if (input.checkType === 'auto') await dataClient.saveTaskTests(task.id, tests);
      return task;
    },
    onSuccess: () => { refresh(); queryClient.invalidateQueries({ queryKey: ['task-tests'] }); setEditing(null); },
  });
  const removeTask = useMutation({ mutationFn: (taskId: string) => dataClient.deleteTask(taskId), onSuccess: refresh });
  const grade = useMutation({ mutationFn: ({ submissionId, input }: { submissionId: string; input: GradeInput }) => dataClient.gradeSubmission(submissionId, input), onSuccess: () => { refresh(); setOpenId(null); } });
  const rejudge = useMutation({ mutationFn: (submissionId: string) => dataClient.rejudgeSubmission(submissionId), onSuccess: refresh });

  if (competition.isError) return <ErrorState onRetry={() => { competition.refetch(); }} />;
  if (!competition.data || !tasks.data || !submissions.data) return <LoadingState />;

  const contest = competition.data;
  const taskList = tasks.data;
  const tab = (params.get('tab') as Tab | null) ?? 'tasks';
  const pending = submissions.data.filter((item) => item.status === 'pending_review');
  const next = NEXT[contest.status];
  const finished = contest.status === 'finished';
  const openSubmission = submissions.data.find((item) => item.id === openId) ?? null;
  const shown = reviewOnly ? pending : submissions.data;

  return (
    <>
      <Link to="/admin/contests" className="back-link">← Все контесты</Link>
      <Card as="section" className="contest-hero admin-contest-hero">
        <div className="contest-hero-main">
          <p className="eyebrow">CONTEST CONTROL // {contest.discipline.toUpperCase()}</p>
          <h1>{contest.title}</h1>
          <p>{formatDateTime(contest.startsAt)} — {formatDateTime(contest.endsAt)} · {taskList.length} заданий · до {contest.rewardMeters.toLocaleString('ru-RU')} м</p>
        </div>
        <div className="contest-hero-side">
          <Countdown competition={contest} />
          {contest.status !== 'draft' && <Link className="text-link" to={`/admin/contests/${id}?tab=standings`}>Таблица →</Link>}
        </div>
        <ContestStatusStepper status={contest.status} />
      </Card>

      <Card className="lifecycle-bar">
        {next ? (
          <>
            <div><strong>Следующий шаг: {next.label.toLowerCase()}</strong><p>{contest.status === 'draft' && !taskList.length ? 'Сначала добавьте хотя бы одно задание.' : next.hint}</p></div>
            {pending.length > 0 && contest.status === 'active' && <Badge tone="gold"><AlertTriangle size={12} /> {pending.length} ждут проверки</Badge>}
            <Button onClick={() => (next.status === 'finished' ? setConfirming(true) : advance.mutate(next.status))} busy={advance.isPending && !confirming} disabled={contest.status === 'draft' && !taskList.length}>
              {next.status === 'registration' ? <Send size={16} /> : next.status === 'active' ? <Play size={16} /> : <Flag size={16} />} {next.label}
            </Button>
          </>
        ) : <div><strong>Контест завершён</strong><p>Итоговая таблица сформирована, результаты опубликованы в профилях участников и учтены в рейтинге.</p></div>}
        {advance.isError && !confirming && <p className="form-error" role="alert">{advance.error.message}</p>}
      </Card>

      <div className="tabs page-tabs" role="tablist" aria-label="Разделы контеста">
        {([['tasks', `Задания · ${taskList.length}`], ['submissions', `Решения · ${submissions.data.length}${pending.length ? ` (${pending.length} на проверку)` : ''}`], ['standings', 'Таблица'], ['settings', 'Настройки']] as const).map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => setParams({ tab: key }, { replace: true })}>{label}</button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div className="stack">
          {!finished && <div><Button onClick={() => setEditing('new')}><Plus size={16} /> Добавить задание</Button></div>}
          {taskList.length ? taskList.map((task, index) => (
            <Card as="article" key={task.id} className="admin-task-card">
              <span className="task-letter large">{taskLetter(index)}</span>
              <div className="admin-task-main">
                <h3>{task.title}</h3>
                <p>{task.statement}</p>
                <div className="tag-list">
                  <span>{task.maxScore} баллов</span>
                  <span>{task.checkType === 'auto' ? <><Code2 size={11} /> автопроверка · {task.testCount} тестов</> : <><FileText size={11} /> ручная проверка</>}</span>
                  {task.checkType === 'auto' && <span>{task.timeLimitMs} мс · {task.memoryLimitMb} МБ</span>}
                </div>
                {task.checkType === 'auto' && task.testCount === 0 && <p className="form-error">Нет тестов — автопроверка поставит 0 баллов.</p>}
              </div>
              {!finished && (
                <div className="inline-actions">
                  <Button variant="secondary" onClick={() => setEditing(task)}><Pencil size={15} /> Изменить</Button>
                  <Button variant="ghost" aria-label={`Удалить задание ${task.title}`} onClick={() => { if (window.confirm(`Удалить задание «${task.title}»?`)) removeTask.mutate(task.id); }}><Trash2 size={15} /></Button>
                </div>
              )}
            </Card>
          )) : <EmptyState title="Заданий пока нет" description="Для демонстрации достаточно трёх заданий: у каждого название, условие и максимум баллов." />}
          {removeTask.isError && <p className="form-error" role="alert">{removeTask.error.message}</p>}
        </div>
      )}

      {tab === 'submissions' && (
        <Card>
          <div className="filter-bar">
            <div className="tabs">
              <button className={!reviewOnly ? 'active' : ''} onClick={() => setReviewOnly(false)}>Все · {submissions.data.length}</button>
              <button className={reviewOnly ? 'active' : ''} onClick={() => setReviewOnly(true)}>Ждут проверки · {pending.length}</button>
            </div>
          </div>
          <SubmissionTable submissions={shown} showAthlete onOpen={(item) => setOpenId(item.id)} empty={reviewOnly ? 'Все решения проверены.' : 'Решения появятся после старта контеста.'} />
        </Card>
      )}

      {tab === 'standings' && (
        <Card>
          <div className="card-title"><div><p className="eyebrow">{finished ? 'FINAL // PROTOCOL' : 'LIVE'}</p><h2>{finished ? 'Итоговая таблица' : 'Текущая таблица'}</h2></div></div>
          {standings.data ? <StandingsTable rows={standings.data} tasks={taskList} final={finished} /> : <LoadingState />}
          <p className="table-note">Места: сумма баллов, при равенстве — минута последнего улучшения; полное совпадение — общее место.</p>
        </Card>
      )}

      {tab === 'settings' && (
        <Card className="settings-card">
          {finished ? <p>Контест завершён — параметры зафиксированы в протоколе.</p> : <ContestForm key={contest.id} initial={contest} busy={update.isPending} error={update.error?.message} submitLabel="Сохранить изменения" onSubmit={(input) => update.mutate(input)} />}
          {update.isSuccess && <p className="verified">Сохранено.</p>}
        </Card>
      )}

      <Overlay open={Boolean(editing)} title={editing === 'new' ? 'Новое задание' : 'Редактирование задания'} kind="drawer" onClose={() => setEditing(null)}>
        {editing && (editing === 'new' || editingTests.data) && (
          <TaskForm
            key={editing === 'new' ? 'new' : editing.id}
            competitionId={id}
            nextOrder={taskList.length + 1}
            task={editing === 'new' ? undefined : editing}
            tests={editing === 'new' ? [] : editingTests.data ?? []}
            busy={saveTask.isPending}
            error={saveTask.error?.message}
            onSubmit={(input, tests) => saveTask.mutate({ input, tests })}
          />
        )}
        {editing && editing !== 'new' && !editingTests.data && <LoadingState />}
      </Overlay>

      <Overlay open={Boolean(openSubmission)} title={openSubmission ? `${openSubmission.athleteName} · ${openSubmission.taskTitle}` : ''} kind="drawer" onClose={() => setOpenId(null)}>
        {openSubmission && (
          <SubmissionDetails submission={openSubmission}>
            {!finished && openSubmission.language === 'python' && <Button variant="secondary" onClick={() => rejudge.mutate(openSubmission.id)} busy={rejudge.isPending}><RotateCcw size={15} /> Перепроверить</Button>}
            {rejudge.isError && <p className="form-error" role="alert">{rejudge.error.message}</p>}
            {!finished && <GradeForm key={openSubmission.id} submission={openSubmission} busy={grade.isPending} error={grade.error?.message} onSubmit={(input) => grade.mutate({ submissionId: openSubmission.id, input })} />}
          </SubmissionDetails>
        )}
      </Overlay>

      <Overlay open={confirming} title="Завершить контест?" onClose={() => setConfirming(false)}>
        <div className="form-stack">
          <p>Приём решений закроется, система сформирует итоговую таблицу, сохранит результаты в профилях и начислит метры в рейтинг. Отменить это действие нельзя.</p>
          {pending.length > 0 && <p className="form-error"><AlertTriangle size={14} /> {pending.length} решений ещё не проверены — они будут учтены с нулём баллов.</p>}
          {advance.isError && <p className="form-error" role="alert">{advance.error.message}</p>}
          <div className="inline-actions"><Button variant="secondary" onClick={() => setConfirming(false)}>Отмена</Button><Button onClick={() => advance.mutate('finished')} busy={advance.isPending}><Flag size={16} /> Завершить</Button></div>
        </div>
      </Overlay>
    </>
  );
}
