import { useMemo, useState } from 'react';
import { BarChart3, MapPin, UsersRound } from 'lucide-react';
import { DagestanMap } from '../../components/features/DagestanMap';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { useAthletes, useCities } from '../../hooks/useData';

export function MapPage() {
  const athletes = useAthletes(); const cities = useCities(); const [active, setActive] = useState('c1');
  const summary = useMemo(() => { const city = cities.data?.find((item) => item.id === active); const members = athletes.data?.filter((item) => item.cityId === active) ?? []; return { city, members, meters: members.reduce((sum, item) => sum + item.meters, 0) }; }, [active, athletes.data, cities.data]);
  if (athletes.isError || cities.isError) return <ErrorState onRetry={() => { athletes.refetch(); cities.refetch(); }}/>;
  if (!athletes.data || !cities.data) return <LoadingState/>;
  return <><PageHeader eyebrow="REGIONAL SPORT MAP" title="Спортивная карта Дагестана" description="Активность участников и общая высота городов и районов."/><div className="map-layout"><DagestanMap cities={cities.data} athletes={athletes.data} activeCityId={active} onSelect={setActive}/><Card className="city-inspector"><MapPin/><p className="eyebrow">АКТИВНЫЙ УЗЕЛ</p><h2>{summary.city?.name}</h2><p>{summary.city?.district}</p><div className="stat-row"><span>Участников</span><strong>{summary.members.length}</strong></div><div className="stat-row"><span>Общая высота</span><strong>{summary.meters.toLocaleString('ru-RU')} м</strong></div><div className="stat-row"><span>Ключевые дисциплины</span><strong>{summary.members.flatMap((item) => item.disciplines).slice(0, 2).join(', ') || '—'}</strong></div></Card></div></>;
}

export function CitiesPage() {
  const athletes = useAthletes(); const cities = useCities();
  if (athletes.isError || cities.isError) return <ErrorState onRetry={() => { athletes.refetch(); cities.refetch(); }}/>;
  if (!athletes.data || !cities.data) return <LoadingState/>;
  const ranked = cities.data.map((city) => ({ ...city, athletes: athletes.data.filter((item) => item.cityId === city.id) })).sort((a, b) => b.athletes.reduce((sum, item) => sum + item.meters, 0) - a.athletes.reduce((sum, item) => sum + item.meters, 0));
  return <><PageHeader eyebrow="CITY RATING // 2026" title="Рейтинг городов" description="Суммарный результат участников каждого населённого пункта."/><div className="card-grid card-grid-2">{ranked.map((city, index) => { const meters = city.athletes.reduce((sum, item) => sum + item.meters, 0); return <Card className="city-card" key={city.id}><span className="city-rank">#{String(index + 1).padStart(2, '0')}</span><div><h2>{city.name}</h2><p>{city.district}</p></div><div className="metric-number">{meters.toLocaleString('ru-RU')} м</div><div className="city-card-stats"><span><UsersRound/> {city.athletes.length} участников</span><span><BarChart3/> {Math.round(meters / Math.max(1, city.athletes.length)).toLocaleString('ru-RU')} м в среднем</span></div></Card>; })}</div></>;
}
