import { useState } from 'react';
import { Award, Lock, Medal, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Card, LoadingState } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';
import { dataClient } from '../../services/client';

export default function AchievementsPage() {
  const { user } = useAuth(); const [status, setStatus] = useState('all');
  const achievements = useQuery({ queryKey: ['achievements', user?.athleteId], queryFn: () => dataClient.getAchievements(user!.athleteId!), enabled: Boolean(user?.athleteId) });
  if (!achievements.data) return <LoadingState/>;
  const filtered = achievements.data.filter((item) => status === 'all' || item.status === status);
  return <><PageHeader eyebrow="VERIFIED ACHIEVEMENTS" title="Достижения" description="Дипломы, спортивные рубежи и подтверждённые результаты сезона."/><div className="achievement-feature"><div className="achievement-medal"><Medal/></div><div><Badge tone="gold">ПОСЛЕДНЕЕ ДОСТИЖЕНИЕ</Badge><h2>Бронза республики — 2026</h2><p>Результат подтверждён официальным протоколом соревнования.</p></div><ShieldCheck className="verified"/></div><div className="tabs page-tabs"><button className={status === 'all' ? 'active' : ''} onClick={() => setStatus('all')}>Все ({achievements.data.length})</button><button className={status === 'verified' ? 'active' : ''} onClick={() => setStatus('verified')}>Подтверждённые</button><button className={status === 'progress' ? 'active' : ''} onClick={() => setStatus('progress')}>В процессе</button><button className={status === 'locked' ? 'active' : ''} onClick={() => setStatus('locked')}>Закрытые</button></div><div className="card-grid card-grid-3">{filtered.map((item) => <Card className={`achievement-card status-${item.status}`} key={item.id}><div className="achievement-icon">{item.status === 'locked' ? <Lock/> : <Award/>}</div><Badge tone={item.status === 'verified' ? 'primary' : 'muted'}>{item.category}</Badge><h3>{item.title}</h3><p>{item.description}</p><small>{item.earnedAt ? new Date(item.earnedAt).toLocaleDateString('ru-RU') : item.status === 'progress' ? 'Выполняется' : 'Ещё не открыто'}</small></Card>)}</div></>;
}

