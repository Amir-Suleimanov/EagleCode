import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UserPlus, UsersRound } from 'lucide-react';
import { RankingTable } from '../../components/features/RankingTable';
import { LineChart, MetricCard } from '../../components/features/Stats';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, ErrorState, Input, LoadingState } from '../../components/ui/Primitives';
import { useAthletes, useCities, useLevels } from '../../hooks/useData';

export default function AdminUsersPage() {
  const athletes = useAthletes(); const cities = useCities(); const levels = useLevels();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const setQuery = (value: string) => setSearchParams(value ? { q: value } : {}, { replace: true });
  const filtered = useMemo(() => athletes.data?.filter((item) => `${item.fullName} ${item.organization}`.toLowerCase().includes(query.toLowerCase())) ?? [], [athletes.data, query]);
  if (athletes.isError || cities.isError || levels.isError) return <ErrorState onRetry={() => { athletes.refetch(); cities.refetch(); levels.refetch(); }}/>;
  if (!athletes.data || !cities.data || !levels.data) return <LoadingState/>;
  return <><PageHeader eyebrow="REGIONAL ATHLETE REGISTER" title="Цифровой реестр спортсменов" description="Профили, дисциплины, разряды и текущая рейтинговая высота участников." actions={<Button><UserPlus size={17}/> Зарегистрировать участника</Button>}/><div className="metric-grid"><MetricCard label="Всего участников" value="1 284" note="+82 за 30 дней" icon={UsersRound} progress={82}/><MetricCard label="Подтверждённые" value="1 036" note="81% реестра" icon={UsersRound} progress={81}/><MetricCard label="Новые профили" value="248" note="текущий квартал" icon={UserPlus} progress={58}/></div><Card><div className="card-title"><div><p className="eyebrow">POOL TRAJECTORY</p><h2>Динамика роста реестра</h2></div></div><LineChart/></Card><Card><div className="filter-bar"><label className="search-control"><Search/><Input aria-label="Поиск в реестре" placeholder="ФИО или организация…" value={query} onChange={(event) => setQuery(event.target.value)}/></label><span className="muted">Найдено: {filtered.length}</span></div><RankingTable athletes={filtered} cities={cities.data} levels={levels.data}/></Card></>;
}

