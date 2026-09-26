import { Bird, Lock, Medal } from 'lucide-react';
import { getEagleProgress } from '../../domain/eagleLevels';
import type { EagleLevel } from '../../types';
import { Badge, Card, Progress } from '../ui/Primitives';

interface EagleProgressProps { meters: number; levels: EagleLevel[]; detailed?: boolean }
export function EagleProgress({ meters, levels, detailed = true }: EagleProgressProps) {
  const { level, next, progress, remaining } = getEagleProgress(meters, levels);
  return (
    <Card className="eagle-panel">
      <div className="eagle-emblem"><Bird /><span>ОРЁЛ</span></div>
      <div className="eagle-copy">
        <p className="eyebrow">Текущий ранг высоты</p>
        <div className="title-row"><h2>Орёл {level.id} — {level.name}</h2><Badge tone="gold">{progress}%</Badge></div>
        <Progress value={progress} label={`Прогресс уровня Орёл ${level.id}`} />
        <div className="meter-scale"><span>{level.minMeters.toLocaleString('ru-RU')} м</span><strong>{meters.toLocaleString('ru-RU')} м</strong><span>{next ? `${next.minMeters.toLocaleString('ru-RU')} м` : 'Вершина'}</span></div>
        {next && <p className="muted">До уровня «Орёл {next.id}» осталось {remaining.toLocaleString('ru-RU')} м</p>}
      </div>
      {detailed && <div className="level-mini-grid">{levels.map((item) => <div className={item.id === level.id ? 'level-mini current' : item.order < level.order ? 'level-mini passed' : 'level-mini'} key={item.id}>{item.order > level.order ? <Lock size={14}/> : <Medal size={14}/>}<strong>{item.id}</strong><small>{item.minMeters.toLocaleString('ru-RU')} м</small></div>)}</div>}
    </Card>
  );
}

