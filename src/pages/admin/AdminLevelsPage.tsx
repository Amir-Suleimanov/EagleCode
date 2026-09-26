import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bird, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, ErrorState, Input, LoadingState } from '../../components/ui/Primitives';
import { useLevels } from '../../hooks/useData';
import { dataClient } from '../../services/client';
import type { EagleLevel } from '../../types';

export default function AdminLevelsPage() {
  const levels = useLevels(); const queryClient = useQueryClient();
  const update = useMutation({ mutationFn: ({ id, minMeters }: { id: string; minMeters: number }) => dataClient.updateLevel(id, { minMeters }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['levels'] }) });
  if (levels.isError) return <ErrorState onRetry={() => { levels.refetch(); }}/>;
  if (!levels.data) return <LoadingState/>;
  const save = (level: EagleLevel, target: EventTarget | null) => { const form = (target as HTMLElement).closest('form'); if (!form) return; const data = new FormData(form); update.mutate({ id: level.id, minMeters: Number(data.get('minMeters')) }); };
  return <><PageHeader eyebrow="EAGLE LEVEL ENGINE" title="Настройка уровней" description="Пороговые значения единой шкалы спортивной высоты."/><div className="levels-admin">{levels.data.map((level) => <Card as="article" className="level-admin-row" key={level.id}><div className="level-symbol"><Bird/></div><div><p className="eyebrow">ОРЁЛ {level.id}</p><h3>{level.name}</h3></div><form onSubmit={(event) => { event.preventDefault(); save(level, event.currentTarget); }}><label htmlFor={`level-${level.id}`}>Минимум метров</label><Input id={`level-${level.id}`} name="minMeters" type="number" defaultValue={level.minMeters} min="0" required/><Button type="submit" variant="secondary" busy={update.isPending}><Save/> Сохранить</Button></form></Card>)}</div></>;
}
