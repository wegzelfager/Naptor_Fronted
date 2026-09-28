import { createReducer, on } from '@ngrx/store';
import {
  initialHeartbeatsState,
  MAX_HEARTBEATS_PER_MONITOR,
  HeartbeatEntry,
} from './heartbeats.state';
import { heartbeatsActions } from './heartbeats.actions';

export const heartbeatsReducer = createReducer(
  initialHeartbeatsState,

  // --- Stream lifecycle --------------------------------------------------------

  on(heartbeatsActions.streamConnect, (state) => ({
    ...state,
    sseStatus: 'connecting' as const,
  })),

  on(heartbeatsActions.streamOpen, (state) => ({
    ...state,
    sseStatus: 'connected' as const,
  })),

  on(heartbeatsActions.streamError, (state) => ({
    ...state,
    sseStatus: 'error' as const,
  })),

  on(heartbeatsActions.streamDisconnect, (state) => ({
    ...state,
    sseStatus: 'idle' as const,
  })),

  // --- Live heartbeat data -----------------------------------------------------

  /**
   * heartbeatArrived: prepends the new entry to the monitor's ring buffer.
   * Slices to MAX_HEARTBEATS_PER_MONITOR to keep memory bounded.
   * Newest entry is always at index 0 (reverse-chronological order).
   */
  on(heartbeatsActions.heartbeatArrived, (state, { payload }) => {
    const { monitorId } = payload;

    const entry: HeartbeatEntry = {
      monitorId,
      status:       payload.status,
      responseTime: payload.responseTime,
      statusCode:   payload.statusCode ?? null,
      error:        payload.error ?? null,
      timestamp:    payload.timestamp,
    };

    const existing = state.byMonitorId[monitorId] ?? [];
    const updated = [entry, ...existing].slice(0, MAX_HEARTBEATS_PER_MONITOR);

    return {
      ...state,
      byMonitorId: {
        ...state.byMonitorId,
        [monitorId]: updated,
      },
      lastUpdated: payload.timestamp,
    };
  })
);
