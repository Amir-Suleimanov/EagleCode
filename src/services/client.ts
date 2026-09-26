import type { DataClient } from './DataClient';
import { HttpDataClient } from './HttpDataClient';
import { MockDataClient } from './MockDataClient';

export const useHttpDataSource = import.meta.env.VITE_DATA_SOURCE === 'api';
export const dataClient: DataClient = useHttpDataSource
  ? new HttpDataClient(import.meta.env.VITE_API_BASE_URL ?? '/api')
  : new MockDataClient();
