export type Role = 'athlete' | 'admin';
export type CompetitionStatus = 'registration' | 'upcoming' | 'active' | 'finished';
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
}

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
}

export interface LoginInput { email: string; password: string }
export interface RegisterInput { fullName: string; email: string; password: string; cityId: string; organization: string }
export type CompetitionInput = Omit<Competition, 'id'>;
export type ResultInput = Omit<CompetitionResult, 'id' | 'publishedAt'>;
export type MeterInput = Omit<MeterTransaction, 'id' | 'createdAt'>;
