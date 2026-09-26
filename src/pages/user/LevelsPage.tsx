import { Bird, CheckCircle2, Lock } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Card, LoadingState } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';
import { useLevels } from '../../hooks/useData';
import { useQuery } from '@tanstack/react-query';
import { dataClient } from '../../services/client';
import { getEagleProgress } from '../../domain/eagleLevels';

export default function LevelsPage() {
  const { user } = useAuth(); const levels = useLevels(); const athlete = useQuery({ queryKey: ['athlete', user?.athleteId], queryFn: () => dataClient.getAthlete(user!.athleteId!), enabled: Boolean(user?.athleteId) });
  if (!levels.data || !athlete.data) return <LoadingState/>;
  const current = getEagleProgress(athlete.data.meters, levels.data).level;
  return <><PageHeader eyebrow="EAGLE LEVEL ENGINE" title="Уровни Орла" description="Десять ступеней спортивного развития — от первого результата до вершины Дагестана."/><div className="levels-page-grid">{levels.data.map((level) => <Card className={level.id === current.id ? 'level-card current' : 'level-card'} key={level.id}><div className="level-symbol"><Bird/></div><div><p className="eyebrow">ОРЁЛ {level.id}</p><h2>{level.name}</h2><p>{level.minMeters.toLocaleString('ru-RU')} — {level.maxMeters?.toLocaleString('ru-RU') ?? '∞'} м</p></div>{level.order < current.order ? <Badge tone="primary"><CheckCircle2/> Пройдено</Badge> : level.id === current.id ? <Badge tone="gold">Текущий</Badge> : <Lock className="muted"/>}</Card>)}</div></>;
}
