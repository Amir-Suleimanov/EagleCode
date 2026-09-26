import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Code2, FilePenLine, Plus, Radio, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ContestForm } from '../../components/contest/AdminForms';
import { PageHeader } from '../../components/layout/PageHeader';
import { Overlay } from '../../components/ui/Overlay';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { formatDateTime, statusLabel } from '../../domain/contest';
import { useCompetitions } from '../../hooks/useData';
import { dataClient } from '../../services/client';
import type { ContestInput } from '../../types';

export default function AdminContestsPage() {
  const competitions = useCompetitions();
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (input: ContestInput) => dataClient.createContest(input),
    onSuccess: (contest) => { queryClient.invalidateQueries({ queryKey: ['competitions'] }); navigate(`/admin/contests/${contest.id}?tab=tasks`); },
  });
  if (competitions.isError) return <ErrorState onRetry={() => { competitions.refetch(); }} />;
  if (!competitions.data) return <LoadingState />;
  const contests = competitions.data.filter((item) => item.format === 'contest');
  const count = (status: string) => contests.filter((item) => item.status === status).length;

  return (
    <>
      <PageHeader eyebrow="CONTEST OPS // ОРГАНИЗАТОР" title="Контесты" description="Создайте контест, добавьте задания с тестами, опубликуйте и проведите его прямо на платформе." actions={<Button onClick={() => setCreating(true)}><Plus size={17} /> Создать контест</Button>} />
      <div className="metric-grid metric-grid-4">
        <Card className="summary-tile"><FilePenLine /><span><small>Черновики</small><strong>{count('draft')}</strong></span></Card>
        <Card className="summary-tile"><Code2 /><span><small>Опубликованы</small><strong>{count('registration')}</strong></span></Card>
        <Card className="summary-tile"><Radio /><span><small>Идут сейчас</small><strong>{count('active')}</strong></span></Card>
        <Card className="summary-tile"><Trophy /><span><small>Завершены</small><strong>{count('finished')}</strong></span></Card>
      </div>
      <Card>
        {contests.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th scope="col">Контест</th><th scope="col">Статус</th><th scope="col">Начало</th><th scope="col">Окончание</th><th scope="col">Задания</th><th scope="col" className="align-right">Действие</th></tr></thead>
              <tbody>
                {contests.map((contest) => (
                  <tr key={contest.id}>
                    <td><Link className="row-title" to={`/admin/contests/${contest.id}`}>{contest.title}</Link><small className="cell-sub">{contest.discipline}</small></td>
                    <td><Badge tone={contest.status === 'active' ? 'primary' : contest.status === 'draft' ? 'gold' : 'muted'}>{statusLabel(contest)}</Badge></td>
                    <td className="mono-cell">{formatDateTime(contest.startsAt)}</td>
                    <td className="mono-cell">{formatDateTime(contest.endsAt)}</td>
                    <td className="mono-cell">{contest.taskCount}</td>
                    <td className="align-right"><Link className="button button-secondary button-small" to={`/admin/contests/${contest.id}`}>Управлять</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Контестов пока нет" description="Нажмите «Создать контест», чтобы провести первое соревнование на платформе." />}
      </Card>
      <Overlay open={creating} title="Новый контест" kind="drawer" onClose={() => setCreating(false)}>
        <ContestForm busy={create.isPending} error={create.error?.message} submitLabel="Создать черновик" onSubmit={(input) => create.mutate(input)} />
      </Overlay>
    </>
  );
}
