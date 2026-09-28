import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map } from 'rxjs';

import { AppState } from '../../../core/store/app.state';
import { monitorsActions } from '../../monitors/store/monitors.actions';
import { MonitorItem } from '../../monitors/api/monitors.api';
import {
  selectAllMonitors,
  selectMonitorsLoading,
  selectMonitorCount,
  selectUpCount,
  selectDownCount
} from '../../monitors/store/monitors.selectors';
import { selectCurrentUser } from '../../auth/store/auth.selectors';
import { AuthService } from '../../auth/services/auth.service';

interface DashboardStats {
  totalMonitors: number;
  upMonitors: number;
  downMonitors: number;
  uptimePct: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p class="text-sm text-slate-400 mt-0.5">
            Welcome back, <span class="text-blue-400 font-semibold">{{ currentUser()?.name ?? (user$ | async)?.name ?? 'User' }}</span>
          </p>
        </div>
        <a routerLink="/monitors"
           class="inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all w-full sm:w-auto">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>New Monitor</span>
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading$ | async" class="flex items-center justify-center py-20">
        <div class="flex flex-col items-center space-y-3">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i>
          <p class="text-sm text-slate-400">Loading monitors from server...</p>
        </div>
      </div>

      <ng-container *ngIf="!(loading$ | async)">
        <!-- Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4" *ngIf="stats$ | async as stats">
          <!-- Total Monitors -->
          <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all hover:-translate-y-0.5 duration-200">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600/20 text-blue-400">
                <i class="fa-solid fa-tower-broadcast text-base"></i>
              </div>
            </div>
            <p class="text-2xl font-extrabold text-white tracking-tight">{{ stats.totalMonitors }}</p>
            <p class="text-sm font-semibold text-slate-400 mt-0.5">Total Monitors</p>
            <p class="text-xs text-slate-600 mt-1">{{ stats.upMonitors }} up, {{ stats.downMonitors }} down</p>
          </div>

          <!-- Overall Uptime -->
          <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all hover:-translate-y-0.5 duration-200">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600/20 text-emerald-400">
                <i class="fa-solid fa-shield-halved text-base"></i>
              </div>
              <span *ngIf="stats.downMonitors === 0" class="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center space-x-1">
                <i class="fa-solid fa-arrow-up text-xs"></i><span>Healthy</span>
              </span>
              <span *ngIf="stats.downMonitors > 0" class="text-xs font-semibold px-2 py-1 rounded-full bg-red-950/40 text-red-400 flex items-center space-x-1">
                <i class="fa-solid fa-arrow-down text-xs"></i><span>Issues</span>
              </span>
            </div>
            <p class="text-2xl font-extrabold text-white tracking-tight">{{ stats.uptimePct }}</p>
            <p class="text-sm font-semibold text-slate-400 mt-0.5">Overall Uptime</p>
            <p class="text-xs text-slate-600 mt-1">Based on active monitors</p>
          </div>

          <!-- Active / Down -->
          <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all hover:-translate-y-0.5 duration-200">
            <div class="flex items-start justify-between mb-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600/20 text-emerald-400">
                <i class="fa-solid fa-check-circle text-base"></i>
              </div>
            </div>
            <p class="text-2xl font-extrabold text-white tracking-tight">{{ stats.upMonitors }}</p>
            <p class="text-sm font-semibold text-slate-400 mt-0.5">Monitors Up</p>
            <p class="text-xs text-slate-600 mt-1">{{ stats.downMonitors }} currently down</p>
          </div>

          <!-- Down Monitors -->
          <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all hover:-translate-y-0.5 duration-200">
            <div class="flex items-start justify-between mb-4">
              <div [class]="'w-10 h-10 rounded-xl flex items-center justify-center ' + (stats.downMonitors > 0 ? 'bg-red-600/20 text-red-400' : 'bg-slate-700/40 text-slate-500')">
                <i class="fa-solid fa-triangle-exclamation text-base"></i>
              </div>
              <span *ngIf="stats.downMonitors > 0" class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mt-1"></span>
            </div>
            <p [class]="'text-2xl font-extrabold tracking-tight ' + (stats.downMonitors > 0 ? 'text-red-400' : 'text-white')">{{ stats.downMonitors }}</p>
            <p class="text-sm font-semibold text-slate-400 mt-0.5">Monitors Down</p>
            <p class="text-xs text-slate-600 mt-1">Requires attention</p>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="(totalCount$ | async) === 0" class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-tower-broadcast text-2xl text-blue-400"></i>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">No monitors yet</h3>
          <p class="text-sm text-slate-400 mb-5">Add your first monitor to start tracking uptime.</p>
          <a routerLink="/monitors"
             class="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Add First Monitor</span>
          </a>
        </div>

        <!-- Monitors Table -->
        <div *ngIf="(totalCount$ | async)! > 0" class="bg-slate-900/80 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
            <div>
              <h3 class="text-sm font-bold text-white">Active Monitors</h3>
              <p class="text-xs text-slate-500 mt-0.5">Real-time status from server</p>
            </div>
            <a routerLink="/monitors" class="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center space-x-1">
              <span>View all</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </a>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-800/40">
                  <th class="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Monitor</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Interval</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of (monitors$ | async); let last = last"
                    [class]="'hover:bg-slate-800/30 transition-colors cursor-pointer ' + (!last ? 'border-b border-slate-800/30' : '')">
                  <td class="px-5 py-4">
                    <p class="text-sm font-semibold text-white">{{ m.name }}</p>
                    <p class="text-xs text-slate-500 truncate max-w-[220px]">{{ m.url }}</p>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700/40">
                      <i [class]="'fa-solid text-xs ' + (m.type === 'API' ? 'fa-code' : 'fa-globe')"></i>
                      <span>{{ m.type }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <span [class]="'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ' +
                      (m.status === 'UP' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' :
                       m.status === 'DOWN' ? 'bg-red-950/50 text-red-400 border border-red-800/40' :
                       m.status === 'PAUSED' ? 'bg-slate-800 text-slate-400 border border-slate-700/40' :
                       'bg-amber-950/50 text-amber-400 border border-amber-800/40')">
                      <span [class]="'w-1.5 h-1.5 rounded-full ' +
                        (m.status === 'UP' ? 'bg-emerald-400 animate-pulse' :
                         m.status === 'DOWN' ? 'bg-red-400 animate-pulse' :
                         m.status === 'PAUSED' ? 'bg-slate-400' : 'bg-amber-400 animate-pulse')"></span>
                      <span>{{ m.status }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <span class="text-sm text-slate-400">{{ m.interval }}s</span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <span class="text-xs text-slate-500">{{ m.updatedAt | date:'short' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly store = inject<Store<AppState>>(Store);

  readonly currentUser = this.authService.currentUser;
  readonly user$ = this.store.select(selectCurrentUser);
  readonly monitors$ = this.store.select(selectAllMonitors);
  readonly loading$ = this.store.select(selectMonitorsLoading);
  readonly totalCount$ = this.store.select(selectMonitorCount);

  readonly stats$: Observable<DashboardStats> = combineLatest([
    this.store.select(selectMonitorCount),
    this.store.select(selectUpCount),
    this.store.select(selectDownCount),
    this.store.select(selectAllMonitors),
  ]).pipe(
    map(([total, up, down, monitors]) => ({
      totalMonitors: total,
      upMonitors: up,
      downMonitors: down,
      uptimePct: total > 0 ? `${Math.round((up / total) * 10000) / 100}%` : '—'
    }))
  );

  ngOnInit(): void {
    this.store.dispatch(monitorsActions.loadMonitors());
  }
}
