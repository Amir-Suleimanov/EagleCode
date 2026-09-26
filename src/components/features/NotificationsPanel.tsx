import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, BellOff, Trophy } from 'lucide-react';
import { useNotifications } from '../../hooks/useData';
import { dataClient } from '../../services/client';
import { Overlay } from '../ui/Overlay';
import { Button, EmptyState, ErrorState, LoadingState } from '../ui/Primitives';

const ICONS: Record<string, typeof Award> = { application: Trophy, meters: Award };

function formatMoment(value: string) {
  return new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications = useNotifications();
  const queryClient = useQueryClient();
  const markRead = useMutation({
    mutationFn: (id: string) => dataClient.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = notifications.data ?? [];
  const unread = items.filter((item) => !item.readAt);

  return (
    <Overlay open={open} title="Уведомления" onClose={onClose} kind="drawer">
      {notifications.isError && <ErrorState onRetry={() => { notifications.refetch(); }} />}
      {!notifications.isError && !notifications.data && <LoadingState />}
      {notifications.data && items.length === 0 && (
        <EmptyState title="Пока пусто" description="Здесь появятся решения по заявкам и начисления метров." />
      )}
      {items.length > 0 && (
        <>
          {unread.length > 1 && (
            <Button
              variant="secondary"
              busy={markRead.isPending}
              onClick={() => unread.forEach((item) => markRead.mutate(item.id))}
            >
              Отметить все прочитанными
            </Button>
          )}
          <ul className="notification-list">
            {items.map((item) => {
              const Icon = ICONS[item.kind] ?? BellOff;
              return (
                <li key={item.id} className={item.readAt ? 'notification is-read' : 'notification'}>
                  <span className="notification-icon"><Icon size={18} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>{formatMoment(item.createdAt)}</small>
                  </div>
                  {!item.readAt && (
                    <button type="button" className="text-link" onClick={() => markRead.mutate(item.id)}>
                      Прочитано
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Overlay>
  );
}
