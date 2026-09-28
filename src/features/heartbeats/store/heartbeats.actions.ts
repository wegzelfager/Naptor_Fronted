import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { HeartbeatSSEPayload } from '../../../core/realtime/types/sse.types';

/**
 * Heartbeats NgRx action group.
 *
 * Action key naming is chosen so NgRx createActionGroup generates clean camelCase
 * property names (avoids the SSE→sSE acronym expansion issue):
 *
 *   'Stream Connect'   → streamConnect
 *   'Stream Disconnect'→ streamDisconnect
 *   'Stream Open'      → streamOpen
 *   'Stream Error'     → streamError
 *   'Heartbeat Arrived'→ heartbeatArrived
 */
export const heartbeatsActions = createActionGroup({
  source: 'Heartbeats',
  events: {
    // Lifecycle — dispatched by components/route guards
    'Stream Connect':    emptyProps(),
    'Stream Disconnect': emptyProps(),

    // Transport feedback — dispatched by HeartbeatListener
    'Stream Open':  props<{ message: string }>(),
    'Stream Error': props<{ error: string }>(),

    // Live heartbeat data — dispatched by HeartbeatListener
    'Heartbeat Arrived': props<{ payload: HeartbeatSSEPayload }>(),
  },
});
