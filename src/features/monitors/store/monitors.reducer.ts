import { createReducer, on } from '@ngrx/store';
import { initialMonitorsState } from './monitors.state';
import { monitorsActions } from './monitors.actions';

export const monitorsReducer = createReducer(
  initialMonitorsState,

  // Load all
  on(monitorsActions.loadMonitors, (state) => ({ ...state, isLoading: true, error: null })),
  on(monitorsActions.loadMonitorsSuccess, (state, { monitors }) => ({
    ...state, monitors, isLoading: false
  })),
  on(monitorsActions.loadMonitorsFailure, (state, { error }) => ({
    ...state, isLoading: false, error
  })),

  // Load detail
  on(monitorsActions.loadMonitorDetail, (state) => ({ ...state, isLoading: true, error: null })),
  on(monitorsActions.loadMonitorDetailSuccess, (state, { monitor }) => ({
    ...state, selectedMonitor: monitor, isLoading: false
  })),
  on(monitorsActions.loadMonitorDetailFailure, (state, { error }) => ({
    ...state, isLoading: false, error
  })),

  // Create
  on(monitorsActions.createMonitor, (state) => ({ ...state, isSubmitting: true, error: null })),
  on(monitorsActions.createMonitorSuccess, (state, { monitor }) => ({
    ...state, monitors: [...state.monitors, monitor], isSubmitting: false
  })),
  on(monitorsActions.createMonitorFailure, (state, { error }) => ({
    ...state, isSubmitting: false, error
  })),

  // Update status
  on(monitorsActions.updateStatus, (state) => ({ ...state, isSubmitting: true })),
  on(monitorsActions.updateStatusSuccess, (state, { monitor }) => ({
    ...state,
    isSubmitting: false,
    monitors: state.monitors.map(m => m._id === monitor._id ? monitor : m),
    selectedMonitor: state.selectedMonitor?._id === monitor._id ? monitor : state.selectedMonitor,
  })),
  on(monitorsActions.updateStatusFailure, (state, { error }) => ({
    ...state, isSubmitting: false, error
  })),
  // Update monitor
  on(monitorsActions.updateMonitor, (state) => ({ ...state, isSubmitting: true, error: null })),
  on(monitorsActions.updateMonitorSuccess, (state, { monitor }) => ({
    ...state,
    isSubmitting: false,
    monitors: state.monitors.map(m => m._id === monitor._id ? monitor : m),
    selectedMonitor: state.selectedMonitor?._id === monitor._id ? monitor : state.selectedMonitor,
  })),
  on(monitorsActions.updateMonitorFailure, (state, { error }) => ({
    ...state, isSubmitting: false, error
  })),

  // Delete monitor
  on(monitorsActions.deleteMonitor, (state) => ({ ...state, isSubmitting: true, error: null })),
  on(monitorsActions.deleteMonitorSuccess, (state, { id }) => ({
    ...state,
    isSubmitting: false,
    monitors: state.monitors.filter(m => m._id !== id),
    selectedMonitor: state.selectedMonitor?._id === id ? null : state.selectedMonitor,
  })),
  on(monitorsActions.deleteMonitorFailure, (state, { error }) => ({
    ...state, isSubmitting: false, error
  })),
);
