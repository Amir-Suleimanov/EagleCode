import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Trophy, UsersRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Button, Card, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';
import { dataClient } from '../../services/client';
import { useApplications } from '../../hooks/useData';

export default function CompetitionDetailPage() {
  const { id = '' } = useParams(); const { user } = useAuth(); const applications = useApplications(); const queryClient = useQueryClient();
  const competition = useQuery({ queryKey: ['competition', id], queryFn: () => dataClient.getCompetition(id) });
  const apply = useMutation({ mutationFn: () => dataClient.submitApplication(user!.athleteId!, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }) });
  if (competition.isError || applications.isError) return <ErrorState onRetry={() => { competition.refetch(); applications.refetch(); }}/>;
  if (!competition.data || !applications.data) return <LoadingState/>;
  const item = competition.data; const application = applications.data.find((entry) => entry.athleteId === user?.athleteId && entry.competitionId === id);
  return <><Link to="/app/competitions" className="back-link">← Ко всем соревнованиям</Link><PageHeader eyebrow={`${item.discipline.toUpperCase()} // RD`} title={item.title} description={item.description}/><div className="detail-grid"><div className="stack"><Card className="competition-hero-card"><div className="competition-icon large"><Trophy/></div><Badge tone="primary">{item.status === 'registration' ? 'Регистрация открыта' : 'Соревнование'}</Badge><div className="detail-facts"><div><CalendarDays/><span><small>Дата</small>{new Date(item.startsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div><div><MapPin/><span><small>Место</small>{item.location}</span></div><div><UsersRound/><span><small>Лимит</small>{item.capacity} участников</span></div><div><Trophy/><span><small>Награда</small>до {item.rewardMeters.toLocaleString('ru-RU')} м</span></div></div></Card><Card><h2>Расписание</h2><div className="timeline">{item.schedule.map((line, index) => <div key={line}><span>{String(index + 1).padStart(2, '0')}</span><Clock3/><p>{line}</p></div>)}</div></Card></div><aside className="stack"><Card className="apply-card"><p className="eyebrow">APPLICATION NODE</p><h2>Заявка на участие</h2>{application ? <div className="success-box"><CheckCircle2/><div><strong>{application.status === 'approved' ? 'Заявка подтверждена' : 'Заявка отправлена'}</strong><p>Статус доступен в личном кабинете.</p></div></div> : <><p>Подтвердите участие. Администратор проверит профиль и разряд.</p><Button onClick={() => apply.mutate()} busy={apply.isPending}>Подать заявку</Button></>}</Card><Card><h3>Требования</h3><ul className="check-list"><li>Заполненный профиль</li><li>Медицинский допуск</li><li>Подтверждённый разряд при наличии</li><li>Согласие с регламентом</li></ul></Card></aside></div></>;
}

