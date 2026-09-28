import { MonitorStatus } from '../../../core/realtime/types/sse.types';

/** A single heartbeat data point stored in the ring buffer. */
export interface HeartbeatEntry {
  monitorId: string;
  status: MonitorStatus;
  responseTime: number;
  statusCode?: number | null;
  error?: string | null;
  timestamp: string;
}

/**
 * HeartbeatsState — in-memory ring buffer of live heartbeat events.
 *
 * byMonitorId: Record<monitorId, HeartbeatEntry[]>
 *   Each monitor keeps at most MAX_HEARTBEATS_PER_MONITOR entries (ring buffer).
 *   Entries are prepended (newest first) so index 0 is always the latest.
 *
 * sseStatus: reflects the current SSE connection lifecycle.
 * lastUpdated: ISO timestamp of the most recently processed heartbeat event.
 */
export interface HeartbeatsState {
  byMonitorId: Record<string, HeartbeatEntry[]>;
  sseStatus: 'idle' | 'connecting' | 'connected' | 'error';
  lastUpdated: string | null;
}

/** Maximum heartbeat entries retained per monitor (ring buffer cap). */
export const MAX_HEARTBEATS_PER_MONITOR = 200;

export const initialHeartbeatsState: HeartbeatsState = {
  byMonitorId: {},
  sseStatus: 'idle',
  lastUpdated: null,
};
