import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, X } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Button, Card, ErrorState, LoadingState } from '../../components/ui/Primitives';
import { useApplications, useAthletes, useCompetitions } from '../../hooks/useData';
import { dataClient } from '../../services/client';
import type { ApplicationStatus } from '../../types';

export default function AdminApplicationsPage() {
  const applications = useApplications(); const athletes = useAthletes(); const competitions = useCompetitions(); const queryClient = useQueryClient();
  const update = useMutation({ mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) => dataClient.updateApplication(id, status), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }) });
  if (applications.isError || athletes.isError || competitions.isError) return <ErrorState onRetry={() => { applications.refetch(); athletes.refetch(); competitions.refetch(); }}/>;
  if (!applications.data || !athletes.data || !competitions.data) return <LoadingState/>;
  return <><PageHeader eyebrow="APPLICATION MODERATION" title="Заявки участников" description="Проверка профилей и допуск спортсменов к соревнованиям."/><div className="tabs page-tabs"><button className="active">Все ({applications.data.length})</button><button>На проверке ({applications.data.filter((item) => item.status === 'pending').length})</button><button>Подтверждено</button></div><Card><div className="admin-list">{applications.data.map((item) => { const athlete = athletes.data.find((entry) => entry.id === item.athleteId); const competition = competitions.data.find((entry) => entry.id === item.competitionId); return <article key={item.id}><span className="avatar">{athlete?.avatarInitials}</span><div className="admin-list-main"><h3>{athlete?.fullName}</h3><p>{athlete?.organization} · {athlete?.sportTitle}</p><small>{competition?.title}</small></div><Badge tone={item.status === 'approved' ? 'primary' : item.status === 'rejected' ? 'danger' : 'gold'}>{item.status === 'pending' ? 'На проверке' : item.status === 'approved' ? 'Допущен' : 'Отклонён'}</Badge>{item.status === 'pending' && <div className="inline-actions"><Button aria-label="Одобрить" onClick={() => update.mutate({ id: item.id, status: 'approved' })}><Check/> Одобрить</Button><Button variant="danger" aria-label="Отклонить" onClick={() => update.mutate({ id: item.id, status: 'rejected' })}><X/> Отклонить</Button></div>}{item.status !== 'pending' && <Clock3 className="muted"/>}</article>; })}</div></Card></>;
}

