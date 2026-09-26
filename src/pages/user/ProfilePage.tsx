import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Award, BarChart3, Edit3, Medal, Trophy } from 'lucide-react';
import { EagleProgress } from '../../components/features/EagleProgress';
import { LineChart, MetricCard } from '../../components/features/Stats';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, ErrorState, Field, Input, LoadingState } from '../../components/ui/Primitives';
import { Overlay } from '../../components/ui/Overlay';
import { useAuth } from '../../contexts/AuthContext';
import { dataClient } from '../../services/client';
import { useLevels, useResults } from '../../hooks/useData';

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const athlete = useQuery({ queryKey: ['athlete', user?.athleteId], queryFn: () => dataClient.getAthlete(user!.athleteId!), enabled: Boolean(user?.athleteId) });
  const levels = useLevels();
  const results = useResults();
  const update = useMutation({ mutationFn: (input: { organization: string; sportTitle: string; disciplines: string[] }) => dataClient.updateAthlete(user!.athleteId!, input), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['athlete'] }); queryClient.invalidateQueries({ queryKey: ['athletes'] }); setEditing(false); } });
  if (athlete.isError || levels.isError || results.isError) return <ErrorState onRetry={() => { athlete.refetch(); levels.refetch(); results.refetch(); }}/>;
  if (!athlete.data || !levels.data || !results.data) return <LoadingState />;
  const profile = athlete.data;
  const ownResults = results.data.filter((result) => result.athleteId === profile.id);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); update.mutate({ organization: String(form.get('organization')), sportTitle: String(form.get('sportTitle')), disciplines: String(form.get('disciplines')).split(',').map((item) => item.trim()).filter(Boolean) }); };

  return <>
    <PageHeader eyebrow="SPORT_PROFILE // VERIFIED" title={`Добро пожаловать, ${profile.fullName.split(' ')[0]}`} description="Личный рейтинг, подтверждённые результаты и траектория спортивного роста." actions={<Button onClick={() => setEditing(true)}><Edit3 size={17}/> Редактировать</Button>}/>
    <Card className="profile-banner"><span className="avatar avatar-hero">{profile.avatarInitials}</span><div className="profile-main"><div className="title-row"><h2>{profile.fullName}</h2><span className="verified-label">ПРОФИЛЬ ПОДТВЕРЖДЁН</span></div><p>{profile.sportTitle} · {profile.organization}</p><div className="tag-list">{profile.disciplines.map((item) => <span key={item}>{item}</span>)}</div></div><div className="profile-quick"><div><small>Рейтинг РД</small><strong>#04</strong></div><div><small>Высота</small><strong>{profile.meters.toLocaleString('ru-RU')} м</strong></div></div></Card>
    <div className="dashboard-grid dashboard-grid-main"><div className="stack"><EagleProgress meters={profile.meters} levels={levels.data}/><div className="metric-grid"><MetricCard label="Набрано за сезон" value="3 240 м" note="+18% к прошлому" icon={Activity} progress={72}/><MetricCard label="Соревнования" value={String(ownResults.length + 7)} note="3 призовых места" icon={Trophy} progress={64}/><MetricCard label="Достижения" value="18" note="14 подтверждено" icon={Award} progress={78}/></div><Card><div className="card-title"><div><p className="eyebrow">FLIGHT PATH // 2026</p><h2>Мой рост и набор высоты</h2></div><BarChart3/></div><LineChart/></Card></div><aside className="stack"><Card><h3>Срезы рейтинга</h3>{[['Общий рейтинг РД', '#04 / 1 284'], ['Махачкала', '#03 / 612'], ['Лёгкая атлетика', '#05 / 390']].map(([label, value]) => <div className="stat-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</Card><Card><h3>Последние результаты</h3>{ownResults.map((result) => <div className="activity-row" key={result.id}><span className="activity-icon"><Medal/></span><div><strong>{result.place} место</strong><small>{result.score}</small></div><b>+{result.metersAwarded} м</b></div>)}</Card><Card><h3>Дисциплины</h3><div className="tag-list large">{profile.disciplines.map((item) => <span key={item}>{item}</span>)}</div></Card></aside></div>
    <Overlay open={editing} title="Редактировать профиль" kind="drawer" onClose={() => setEditing(false)}><form className="form-stack" onSubmit={submit}><Field label="Организация" htmlFor="organization"><Input id="organization" name="organization" defaultValue={profile.organization} required/></Field><Field label="Спортивный разряд" htmlFor="sportTitle"><Input id="sportTitle" name="sportTitle" defaultValue={profile.sportTitle} required/></Field><Field label="Дисциплины через запятую" htmlFor="disciplines"><Input id="disciplines" name="disciplines" defaultValue={profile.disciplines.join(', ')} required/></Field><Button type="submit" busy={update.isPending}>Сохранить изменения</Button></form></Overlay>
  </>;
}

