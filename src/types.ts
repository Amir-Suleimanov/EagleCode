export type Role = 'athlete' | 'admin';
export type CompetitionStatus = 'draft' | 'registration' | 'upcoming' | 'active' | 'finished';
export type CompetitionFormat = 'offline' | 'contest';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  athleteId?: string;
}

export interface Athlete {
  id: string;
  fullName: string;
  email: string;
  organization: string;
  cityId: string;
  disciplines: string[];
  sportTitle: string;
  meters: number;
  avatarInitials: string;
  joinedAt: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  discipline: string;
  location: string;
  startsAt: string;
  endsAt: string;
  registrationEndsAt: string;
  capacity: number;
  rewardMeters: number;
  status: CompetitionStatus;
  schedule: string[];
  format: CompetitionFormat;
  rules: string;
  externalPlatform: string;
  externalUrl: string;
  taskCount: number;
}

export type CheckType = 'auto' | 'manual';
export type Language = 'python' | 'text';
export type SubmissionStatus = 'queued' | 'running' | 'judged' | 'pending_review' | 'reviewed' | 'failed';
export type Verdict = 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';

export interface TestCase { input: string; expectedOutput: string; isSample: boolean }

export interface ContestTask {
  id: string;
  competitionId: string;
  order: number;
  title: string;
  statement: string;
  maxScore: number;
  checkType: CheckType;
  timeLimitMs: number;
  memoryLimitMb: number;
  materialsUrl: string;
  samples: TestCase[];
  testCount: number;
}

export interface TestReport { test: number; verdict: Verdict; timeMs: number; memoryKb: number; sample: boolean }

export interface Submission {
  id: string;
  taskId: string;
  competitionId: string;
  athleteId: string;
  athleteName: string;
  taskTitle: string;
  maxScore: number;
  language: Language;
  source: string;
  status: SubmissionStatus;
  verdict: Verdict | '';
  score: number | null;
  autoScore: number | null;
  manualScore: number | null;
  comment: string;
  passedTests: number;
  totalTests: number;
  maxTimeMs: number | null;
  maxMemoryKb: number | null;
  report: TestReport[];
  log: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface StandingTask { taskId: string; score: number; attempts: number; bestMinute: number | null }
export interface StandingRow { place: number; athleteId: string; fullName: string; total: number; penaltyMinutes: number; tasks: StandingTask[] }

export interface Application {
  id: string;
  athleteId: string;
  competitionId: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface CompetitionResult {
  id: string;
  competitionId: string;
  athleteId: string;
  place: number;
  score: string;
  metersAwarded: number;
  publishedAt: string;
}

export interface MeterTransaction {
  id: string;
  athleteId: string;
  amount: number;
  reason: string;
  protocol: string;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  district: string;
  coordinates: [number, number];
  participantCount?: number;
  meters?: number;
  position?: number;
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface Achievement {
  id: string;
  athleteId: string;
  title: string;
  description: string;
  category: string;
  status: 'verified' | 'progress' | 'locked';
  earnedAt?: string;
}

export interface EagleLevel {
  id: string;
  order: number;
  name: string;
  minMeters: number;
  maxMeters: number | null;
}

/** Mock storage keeps the recipient alongside the record; the API infers it from the token. */
export type StoredNotification = Notification & { userId: string };

export interface MockDatabase {
  credentials: Record<string, string>;
  users: SessionUser[];
  notifications: StoredNotification[];
  athletes: Athlete[];
  competitions: Competition[];
  applications: Application[];
  results: CompetitionResult[];
  transactions: MeterTransaction[];
  cities: City[];
  achievements: Achievement[];
  levels: EagleLevel[];
  tasks: (Omit<ContestTask, 'samples' | 'testCount'> & { tests: TestCase[] })[];
  submissions: Submission[];
}

export interface LoginInput { email: string; password: string }
export interface RegisterInput { fullName: string; email: string; password: string; cityId: string; organization: string }
export type CompetitionInput = Omit<Competition, 'id' | 'taskCount' | 'format' | 'rules' | 'externalPlatform' | 'externalUrl'> & Partial<Pick<Competition, 'format' | 'rules' | 'externalPlatform' | 'externalUrl'>>;
export type ContestInput = Pick<Competition, 'title' | 'description' | 'discipline' | 'startsAt' | 'endsAt' | 'rewardMeters' | 'rules' | 'externalPlatform' | 'externalUrl'>;
export type TaskInput = Omit<ContestTask, 'id' | 'samples' | 'testCount'>;
export interface SubmissionInput { taskId: string; language: Language; source: string }
export interface GradeInput { manualScore: number; comment: string }
export type ResultInput = Omit<CompetitionResult, 'id' | 'publishedAt'>;
export type MeterInput = Omit<MeterTransaction, 'id' | 'createdAt'>;
