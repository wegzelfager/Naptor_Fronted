import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MonitorsAPI, MonitorItem } from '../api/monitors.api';
import { monitorsActions } from './monitors.actions';

@Injectable()
export class MonitorsEffects {
  private readonly actions$ = inject(Actions);
  private readonly monitorsApi = inject(MonitorsAPI);

  loadMonitors$ = createEffect(() =>
    this.actions$.pipe(
      ofType(monitorsActions.loadMonitors),
      switchMap(() =>
        this.monitorsApi.getMonitors().pipe(
          map((res: any) => {
            // Backend returns: { status: 'success', data: { monitors: [] } }
            // catchError fallback returns: { monitors: [] }
            let list: MonitorItem[] = [];
            if (Array.isArray(res)) {
              list = res as MonitorItem[];
            } else {
              list = res?.data?.monitors ?? res?.monitors ?? [];
            }
            return monitorsActions.loadMonitorsSuccess({ monitors: list });
          }),
          catchError((err) => of(monitorsActions.loadMonitorsFailure({
            error: err?.error?.message ?? 'Failed to load monitors'
          })))
        )
      )
    )
  );

  loadMonitorDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(monitorsActions.loadMonitorDetail),
      switchMap(({ id }) =>
        this.monitorsApi.getMonitorById(id).pipe(
          map((res: any) => {
            const item = res?.data?.monitor ?? res?.data ?? res?.monitor ?? res;
            return monitorsActions.loadMonitorDetailSuccess({ monitor: item });
          }),
          catchError((err) => of(monitorsActions.loadMonitorDetailFailure({
            error: err?.error?.message ?? 'Failed to load monitor'
          })))
        )
      )
    )
  );

  createMonitor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(monitorsActions.createMonitor),
      switchMap(({ payload }) =>
        this.monitorsApi.createMonitor(payload).pipe(
          map((res: any) => {
            const item = res?.monitor ?? res?.data?.monitor ?? res?.data ?? res;
            return monitorsActions.createMonitorSuccess({ monitor: item });
          }),
          catchError((err) => of(monitorsActions.createMonitorFailure({
            error: err?.error?.message ?? 'Failed to create monitor'
          })))
        )
      )
    )
  );

  updateStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(monitorsActions.updateStatus),
      switchMap(({ id, status }) =>
        this.monitorsApi.updateMonitorStatus(id, status).pipe(
          map((res: any) => {
            const item = res?.data?.monitor ?? res?.data ?? res?.monitor ?? res;
            return monitorsActions.updateStatusSuccess({ monitor: item });
          }),
          catchError((err) => of(monitorsActions.updateStatusFailure({
            error: err?.error?.message ?? 'Failed to update status'
          })))
        )
      )
    )
  );

  updateMonitor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(monitorsActions.updateMonitor),
      switchMap(({ id, payload }) =>
        this.monitorsApi.updateMonitor(id, payload).pipe(
          map((res: any) => {
            const item = res?.data?.monitor ?? res?.data ?? res?.monitor ?? res;
            return monitorsActions.updateMonitorSuccess({ monitor: item });
          }),
          catchError((err) => of(monitorsActions.updateMonitorFailure({
            error: err?.error?.message ?? 'Failed to update monitor'
          })))
        )
      )
    )
  );

  deleteMonitor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(monitorsActions.deleteMonitor),
      switchMap(({ id }) =>
        this.monitorsApi.deleteMonitor(id).pipe(
          map(() => monitorsActions.deleteMonitorSuccess({ id })),
          catchError((err) => of(monitorsActions.deleteMonitorFailure({
            error: err?.error?.message ?? 'Failed to delete monitor'
          })))
        )
      )
    )
  );
}
