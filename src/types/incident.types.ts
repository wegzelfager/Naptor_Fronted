export type IncidentStatus = 'OPEN' | 'RESOLVED';

export interface MonitorSummary {
  _id: string;
  name: string;
  url: string;
  type: string;
  status?: string;
}

export interface Incident {
  _id: string;
  monitor: MonitorSummary | string;
  user: string;
  status: IncidentStatus;
  cause: string;
  startedAt: string;
  resolvedAt?: string;
  duration: number; // in seconds
  createdAt: string;
  updatedAt?: string;
}

export interface IncidentsPagination {
  total: number;
  page: number;
  pages: number;
}

export interface IncidentsResponse {
  success: boolean;
  message?: string;
  data: Incident[];
  pagination: IncidentsPagination;
  totalIncidents?: number;
}

export interface UptimeStats {
  '24h': number;
  '7d': number;
  '30d': number;
}

export interface UptimeResponse {
  success: boolean;
  data: UptimeStats;
}
