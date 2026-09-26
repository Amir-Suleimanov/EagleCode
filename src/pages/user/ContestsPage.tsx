import { useState } from 'react';
import { CompetitionCard } from '../../components/features/CompetitionCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { useCompetitions } from '../../hooks/useData';

const filters = [['active', 'Идут'], ['registration', 'Скоро'], ['finished', 'Завершённые'], ['all', 'Все']] as const;

export default function ContestsPage() {
  const competitions = useCompetitions();
  const [status, setStatus] = useState<(typeof filters)[number][0]>('all');
  if (competitions.isError) return <ErrorState onRetry={() => { competitions.refetch(); }} />;
  if (!competitions.data) return <LoadingState />;
  const contests = competitions.data.filter((item) => item.format === 'contest');
  const visible = contests.filter((item) => status === 'all' || item.status === status);
  return (
    <>
      <PageHeader eyebrow="ONLINE CONTESTS // PYTHON 3.12" title="Контесты" description="Решайте задачи прямо на платформе: автоматическая проверка на тестах, живая таблица и результат сразу в профиле и рейтинге." />
      <div className="filter-bar">
        <div className="tabs">
          {filters.map(([key, label]) => <button key={key} className={status === key ? 'active' : ''} onClick={() => setStatus(key)}>{label} · {key === 'all' ? contests.length : contests.filter((item) => item.status === key).length}</button>)}
        </div>
      </div>
      {visible.length
        ? <div className="card-grid card-grid-2">{visible.map((item) => <CompetitionCard key={item.id} competition={item} />)}</div>
        : <EmptyState title="Контестов нет" description="Когда организатор опубликует контест, он появится здесь." />}
    </>
  );
}
