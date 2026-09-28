/** Full SSE event contract — shared by all listeners and the NgRx heartbeats slice. */

export type MonitorStatus = 'UP' | 'DOWN' | 'PENDING' | 'PAUSED';

/** Payload shape for the `heartbeat` SSE event emitted by signal.service.js → sendToUser() */
export interface HeartbeatSSEPayload {
  monitorId: string;
  status: MonitorStatus;
  responseTime: number;
  statusCode?: number | null;
  error?: string | null;
  timestamp: string;
}

/** Payload shape for the `connected` SSE event emitted on stream open. */
export interface ConnectedSSEPayload {
  message: string;
}

/** Discriminated union of all typed SSE events the client understands. */
export type SSEEventType = 'connected' | 'heartbeat';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

/** Named-event handler map passed to SseClient.connect(). */
export type SSEHandlers = {
  onConnected?: (payload: ConnectedSSEPayload) => void;
  onHeartbeat?: (payload: HeartbeatSSEPayload) => void;
  onError?: (err: Event) => void;
};
