import { useQuery } from '@tanstack/react-query';
import { isPending } from '../domain/contest';
import { dataClient } from '../services/client';

export const useAthletes = () => useQuery({ queryKey: ['athletes'], queryFn: () => dataClient.getAthletes() });
export const useCities = () => useQuery({ queryKey: ['cities'], queryFn: () => dataClient.getCities() });
export const useCompetitions = () => useQuery({ queryKey: ['competitions'], queryFn: () => dataClient.getCompetitions() });
export const useApplications = () => useQuery({ queryKey: ['applications'], queryFn: () => dataClient.getApplications() });
export const useResults = () => useQuery({ queryKey: ['results'], queryFn: () => dataClient.getResults() });
export const useTransactions = () => useQuery({ queryKey: ['transactions'], queryFn: () => dataClient.getTransactions() });
export const useLevels = () => useQuery({ queryKey: ['levels'], queryFn: () => dataClient.getLevels() });
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: () => dataClient.getNotifications() });

export const useCompetition = (id: string) => useQuery({
  queryKey: ['competition', id],
  queryFn: () => dataClient.getCompetition(id),
  // Status moves on by the clock, so an open contest page re-reads it.
  refetchInterval: (query) => (query.state.data?.status === 'finished' ? false : 20_000),
});
export const useContestTasks = (competitionId: string, status?: string) => useQuery({
  queryKey: ['contest-tasks', competitionId, status],
  queryFn: () => dataClient.getContestTasks(competitionId),
});
export const useSubmissions = (filters: { competitionId?: string; taskId?: string; needsReview?: boolean }) => useQuery({
  queryKey: ['submissions', filters],
  queryFn: () => dataClient.getSubmissions(filters),
  refetchInterval: (query) => (query.state.data?.some((item) => isPending(item.status)) ? 1500 : false),
});
export const useStandings = (competitionId: string, live: boolean) => useQuery({
  queryKey: ['standings', competitionId],
  queryFn: () => dataClient.getStandings(competitionId),
  refetchInterval: live ? 10_000 : false,
});
