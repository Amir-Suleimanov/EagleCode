import { useQuery } from '@tanstack/react-query';
import { dataClient } from '../services/client';

export const useAthletes = () => useQuery({ queryKey: ['athletes'], queryFn: () => dataClient.getAthletes() });
export const useCities = () => useQuery({ queryKey: ['cities'], queryFn: () => dataClient.getCities() });
export const useCompetitions = () => useQuery({ queryKey: ['competitions'], queryFn: () => dataClient.getCompetitions() });
export const useApplications = () => useQuery({ queryKey: ['applications'], queryFn: () => dataClient.getApplications() });
export const useResults = () => useQuery({ queryKey: ['results'], queryFn: () => dataClient.getResults() });
export const useTransactions = () => useQuery({ queryKey: ['transactions'], queryFn: () => dataClient.getTransactions() });
export const useLevels = () => useQuery({ queryKey: ['levels'], queryFn: () => dataClient.getLevels() });

