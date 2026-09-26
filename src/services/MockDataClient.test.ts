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
});
