import { useMemo, useState } from 'react';
import { Search, Trophy } from 'lucide-react';
import { CompetitionCard } from '../../components/features/CompetitionCard';
import { PageHeader } from '../../components/layout/PageHeader';
import { Input, LoadingState } from '../../components/ui/Primitives';
import { useCompetitions } from '../../hooks/useData';

export default function CompetitionsPage() {
  const competitions = useCompetitions(); const [query, setQuery] = useState(''); const [status, setStatus] = useState('all');
  const filtered = useMemo(() => competitions.data?.filter((item) => (status === 'all' || item.status === status) && `${item.title} ${item.discipline}`.toLowerCase().includes(query.toLowerCase())) ?? [], [competitions.data, query, status]);
  if (!competitions.data) return <LoadingState/>;
  return <><PageHeader eyebrow="SPORTS PIPELINE // 2026" title="Следующий уровень начинается с нового старта" description="Выбирай соревнования, подавай заявку и превращай результат в подтверждённые метры."/><div className="filter-bar sticky-filter"><label className="search-control"><Search/><Input aria-label="Поиск соревнования" placeholder="Название, дисциплина или город…" value={query} onChange={(event) => setQuery(event.target.value)}/></label><div className="tabs"><button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>Все</button><button className={status === 'registration' ? 'active' : ''} onClick={() => setStatus('registration')}>Регистрация</button><button className={status === 'upcoming' ? 'active' : ''} onClick={() => setStatus('upcoming')}>Скоро</button><button className={status === 'finished' ? 'active' : ''} onClick={() => setStatus('finished')}>Завершённые</button></div></div><div className="card-grid card-grid-2">{filtered.map((item) => <CompetitionCard key={item.id} competition={item}/>)}</div>{filtered.length === 0 && <div className="state-message"><Trophy/> Соревнования не найдены</div>}</>;
}
