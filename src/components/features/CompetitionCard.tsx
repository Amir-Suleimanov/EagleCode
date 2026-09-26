import { CalendarDays, Code2, ListChecks, MapPin, Trophy, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { competitionPath, statusLabel } from '../../domain/contest';
import type { Competition } from '../../types';
import { Badge, Card } from '../ui/Primitives';

export function CompetitionCard({ competition, compact = false }: { competition: Competition; compact?: boolean }) {
  const contest = competition.format === 'contest';
  const live = competition.status === 'active' || competition.status === 'registration';
  return (
    <Card as="article" className={compact ? 'competition-card compact' : 'competition-card'}>
      <div className="card-meta"><Badge tone={live ? 'primary' : 'muted'}>{statusLabel(competition)}</Badge><Badge tone="gold">+{competition.rewardMeters.toLocaleString('ru-RU')} м</Badge></div>
      <div className="competition-icon">{contest ? <Code2 /> : <Trophy />}</div>
      <h3>{competition.title}</h3>
      {!compact && <p>{competition.description}</p>}
      <ul className="meta-list">
        <li><CalendarDays /> {new Date(competition.startsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</li>
        <li><MapPin /> {competition.location}</li>
        {contest ? <li><ListChecks /> {competition.taskCount} заданий</li> : <li><UsersRound /> до {competition.capacity} участников</li>}
      </ul>
      <Link className="button button-secondary" to={competitionPath(competition)}>{contest ? 'Открыть контест' : 'Открыть соревнование'}</Link>
    </Card>
  );
}
