import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HeartbeatsState, HeartbeatEntry } from './heartbeats.state';

export const HEARTBEATS_FEATURE_KEY = 'heartbeats';

// --- Root feature selector --------------------------------------------------

export const selectHeartbeatsState =
  createFeatureSelector<HeartbeatsState>(HEARTBEATS_FEATURE_KEY);

// --- SSE status selectors ---------------------------------------------------

/** Current SSE connection status: 'idle' | 'connecting' | 'connected' | 'error' */
export const selectSseStatus = createSelector(
  selectHeartbeatsState,
  (s) => s.sseStatus
);

/** ISO timestamp of the most recently processed heartbeat event. */
export const selectLastHeartbeatTimestamp = createSelector(
  selectHeartbeatsState,
  (s) => s.lastUpdated
);

// --- Per-monitor data selectors ---------------------------------------------

/**
 * Returns the full ring buffer for a specific monitor (newest first).
 * Usage: store.select(selectHeartbeatsByMonitor(monitorId))
 */
export const selectHeartbeatsByMonitor = (monitorId: string) =>
  createSelector(
    selectHeartbeatsState,
    (s): HeartbeatEntry[] => s.byMonitorId[monitorId] ?? []
  );

/**
 * Returns only the latest HeartbeatEntry for a monitor, or undefined.
 * Usage: store.select(selectLatestHeartbeatForMonitor(monitorId))
 */
export const selectLatestHeartbeatForMonitor = (monitorId: string) =>
  createSelector(
    selectHeartbeatsByMonitor(monitorId),
    (entries): HeartbeatEntry | undefined => entries[0]
  );

/**
 * Returns the last N entries for a monitor in ascending order (oldest first),
 * suitable for chart rendering.
 *
 * @param monitorId - Target monitor ID
 * @param count     - Number of entries to return (default: 50)
 */
export const selectRecentHeartbeatsForChart = (monitorId: string, count = 50) =>
  createSelector(
    selectHeartbeatsByMonitor(monitorId),
    (entries): HeartbeatEntry[] => [...entries].slice(0, count).reverse()
  );

/**
 * Computes the real-time uptime percentage for a monitor
 * based on the last N heartbeats in the ring buffer.
 */
export const selectUptimePercentForMonitor = (monitorId: string, count = 50) =>
  createSelector(
    selectHeartbeatsByMonitor(monitorId),
    (entries): number => {
      const slice = entries.slice(0, count);
      if (!slice.length) return 100;
      const upCount = slice.filter((e) => e.status === 'UP').length;
      return Math.round((upCount / slice.length) * 100);
    }
  );
