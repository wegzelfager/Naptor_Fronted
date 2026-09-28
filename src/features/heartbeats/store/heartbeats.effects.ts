import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap, map, filter } from 'rxjs/operators';
import { heartbeatsActions } from './heartbeats.actions';
import { HeartbeatListener } from '../../../core/realtime/listeners/heartbeat.listener';
import { monitorsActions } from '../../monitors/store/monitors.actions';
import { MonitorStatus } from '../../../core/realtime/types/sse.types';

@Injectable()
export class HeartbeatsEffects {
  private readonly actions$ = inject(Actions);
  private readonly heartbeatListener = inject(HeartbeatListener);

  /**
   * streamConnect$: Opens the SSE heartbeat channel when streamConnect is dispatched.
   * Dispatched by MonitorDetailPage.ngOnInit().
   */
  streamConnect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(heartbeatsActions.streamConnect),
        tap(() => {
          console.log('[HeartbeatsEffects] Starting SSE listener…');
          this.heartbeatListener.startListening();
        })
      ),
    { dispatch: false }
  );

  /**
   * streamDisconnect$: Closes the SSE heartbeat channel when streamDisconnect is dispatched.
   * Dispatched by MonitorDetailPage.ngOnDestroy().
   */
  streamDisconnect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(heartbeatsActions.streamDisconnect),
        tap(() => {
          console.log('[HeartbeatsEffects] Stopping SSE listener…');
          this.heartbeatListener.stopListening();
        })
      ),
    { dispatch: false }
  );

  /**
   * syncMonitorStatus$: On every live heartbeat, patches the monitor's status
   * in the monitors NgRx slice so list-view badges update reactively without polling.
   */
  syncMonitorStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(heartbeatsActions.heartbeatArrived),
      filter(({ payload }) => !!payload.monitorId),
      map(({ payload }) =>
        monitorsActions.updateStatusSuccess({
          monitor: {
            _id:      payload.monitorId,
            status:   payload.status as MonitorStatus,
            userId:    '',
            name:      '',
            url:       '',
            type:      'WEBSITE',
            interval:  0,
            timeout:   0,
            createdAt: '',
            updatedAt: payload.timestamp,
          },
        })
      )
    )
  );
}
