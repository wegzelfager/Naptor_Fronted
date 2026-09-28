import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app.state';
import { SseManager } from '../sse.manager';
import { heartbeatsActions } from '../../../features/heartbeats/store/heartbeats.actions';
import { HeartbeatSSEPayload, ConnectedSSEPayload } from '../types/sse.types';

const HEARTBEAT_CHANNEL = 'heartbeat-stream';

/**
 * HeartbeatListener — bridges the SSE transport layer with the NgRx heartbeats store.
 *
 * Dispatches:
 *   heartbeatsActions.streamOpen()       on `event: connected`
 *   heartbeatsActions.heartbeatArrived() on `event: heartbeat`
 *   heartbeatsActions.streamError()      on EventSource onerror
 */
@Injectable({ providedIn: 'root' })
export class HeartbeatListener {
  private readonly store = inject(Store<AppState>);
  private readonly sseManager = inject(SseManager);

  /** Subscribes to the heartbeat SSE channel and begins dispatching store actions. */
  startListening(): void {
    this.sseManager.openChannel(HEARTBEAT_CHANNEL, {
      onConnected: (payload: ConnectedSSEPayload) => {
        console.log('[HeartbeatListener] SSE connected:', payload.message);
        this.store.dispatch(heartbeatsActions.streamOpen({ message: payload.message }));
      },

      onHeartbeat: (payload: HeartbeatSSEPayload) => {
        const normalisedPayload: HeartbeatSSEPayload = {
          ...payload,
          timestamp:
            typeof payload.timestamp === 'string'
              ? payload.timestamp
              : new Date(payload.timestamp).toISOString(),
        };
        this.store.dispatch(heartbeatsActions.heartbeatArrived({ payload: normalisedPayload }));
      },

      onError: (err: Event) => {
        console.error('[HeartbeatListener] SSE error:', err);
        this.store.dispatch(
          heartbeatsActions.streamError({ error: 'SSE connection error or stream closed.' })
        );
      },
    });
  }

  /** Decrements the ref-count on the heartbeat channel (closes if last consumer). */
  stopListening(): void {
    this.sseManager.closeChannel(HEARTBEAT_CHANNEL);
  }
}
