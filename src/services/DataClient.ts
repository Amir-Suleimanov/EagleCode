import type {
  Achievement,
  Application,
  Athlete,
  City,
  Competition,
  CompetitionInput,
  CompetitionResult,
  EagleLevel,
  LoginInput,
  MeterInput,
  MeterTransaction,
  Notification,
  RegisterInput,
  ResultInput,
  SessionUser,
} from '../types';

export interface DataClient {
  login(input: LoginInput): Promise<SessionUser>;
  register(input: RegisterInput): Promise<SessionUser>;
  getCurrentUser(): Promise<SessionUser>;
  logout(): Promise<void>;
  getAthletes(): Promise<Athlete[]>;
  getAthlete(id: string): Promise<Athlete>;
  updateAthlete(id: string, input: Partial<Athlete>): Promise<Athlete>;
  getCompetitions(): Promise<Competition[]>;
  getCompetition(id: string): Promise<Competition>;
  createCompetition(input: CompetitionInput): Promise<Competition>;
  getApplications(): Promise<Application[]>;
  submitApplication(athleteId: string, competitionId: string): Promise<Application>;
  updateApplication(id: string, status: Application['status']): Promise<Application>;
  getResults(): Promise<CompetitionResult[]>;
  publishResult(input: ResultInput): Promise<CompetitionResult>;
  getTransactions(): Promise<MeterTransaction[]>;
  addMeters(input: MeterInput): Promise<MeterTransaction>;
  getCities(): Promise<City[]>;
  getAchievements(athleteId: string): Promise<Achievement[]>;
  getLevels(): Promise<EagleLevel[]>;
  updateLevel(id: string, input: Partial<EagleLevel>): Promise<EagleLevel>;
  getNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<Notification>;
  reset(): Promise<void>;
}
