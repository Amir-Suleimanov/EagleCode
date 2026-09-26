import { rankAthletes } from '../domain/eagleLevels';
import { buildStandings } from '../domain/standings';
import type { DataClient } from './DataClient';
import { seedDatabase } from './seed';
import type {
  Application,
  Athlete,
  Competition,
  CompetitionInput,
  CompetitionStatus,
  ContestInput,
  ContestTask,
  EagleLevel,
  GradeInput,
  LoginInput,
  MeterInput,
  MockDatabase,
  Notification,
  RegisterInput,
  ResultInput,
  SessionUser,
  StoredNotification,
  Submission,
  SubmissionInput,
  TaskInput,
  TestCase,
} from '../types';

const STORAGE_KEY = 'eaglecode.mock.v2';
const NEXT_STATUS: Partial<Record<CompetitionStatus, CompetitionStatus>> = { draft: 'registration', registration: 'active', active: 'finished' };
const toContestTask = ({ tests, ...task }: MockDatabase['tasks'][number]): ContestTask =>
  ({ ...task, samples: tests.filter((test) => test.isSample), testCount: tests.length });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const pause = () => new Promise((resolve) => setTimeout(resolve, 80));
const stripRecipient = ({ id, kind, title, message, readAt, createdAt }: StoredNotification): Notification =>
  ({ id, kind, title, message, readAt, createdAt });

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

  async getCompetitions() {
    const database = this.read();
    const visible = database.competitions.filter((item) => this.isAdmin() || item.status !== 'draft');
    return this.done(visible.map((item) => this.withTaskCount(database, item)));
  }
  async getCompetition(id: string) {
    const database = this.read();
    return this.done(this.withTaskCount(database, this.require(database.competitions.find((item) => item.id === id))));
  }
  async createCompetition(input: CompetitionInput) {
    const database = this.read();
    const competition: Competition = { format: 'offline', rules: '', externalPlatform: '', externalUrl: '', ...input, id: `cp-${Date.now()}`, taskCount: 0 };
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
    if (status === 'approved' || status === 'rejected') {
      const title = status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена';
      const decision = status === 'approved' ? 'участие подтверждено' : 'заявка отклонена';
      const competition = database.competitions.find((item) => item.id === application.competitionId);
      this.notify(database, application.athleteId, 'application', title, `Решение по соревнованию «${competition?.title ?? ''}»: ${decision}.`);
    }
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
    this.notify(database, input.athleteId, 'meters', 'Рейтинг обновлён', `${input.metersAwarded >= 0 ? '+' : ''}${input.metersAwarded} м. Результат: ${result.score}`);
    this.write(database);
    return this.done(result);
  }

  async getTransactions() { return this.done(this.read().transactions); }
  async addMeters(input: MeterInput) {
    const database = this.read();
    const transaction = { ...input, id: `t-${Date.now()}`, createdAt: new Date().toISOString() };
    database.transactions.unshift(transaction);
    this.require(database.athletes.find((item) => item.id === input.athleteId)).meters += input.amount;
    this.notify(database, input.athleteId, 'meters', 'Рейтинг обновлён', `${input.amount >= 0 ? '+' : ''}${input.amount} м. ${input.reason}`);
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

  async getNotifications(): Promise<Notification[]> {
    const userId = this.sessionUserId();
    const own = this.read().notifications.filter((item) => item.userId === userId);
    own.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return this.done(own.map(stripRecipient));
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const database = this.read();
    const stored = this.require(database.notifications.find((item) => item.id === id));
    stored.readAt ??= new Date().toISOString();
    this.write(database);
    return this.done(stripRecipient(stored));
  }

  async createContest(input: ContestInput) {
    const database = this.read();
    const competition: Competition = { ...input, id: `ct-${Date.now()}`, format: 'contest', status: 'draft', location: 'Онлайн', capacity: 1000, registrationEndsAt: input.endsAt, schedule: [], taskCount: 0 };
    database.competitions.unshift(competition);
    this.write(database);
    return this.done(competition);
  }

  async updateContest(id: string, input: Partial<ContestInput>) {
    const database = this.read();
    const competition = this.require(database.competitions.find((item) => item.id === id));
    Object.assign(competition, input);
    this.write(database);
    return this.done(this.withTaskCount(database, competition));
  }

  async setCompetitionStatus(id: string, status: CompetitionStatus) {
    const database = this.read();
    const competition = this.require(database.competitions.find((item) => item.id === id));
    if (NEXT_STATUS[competition.status] !== status) throw new Error('Недопустимый переход статуса.');
    if (status === 'registration' && !database.tasks.some((task) => task.competitionId === id)) throw new Error('Добавьте хотя бы одно задание перед публикацией.');
    const now = new Date().toISOString();
    if (status === 'active' && competition.startsAt > now) competition.startsAt = now;
    if (status === 'finished' && competition.endsAt > now) competition.endsAt = now;
    competition.status = status;
    this.write(database);
    if (status === 'finished') await this.finalize(id);
    return this.done(this.withTaskCount(this.read(), competition));
  }

  async getContestTasks(competitionId: string): Promise<ContestTask[]> {
    const database = this.read();
    const competition = this.require(database.competitions.find((item) => item.id === competitionId));
    if (!this.isAdmin() && !['active', 'finished'].includes(competition.status)) return this.done([]);
    return this.done(database.tasks.filter((task) => task.competitionId === competitionId).sort((a, b) => a.order - b.order).map(toContestTask));
  }

  async createTask(input: TaskInput) {
    const database = this.read();
    const task = { ...input, id: `tk-${Date.now()}`, tests: [] };
    database.tasks.push(task);
    this.write(database);
    return this.done(toContestTask(task));
  }

  async updateTask(id: string, input: Partial<TaskInput>) {
    const database = this.read();
    const task = this.require(database.tasks.find((item) => item.id === id));
    Object.assign(task, input);
    this.write(database);
    return this.done(toContestTask(task));
  }

  async deleteTask(id: string) {
    const database = this.read();
    if (database.submissions.some((item) => item.taskId === id)) throw new Error('По заданию уже есть решения — удалить нельзя.');
    database.tasks = database.tasks.filter((item) => item.id !== id);
    this.write(database);
    await pause();
  }

  async getTaskTests(taskId: string) { return this.done(this.require(this.read().tasks.find((item) => item.id === taskId)).tests); }
  async saveTaskTests(taskId: string, tests: TestCase[]) {
    const database = this.read();
    this.require(database.tasks.find((item) => item.id === taskId)).tests = tests;
    this.write(database);
    return this.done(tests);
  }

  async joinContest(competitionId: string) {
    const athleteId = this.require(this.sessionUser()?.athleteId);
    const database = this.read();
    let application = database.applications.find((item) => item.athleteId === athleteId && item.competitionId === competitionId);
    if (!application) { application = { id: `ap-${Date.now()}`, athleteId, competitionId, status: 'approved', createdAt: new Date().toISOString() }; database.applications.unshift(application); }
    application.status = 'approved';
    this.write(database);
    return this.done(application);
  }

  async getSubmissions(filters: { competitionId?: string; taskId?: string; needsReview?: boolean }) {
    const athleteId = this.isAdmin() ? null : this.sessionUser()?.athleteId;
    return this.done(this.read().submissions.filter((item) =>
      (!athleteId || item.athleteId === athleteId)
      && (!filters.competitionId || item.competitionId === filters.competitionId)
      && (!filters.taskId || item.taskId === filters.taskId)
      && (!filters.needsReview || item.status === 'pending_review')));
  }

  async submitSolution(input: SubmissionInput) {
    const athleteId = this.require(this.sessionUser()?.athleteId);
    const database = this.read();
    const task = this.require(database.tasks.find((item) => item.id === input.taskId));
    const competition = this.require(database.competitions.find((item) => item.id === task.competitionId));
    if (competition.status !== 'active') throw new Error('Приём решений закрыт: контест не идёт.');
    await this.joinContest(competition.id);
    const fresh = this.read();
    const athlete = this.require(fresh.athletes.find((item) => item.id === athleteId));
    // Mock mode has no sandbox, so every solution waits for the organiser.
    const submission: Submission = { id: `s-${Date.now()}`, taskId: task.id, competitionId: competition.id, athleteId, athleteName: athlete.fullName, taskTitle: task.title, maxScore: task.maxScore, language: input.language, source: input.source, status: 'pending_review', verdict: '', score: null, autoScore: null, manualScore: null, comment: '', passedTests: 0, totalTests: task.tests.length, maxTimeMs: null, maxMemoryKb: null, report: [], log: '', createdAt: new Date().toISOString(), reviewedAt: null };
    fresh.submissions.unshift(submission);
    this.write(fresh);
    return this.done(submission);
  }

  async gradeSubmission(id: string, input: GradeInput) {
    const database = this.read();
    const submission = this.require(database.submissions.find((item) => item.id === id));
    if (input.manualScore > submission.maxScore) throw new Error(`Максимум — ${submission.maxScore}.`);
    Object.assign(submission, { manualScore: input.manualScore, score: input.manualScore, comment: input.comment, status: 'reviewed', reviewedAt: new Date().toISOString() });
    this.notify(database, submission.athleteId, 'submission', 'Решение проверено', `«${submission.taskTitle}»: ${input.manualScore} из ${submission.maxScore} баллов.`);
    this.write(database);
    return this.done(submission);
  }

  async rejudgeSubmission(): Promise<Submission> { throw new Error('Автопроверка работает только с backend.'); }

  async getStandings(competitionId: string) {
    const database = this.read();
    const competition = this.require(database.competitions.find((item) => item.id === competitionId));
    const participants = Object.fromEntries(database.applications
      .filter((item) => item.competitionId === competitionId && item.status === 'approved')
      .map((item) => [item.athleteId, database.athletes.find((athlete) => athlete.id === item.athleteId)?.fullName ?? '—']));
    const taskIds = database.tasks.filter((task) => task.competitionId === competitionId).sort((a, b) => a.order - b.order).map((task) => task.id);
    return this.done(buildStandings(taskIds, database.submissions.filter((item) => item.competitionId === competitionId), participants, competition.startsAt));
  }

  private async finalize(competitionId: string) {
    const database = this.read();
    const competition = this.require(database.competitions.find((item) => item.id === competitionId));
    const maxTotal = database.tasks.filter((task) => task.competitionId === competitionId).reduce((sum, task) => sum + task.maxScore, 0);
    for (const row of await this.getStandings(competitionId)) {
      if (this.read().results.some((item) => item.competitionId === competitionId && item.athleteId === row.athleteId)) continue;
      await this.publishResult({ competitionId, athleteId: row.athleteId, place: row.place, score: `${row.total} / ${maxTotal}`, metersAwarded: maxTotal ? Math.round(competition.rewardMeters * row.total / maxTotal) : 0 });
    }
  }

  private withTaskCount(database: MockDatabase, competition: Competition): Competition {
    return { ...competition, taskCount: database.tasks.filter((task) => task.competitionId === competition.id).length };
  }

  private sessionUser(): SessionUser | null {
    const stored = localStorage.getItem('eaglecode.session.v1');
    return stored ? JSON.parse(stored) as SessionUser : null;
  }

  private isAdmin() { return this.sessionUser()?.role === 'admin'; }

  private sessionUserId(): string | null {
    return this.sessionUser()?.id ?? null;
  }

  private notify(database: MockDatabase, athleteId: string, kind: string, title: string, message: string) {
    const owner = database.users.find((item) => item.athleteId === athleteId);
    if (!owner) return;
    database.notifications.unshift({
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: owner.id,
      kind,
      title,
      message,
      readAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  async reset() { localStorage.removeItem(STORAGE_KEY); await pause(); }

  private require<T>(value: T | undefined): T {
    if (!value) throw new Error('Запись не найдена');
    return value;
  }
}
