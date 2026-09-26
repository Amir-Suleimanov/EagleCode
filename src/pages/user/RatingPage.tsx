import { useMemo, useState } from 'react';
import { BarChart3, MapPin, Search, Trophy, UsersRound } from 'lucide-react';
import { LineChart, MetricCard } from '../../components/features/Stats';
import { RankingTable } from '../../components/features/RankingTable';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, Input, LoadingState } from '../../components/ui/Primitives';
import { useAthletes, useCities } from '../../hooks/useData';

export default function RatingPage() {
  const athletes = useAthletes(); const cities = useCities();
  const [query, setQuery] = useState(''); const [discipline, setDiscipline] = useState('Все');
  const filtered = useMemo(() => athletes.data?.filter((item) => (discipline === 'Все' || item.disciplines.includes(discipline)) && `${item.fullName} ${item.organization}`.toLowerCase().includes(query.toLowerCase())) ?? [], [athletes.data, discipline, query]);
  if (!athletes.data || !cities.data) return <LoadingState/>;
  const disciplines = ['Все', ...new Set(athletes.data.flatMap((item) => item.disciplines))];
  return <><PageHeader eyebrow="RATING_MATRIX // RD" title="Рейтинг участников" description="Официальная таблица, сформированная из подтверждённых результатов и начислений."/><div className="metric-grid metric-grid-4"><MetricCard label="Участники" value="1 284" note="+82 за месяц" icon={UsersRound} progress={76}/><MetricCard label="Города" value="42 / 52" note="охват республики" icon={MapPin} progress={81}/><MetricCard label="Стартов" value="86" note="12 активных" icon={Trophy} progress={68}/><MetricCard label="Начислено" value="3.84M м" note="+248K в сезоне" icon={BarChart3} progress={83}/></div><Card><div className="card-title"><div><p className="eyebrow">EAGLE ASCENT SPLINE</p><h2>Траектория общего рейтинга</h2></div></div><LineChart title="Траектория общего рейтинга"/></Card><Card><div className="filter-bar"><label className="search-control"><Search/><Input aria-label="Поиск участника" placeholder="Имя или организация…" value={query} onChange={(event) => setQuery(event.target.value)}/></label><div className="tabs" role="group" aria-label="Фильтр дисциплины">{disciplines.slice(0, 6).map((item) => <button type="button" className={discipline === item ? 'active' : ''} onClick={() => setDiscipline(item)} key={item}>{item}</button>)}</div></div><RankingTable athletes={filtered} cities={cities.data}/></Card></>;
}

