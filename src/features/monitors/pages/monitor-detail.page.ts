import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../../core/store/app.state';
import { MonitorsAPI, MonitorItem } from '../api/monitors.api';
import { HeartbeatsAPI, HeartbeatItem } from '../../heartbeats/api/heartbeats.api';
import { HeartbeatDotStripComponent } from '../../heartbeats/components/heartbeat-dot-strip.component';
import { HeartbeatChartComponent } from '../../heartbeats/components/heartbeat-chart.component';

import { heartbeatsActions } from '../../heartbeats/store/heartbeats.actions';
import {
  selectHeartbeatsByMonitor,
  selectSseStatus,
  selectRecentHeartbeatsForChart,
} from '../../heartbeats/store/heartbeats.selectors';
import { HeartbeatEntry } from '../../heartbeats/store/heartbeats.state';

@Component({
  standalone: true,
  selector: 'app-monitor-detail-page',
  imports: [
    CommonModule,
    RouterModule,
    HeartbeatDotStripComponent,
    HeartbeatChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
      <!-- Top Navigation Header -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-center space-x-3">
          <a
            routerLink="/monitors"
            class="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/40 text-slate-400 hover:text-white flex items-center justify-center transition-all">
            <i class="fa-solid fa-arrow-left text-sm"></i>
          </a>
          <div>
            <div class="flex items-center space-x-3">
              <h1 class="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                {{ monitor()?.name ?? 'Monitor Detail' }}
              </h1>
              <span
                *ngIf="monitor()"
                [class]="'px-2.5 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ' +
                  (monitor()?.status === 'UP' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' :
                   monitor()?.status === 'DOWN' ? 'bg-red-950/50 text-red-400 border border-red-800/40' :
                   monitor()?.status === 'PAUSED' ? 'bg-slate-800 text-slate-400 border border-slate-700/40' :
                   'bg-amber-950/50 text-amber-400 border border-amber-800/40')">
                <span
                  [class]="'w-1.5 h-1.5 rounded-full ' +
                    (monitor()?.status === 'UP' ? 'bg-emerald-400 animate-pulse' :
                     monitor()?.status === 'DOWN' ? 'bg-red-400 animate-pulse' : 'bg-slate-400')">
                </span>
                <span>{{ monitor()?.status }}</span>
              </span>
            </div>
            <p class="text-xs text-slate-500 font-mono mt-0.5">{{ monitor()?.url }}</p>
          </div>
        </div>

        <!-- Live SSE Status Indicator -->
        <div
          [class]="'flex items-center space-x-2 border px-3.5 py-2 rounded-xl text-xs transition-all ' +
            ((sseStatus$ | async) === 'connected'   ? 'bg-emerald-950/40 border-emerald-800/40' :
             (sseStatus$ | async) === 'connecting'  ? 'bg-amber-950/40 border-amber-800/40' :
             (sseStatus$ | async) === 'error'       ? 'bg-red-950/40 border-red-800/40' :
             'bg-slate-900 border-slate-800/60')">
          <span
            [class]="'w-2 h-2 rounded-full ' +
              ((sseStatus$ | async) === 'connected'  ? 'bg-emerald-400 animate-ping' :
               (sseStatus$ | async) === 'connecting' ? 'bg-amber-400 animate-pulse' :
               (sseStatus$ | async) === 'error'      ? 'bg-red-400' :
               'bg-slate-500')">
          </span>
          <span
            [class]="'font-semibold ' +
              ((sseStatus$ | async) === 'connected'  ? 'text-emerald-400' :
               (sseStatus$ | async) === 'connecting' ? 'text-amber-400' :
               (sseStatus$ | async) === 'error'      ? 'text-red-400' :
               'text-slate-400')">
            {{
              (sseStatus$ | async) === 'connected'  ? 'SSE Live Stream Active' :
              (sseStatus$ | async) === 'connecting' ? 'Connecting…' :
              (sseStatus$ | async) === 'error'      ? 'Stream Error — Retrying…' :
              'SSE Idle'
            }}
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex items-center justify-center py-20">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i>
      </div>

      <ng-container *ngIf="!loading()">
        <!-- 50-Check Heartbeat Strip Card -->
        <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 space-y-3">
          <h3 class="text-sm font-bold text-white">50-Check Heartbeat Status Strip</h3>
          <app-heartbeat-dot-strip [heartbeats]="asDotStripItems(chartBeats$ | async)"></app-heartbeat-dot-strip>
        </div>

        <!-- Latency Chart -->
        <app-heartbeat-chart [heartbeats]="asDotStripItems(chartBeats$ | async)"></app-heartbeat-chart>

        <!-- Historical Heartbeats Log Table -->
        <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-white">Heartbeat Event History</h3>
              <p class="text-xs text-slate-500 mt-0.5">Real-time stream of ping heartbeats</p>
            </div>
            <span class="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full font-mono">
              {{ (allBeats$ | async)?.length ?? 0 }} events
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-800/40 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="text-left px-5 py-3">Timestamp</th>
                  <th class="text-center px-4 py-3">Status</th>
                  <th class="text-center px-4 py-3">Response Code</th>
                  <th class="text-center px-4 py-3">Latency</th>
                  <th class="text-right px-5 py-3">Error / Message</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/30">
                <tr
                  *ngFor="let hb of (allBeats$ | async)"
                  class="hover:bg-slate-800/30 transition-colors">
                  <td class="px-5 py-3 text-xs text-slate-300 font-mono">
                    {{ hb.timestamp | date:'medium' }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span
                      [class]="'inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-bold ' +
                        (hb.status === 'UP' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400')">
                      <span>{{ hb.status }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center font-mono text-xs">
                    <span [class]="hb.status === 'UP' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'">
                      {{ hb.statusCode ?? '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center font-mono text-xs text-slate-300">
                    {{ hb.responseTime ? hb.responseTime + 'ms' : '—' }}
                  </td>
                  <td class="px-5 py-3 text-right text-xs text-slate-500 truncate max-w-[200px]">
                    {{ hb.error || 'OK' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class MonitorDetailPage implements OnInit, OnDestroy {
  private readonly route   = inject(ActivatedRoute);
  private readonly store   = inject(Store<AppState>);
  private readonly monitorsApi  = inject(MonitorsAPI);
  private readonly heartbeatsApi = inject(HeartbeatsAPI);

  readonly monitorId = this.route.snapshot.paramMap.get('id') ?? '';

  // Local signals for monitor metadata + loading state
  readonly monitor = signal<MonitorItem | null>(null);
  readonly loading = signal(true);

  // NgRx store observables — all heartbeat data now flows through the store
  readonly sseStatus$  = this.store.select(selectSseStatus);
  readonly allBeats$: Observable<HeartbeatEntry[]> = this.store.select(
    selectHeartbeatsByMonitor(this.monitorId)
  );
  readonly chartBeats$: Observable<HeartbeatEntry[]> = this.store.select(
    selectRecentHeartbeatsForChart(this.monitorId, 50)
  );

  ngOnInit(): void {
    if (!this.monitorId) return;

    // 1. Load monitor metadata via direct API call (single fetch, no SSE needed)
    this.monitorsApi.getMonitorById(this.monitorId).subscribe((item) => {
      this.monitor.set(item);
      this.loading.set(false);
    });

    // 2. Seed the ring buffer with historical heartbeats so the chart isn't empty
    //    before the first SSE event arrives. We seed directly through the action
    //    to keep the store as single source of truth.
    this.heartbeatsApi.getHeartbeats(this.monitorId).subscribe((res) => {
      res.data.forEach((hb: HeartbeatItem) => {
        this.store.dispatch(
          heartbeatsActions.heartbeatArrived({
            payload: {
              monitorId:    hb.monitor,
              status:       hb.status,
              responseTime: hb.responseTime,
              statusCode:   hb.statusCode ?? null,
              error:        hb.error ?? null,
              timestamp:    hb.createdAt,
            },
          })
        );
      });
    });

    // 3. Open the SSE stream — HeartbeatsEffects wires this to HeartbeatListener
    this.store.dispatch(heartbeatsActions.streamConnect());
  }

  ngOnDestroy(): void {
    // Decrement ref-count on the SSE channel (SseManager closes if last consumer)
    this.store.dispatch(heartbeatsActions.streamDisconnect());
  }

  /**
   * Adapter: converts HeartbeatEntry[] (store shape) → HeartbeatItem[] (component Input shape).
   * Keeps store and legacy display components decoupled.
   */
  asDotStripItems(entries: HeartbeatEntry[] | null): HeartbeatItem[] {
    if (!entries) return [];
    return entries.map((e) => ({
      _id:          undefined,
      monitor:      e.monitorId,
      status:       e.status,
      statusCode:   e.statusCode ?? null,
      responseTime: e.responseTime,
      error:        e.error ?? null,
      createdAt:    e.timestamp,
    }));
  }
}
