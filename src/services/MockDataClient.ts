import { rankAthletes } from '../domain/eagleLevels';
import type { DataClient } from './DataClient';
import { seedDatabase } from './seed';
import type {
  Application,
  Athlete,
  CompetitionInput,
  EagleLevel,
  LoginInput,
  MeterInput,
  MockDatabase,
  Notification,
  RegisterInput,
  ResultInput,
} from '../types';

const STORAGE_KEY = 'eaglecode.mock.v1';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const pause = () => new Promise((resolve) => setTimeout(resolve, 80));

export class MockDataClient implements DataClient {
  private read(): MockDatabase {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as MockDatabase;
    const initial = clone(seedDatabase);
    this.write(initial);
    return initial;
  }

  private write(database: MockDatabase) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  }

  private async done<T>(value: T) {
    await pause();
    return clone(value);
  }

  async login(input: LoginInput) {
    const database = this.read();
    const user = database.users.find((item) => item.email === input.email);
    if (!user || database.credentials[input.email] !== input.password) throw new Error('Неверный email или пароль');
    return this.done(user);
  }

  async register(input: RegisterInput) {
    const database = this.read();
    const id = `a-${Date.now()}`;
    const athlete: Athlete = {
      id,
      fullName: input.fullName,
      email: input.email,
      cityId: input.cityId,
      organization: input.organization,
      disciplines: [],
      sportTitle: 'Без разряда',
      meters: 0,
      avatarInitials: input.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      joinedAt: new Date().toISOString(),
    };
    const user = { id: `u-${Date.now()}`, email: input.email, fullName: input.fullName, role: 'athlete' as const, athleteId: id };
    database.athletes.push(athlete);
    database.users.push(user);
    database.credentials[input.email] = input.password;
    this.write(database);
    return this.done(user);
  }

  async getCurrentUser() {
    const stored = localStorage.getItem('eaglecode.session.v1');
    if (!stored) throw new Error('Сессия не найдена');
    return this.done(JSON.parse(stored));
  }

  async logout() { await pause(); }

  async getAthletes() { return this.done(rankAthletes(this.read().athletes)); }
  async getAthlete(id: string) { return this.done(this.require(this.read().athletes.find((item) => item.id === id))); }
  async updateAthlete(id: string, input: Partial<Athlete>) {
    const database = this.read();
    const index = database.athletes.findIndex((item) => item.id === id);
    database.athletes[index] = { ...this.require(database.athletes[index]), ...input, id };
    this.write(database);
    return this.done(database.athletes[index]);
  }

  async getCompetitions() { return this.done(this.read().competitions); }
  async getCompetition(id: string) { return this.done(this.require(this.read().competitions.find((item) => item.id === id))); }
  async createCompetition(input: CompetitionInput) {
    const database = this.read();
    const competition = { ...input, id: `cp-${Date.now()}` };
    database.competitions.unshift(competition);
    this.write(database);
    return this.done(competition);
  }

  async getApplications() { return this.done(this.read().applications); }
  async submitApplication(athleteId: string, competitionId: string) {
    const database = this.read();
    const existing = database.applications.find((item) => item.athleteId === athleteId && item.competitionId === competitionId);
    if (existing) return this.done(existing);
    const application: Application = { id: `ap-${Date.now()}`, athleteId, competitionId, status: 'pending', createdAt: new Date().toISOString() };
    database.applications.unshift(application);
    this.write(database);
    return this.done(application);
  }

  async updateApplication(id: string, status: Application['status']) {
    const database = this.read();
    const application = this.require(database.applications.find((item) => item.id === id));
    application.status = status;
    this.write(database);
    return this.done(application);
  }

  async getResults() { return this.done(this.read().results); }
  async publishResult(input: ResultInput) {
    const database = this.read();
    const result = { ...input, id: `r-${Date.now()}`, publishedAt: new Date().toISOString() };
    database.results.unshift(result);
    const athlete = this.require(database.athletes.find((item) => item.id === input.athleteId));
    athlete.meters += input.metersAwarded;
    database.transactions.unshift({ id: `t-${Date.now()}`, athleteId: input.athleteId, amount: input.metersAwarded, reason: `Результат: ${result.score}`, protocol: `AUTO-${Date.now()}`, createdAt: result.publishedAt });
    this.write(database);
    return this.done(result);
  }

  async getTransactions() { return this.done(this.read().transactions); }
  async addMeters(input: MeterInput) {
    const database = this.read();
    const transaction = { ...input, id: `t-${Date.now()}`, createdAt: new Date().toISOString() };
    database.transactions.unshift(transaction);
    this.require(database.athletes.find((item) => item.id === input.athleteId)).meters += input.amount;
    this.write(database);
    return this.done(transaction);
  }

  async getCities() { return this.done(this.read().cities); }
  async getAchievements(athleteId: string) { return this.done(this.read().achievements.filter((item) => item.athleteId === athleteId)); }
  async getLevels() { return this.done(this.read().levels); }
  async updateLevel(id: string, input: Partial<EagleLevel>) {
    const database = this.read();
    const index = database.levels.findIndex((item) => item.id === id);
    database.levels[index] = { ...this.require(database.levels[index]), ...input, id };
    this.write(database);
    return this.done(database.levels[index]);
  }

  async getNotifications(): Promise<Notification[]> { return this.done([]); }
  async markNotificationRead(): Promise<Notification> { throw new Error('Уведомление не найдено'); }

  async reset() { localStorage.removeItem(STORAGE_KEY); await pause(); }

  private require<T>(value: T | undefined): T {
    if (!value) throw new Error('Запись не найдена');
    return value;
  }
}
