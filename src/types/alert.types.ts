export type AlertStatus = 'DOWN' | 'RECOVERED' | 'DEGRADED';

export interface AlertMonitorRef {
  _id?: string;
  name: string;
  url: string;
  type?: string;
}

export interface AlertLog {
  id?: string;
  _id?: string;
  monitorId?: string;
  monitorName?: string;
  targetUrl?: string;
  monitor?: AlertMonitorRef | string;
  status: AlertStatus | string;
  statusCode?: number;
  responseTime?: number; // ms
  message?: string;
  error?: string;
  channel?: string | string[]; // e.g., 'email', 'slack', 'webhook'
  timestamp?: string | Date;
  createdAt?: string | Date;
  // Metadata flags for UI animation
  isNew?: boolean;
}

export interface AlertsApiResponse {
  success?: boolean;
  data?: AlertLog[];
  alerts?: AlertLog[];
  total?: number;
  message?: string;
}

export type SseConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface AlertToast {
  id: string;
  alert: AlertLog;
  timestamp: number;
}
