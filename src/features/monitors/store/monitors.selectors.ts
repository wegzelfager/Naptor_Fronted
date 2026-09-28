import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MonitorsState } from './monitors.state';
import { MonitorStatus } from '../api/monitors.api';

export const MONITORS_FEATURE_KEY = 'monitors';

export const selectMonitorsState = createFeatureSelector<MonitorsState>(MONITORS_FEATURE_KEY);

export const selectAllMonitors = createSelector(
  selectMonitorsState, (s) => s.monitors
);

export const selectSelectedMonitor = createSelector(
  selectMonitorsState, (s) => s.selectedMonitor
);

export const selectMonitorsLoading = createSelector(
  selectMonitorsState, (s) => s.isLoading
);

export const selectMonitorsError = createSelector(
  selectMonitorsState, (s) => s.error
);

export const selectIsSubmitting = createSelector(
  selectMonitorsState, (s) => s.isSubmitting
);

export const selectMonitorsByStatus = (status: MonitorStatus) => createSelector(
  selectAllMonitors, (monitors) => monitors.filter(m => m.status === status)
);

export const selectUpMonitors = createSelector(
  selectAllMonitors, (monitors) => monitors.filter(m => m.status === 'UP')
);

export const selectDownMonitors = createSelector(
  selectAllMonitors, (monitors) => monitors.filter(m => m.status === 'DOWN')
);

export const selectMonitorCount = createSelector(
  selectAllMonitors, (monitors) => monitors.length
);

export const selectUpCount = createSelector(
  selectUpMonitors, (m) => m.length
);

export const selectDownCount = createSelector(
  selectDownMonitors, (m) => m.length
);
