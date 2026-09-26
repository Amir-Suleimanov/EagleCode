import { CalendarDays, MapPin, Trophy, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Competition } from '../../types';
import { Badge, Card } from '../ui/Primitives';

const statusLabel: Record<Competition['status'], string> = { registration: 'Регистрация открыта', upcoming: 'Скоро', active: 'Идёт сейчас', finished: 'Завершено' };

export function CompetitionCard({ competition, compact = false }: { competition: Competition; compact?: boolean }) {
  return (
    <Card as="article" className={compact ? 'competition-card compact' : 'competition-card'}>
      <div className="card-meta"><Badge tone={competition.status === 'registration' ? 'primary' : 'muted'}>{statusLabel[competition.status]}</Badge><Badge tone="gold">+{competition.rewardMeters.toLocaleString('ru-RU')} м</Badge></div>
      <div className="competition-icon"><Trophy /></div>
      <h3>{competition.title}</h3>
      {!compact && <p>{competition.description}</p>}
      <ul className="meta-list">
        <li><CalendarDays /> {new Date(competition.startsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</li>
        <li><MapPin /> {competition.location}</li>
        <li><UsersRound /> до {competition.capacity} участников</li>
      </ul>
      <Link className="button button-secondary" to={`/app/competitions/${competition.id}`}>Открыть соревнование</Link>
    </Card>
  );
}

