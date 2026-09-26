import type {
  Achievement,
  Application,
  Athlete,
  City,
  Competition,
  CompetitionInput,
  CompetitionResult,
  CompetitionStatus,
  ContestInput,
  ContestTask,
  EagleLevel,
  GradeInput,
  LoginInput,
  MeterInput,
  MeterTransaction,
  Notification,
  RegisterInput,
  ResultInput,
  SessionUser,
  StandingRow,
  Submission,
  SubmissionInput,
  TaskInput,
  TestCase,
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
  createContest(input: ContestInput): Promise<Competition>;
  updateContest(id: string, input: Partial<ContestInput>): Promise<Competition>;
  setCompetitionStatus(id: string, status: CompetitionStatus): Promise<Competition>;
  getContestTasks(competitionId: string): Promise<ContestTask[]>;
  createTask(input: TaskInput): Promise<ContestTask>;
  updateTask(id: string, input: Partial<TaskInput>): Promise<ContestTask>;
  deleteTask(id: string): Promise<void>;
  getTaskTests(taskId: string): Promise<TestCase[]>;
  saveTaskTests(taskId: string, tests: TestCase[]): Promise<TestCase[]>;
  joinContest(competitionId: string): Promise<Application>;
  getSubmissions(filters: { competitionId?: string; taskId?: string; needsReview?: boolean }): Promise<Submission[]>;
  submitSolution(input: SubmissionInput): Promise<Submission>;
  gradeSubmission(id: string, input: GradeInput): Promise<Submission>;
  rejudgeSubmission(id: string): Promise<Submission>;
  getStandings(competitionId: string): Promise<StandingRow[]>;
  getNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<Notification>;
  reset(): Promise<void>;
}
