import { MonitorItem } from '../api/monitors.api';

export interface MonitorsState {
  monitors: MonitorItem[];
  selectedMonitor: MonitorItem | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export const initialMonitorsState: MonitorsState = {
  monitors: [],
  selectedMonitor: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};
