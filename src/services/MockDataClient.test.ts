import { beforeEach, describe, expect, it } from 'vitest';
import { MockDataClient } from './MockDataClient';

describe('MockDataClient', () => {
  let client: MockDataClient;
  beforeEach(() => { localStorage.clear(); client = new MockDataClient(); });

  it('authenticates both demo roles', async () => {
    await expect(client.login({ email: 'athlete@eaglecode.ru', password: 'demo123' })).resolves.toMatchObject({ role: 'athlete' });
    await expect(client.login({ email: 'admin@eaglecode.ru', password: 'demo123' })).resolves.toMatchObject({ role: 'admin' });
  });

  it('persists a submitted application', async () => {
    const application = await client.submitApplication('a1', 'cp3');
    const restored = new MockDataClient();
    expect((await restored.getApplications()).find((item) => item.id === application.id)).toMatchObject({ status: 'pending' });
  });

  it('registers credentials that can be used after logout', async () => {
    await client.register({ fullName: 'Тестовый Спортсмен', email: 'new@example.ru', password: 'secret12', cityId: 'c1', organization: 'СШОР' });
    await expect(new MockDataClient().login({ email: 'new@example.ru', password: 'secret12' })).resolves.toMatchObject({ fullName: 'Тестовый Спортсмен' });
  });

  it('adds published result meters to the athlete', async () => {
    const before = await client.getAthlete('a1');
    await client.publishResult({ athleteId: 'a1', competitionId: 'cp1', place: 1, score: '10.22', metersAwarded: 500 });
    expect((await client.getAthlete('a1')).meters).toBe(before.meters + 500);
  });

  describe('notifications', () => {
    const signIn = async (email: string) => {
      const user = await client.login({ email, password: 'demo123' });
      localStorage.setItem('eaglecode.session.v1', JSON.stringify(user));
      return user;
    };

    it('returns only the signed-in athlete notifications, newest first', async () => {
      await signIn('athlete@eaglecode.ru');
      const items = await client.getNotifications();
      expect(items.length).toBeGreaterThan(0);
      expect(items.map((item) => item.createdAt)).toEqual([...items.map((item) => item.createdAt)].sort().reverse());
      expect(items[0]).not.toHaveProperty('userId');

      await signIn('admin@eaglecode.ru');
      expect(await client.getNotifications()).toEqual([]);
    });

    it('marks a notification read without losing it', async () => {
      await signIn('athlete@eaglecode.ru');
      const unread = (await client.getNotifications()).find((item) => !item.readAt)!;
      expect((await client.markNotificationRead(unread.id)).readAt).not.toBeNull();

      const restored = new MockDataClient();
      const stored = (await restored.getNotifications()).find((item) => item.id === unread.id);
      expect(stored?.readAt).not.toBeNull();
    });

    it('notifies the athlete when meters are granted', async () => {
      await signIn('athlete@eaglecode.ru');
      const before = await client.getNotifications();
      await client.addMeters({ athleteId: 'a1', amount: 250, reason: 'Судейская надбавка', protocol: 'P-1' });

      const after = await client.getNotifications();
      expect(after).toHaveLength(before.length + 1);
      expect(after[0]).toMatchObject({ kind: 'meters', readAt: null });
      expect(after[0].message).toContain('+250 м. Судейская надбавка');
    });

    it('notifies the athlete when an application is decided', async () => {
      const application = await client.submitApplication('a1', 'cp3');
      await client.updateApplication(application.id, 'rejected');

      await signIn('athlete@eaglecode.ru');
      const latest = (await client.getNotifications())[0];
      expect(latest).toMatchObject({ kind: 'application', title: 'Заявка отклонена' });
    });
  });
});
