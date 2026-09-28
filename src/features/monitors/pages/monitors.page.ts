import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppState } from '../../../core/store/app.state';
import { monitorsActions } from '../store/monitors.actions';
import { MonitorItem, MonitorStatus } from '../api/monitors.api';
import {
  selectAllMonitors,
  selectMonitorsLoading,
  selectMonitorCount,
  selectMonitorsError,
  selectIsSubmitting,
} from '../store/monitors.selectors';
import { EditMonitorModalComponent } from '../components/edit-monitor-modal/edit-monitor-modal.component';

@Component({
  standalone: true,
  selector: 'app-monitors-page',
  imports: [CommonModule, RouterModule, FormsModule, EditMonitorModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Monitors</h1>
          <p class="text-sm text-slate-400 mt-0.5">
            {{ (totalCount$ | async) }} monitor(s) — manage status and view details
          </p>
        </div>
        <button
          (click)="openCreateModal()"
          class="inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all w-full sm:w-auto">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>New Monitor</span>
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading$ | async" class="flex items-center justify-center py-24">
        <div class="flex flex-col items-center space-y-3">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-blue-500"></i>
          <p class="text-sm text-slate-400">Loading monitors...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!(loading$ | async) && (totalCount$ | async) === 0"
           class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-14 text-center">
        <div class="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
          <i class="fa-solid fa-tower-broadcast text-2xl text-blue-400"></i>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">No monitors yet</h3>
        <p class="text-sm text-slate-400 mb-5">Create your first monitor to start tracking uptime.</p>
        <button (click)="openCreateModal()"
          class="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all">
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Add Monitor</span>
        </button>
      </div>

      <!-- Monitors Grid -->
      <div *ngIf="!(loading$ | async) && (totalCount$ | async)! > 0"
           class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <div *ngFor="let m of (monitors$ | async)"
             class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-200 hover:-translate-y-0.5">

          <!-- Card Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3 min-w-0">
              <div [class]="'w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ' +
                (m.status === 'UP' ? 'bg-emerald-600/20' :
                 m.status === 'DOWN' ? 'bg-red-600/20' :
                 m.status === 'PAUSED' ? 'bg-slate-700/60' : 'bg-amber-600/20')">
                <i [class]="'fa-solid text-base ' +
                  (m.type === 'API' ? 'fa-code' : 'fa-globe') + ' ' +
                  (m.status === 'UP' ? 'text-emerald-400' :
                   m.status === 'DOWN' ? 'text-red-400' :
                   m.status === 'PAUSED' ? 'text-slate-400' : 'text-amber-400')"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-white truncate">{{ m.name }}</p>
                <p class="text-xs text-slate-500 truncate">{{ m.url }}</p>
              </div>
            </div>
            <!-- Live status dot -->
            <span [class]="'flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1 ml-2 ' +
              (m.status === 'UP' ? 'bg-emerald-400 animate-pulse' :
               m.status === 'DOWN' ? 'bg-red-500 animate-pulse' :
               m.status === 'PAUSED' ? 'bg-slate-500' : 'bg-amber-400 animate-pulse')">
            </span>
          </div>

          <!-- Meta row -->
          <div class="flex items-center space-x-3 mb-4">
            <span class="text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/40 px-2 py-1 rounded-full">
              {{ m.type }}
            </span>
            <span class="text-xs text-slate-500">
              <i class="fa-solid fa-clock mr-1"></i>every {{ m.interval }}s
            </span>
            <span class="text-xs text-slate-500">
              <i class="fa-solid fa-hourglass mr-1"></i>{{ m.timeout / 1000 }}s timeout
            </span>
          </div>

          <!-- Status Selector -->
          <div class="border-t border-slate-800/60 pt-4">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Update Status</p>
            <div class="grid grid-cols-2 gap-2">
              <button *ngFor="let s of statusOptions"
                (click)="updateStatus(m, s.value)"
                [disabled]="m.status === s.value || updatingId() === m._id"
                [class]="'flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ' +
                  (m.status === s.value
                    ? s.activeClass
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-white') +
                  (updatingId() === m._id ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer')">
                <i *ngIf="updatingId() === m._id && m.status !== s.value" class="fa-solid fa-spinner fa-spin text-xs"></i>
                <i *ngIf="updatingId() !== m._id || m.status === s.value" [class]="'fa-solid text-xs ' + s.icon"></i>
                <span>{{ s.label }}</span>
              </button>
            </div>
          </div>

          <!-- Footer: created date -->
          <div class="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between">
            <span class="text-xs text-slate-600">
              <i class="fa-solid fa-calendar mr-1"></i>
              Created {{ m.createdAt | date:'mediumDate' }}
            </span>
            <div class="flex items-center gap-1.5">
              <a [routerLink]="['/monitors', m._id]"
                 class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                Details <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </a>
              <button
                (click)="openEditModal(m)"
                title="Edit monitor configuration"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-blue-400 hover:text-white hover:bg-blue-600/80 border border-transparent hover:border-blue-600/60 transition-all cursor-pointer">
                <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                Edit
              </button>
              <button
                (click)="requestDelete(m._id)"
                [disabled]="(isSubmitting$ | async)!"
                title="Delete monitor"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-red-400 hover:text-white hover:bg-red-600/80 border border-transparent hover:border-red-600/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <i class="fa-solid fa-trash-can text-[11px]"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="confirmDeleteId()"
           class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
           (click)="cancelDelete()">
        <div class="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
            <div class="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 flex-shrink-0">
              <i class="fa-solid fa-trash-can"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Delete Monitor?</h3>
              <p class="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-slate-300">
              All heartbeat records and incident history for this monitor will be permanently removed.
              Are you sure you want to continue?
            </p>
          </div>
          <div class="px-6 pb-5 flex items-center gap-3">
            <button (click)="cancelDelete()"
              class="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/40 transition-all">
              Cancel
            </button>
            <button (click)="confirmDelete()"
              [disabled]="!!deletingId()"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              <i *ngIf="deletingId()" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i *ngIf="!deletingId()" class="fa-solid fa-trash-can text-xs"></i>
              <span>{{ deletingId() ? 'Deleting...' : 'Yes, Delete' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Create Modal -->
      <div *ngIf="showCreateModal()"
           class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
           (click)="closeCreateModal()">
        <div class="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl"
             (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
            <h3 class="text-base font-bold text-white">New Monitor</h3>
            <button (click)="closeCreateModal()" class="text-slate-500 hover:text-white transition-colors">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label>
              <input [(ngModel)]="form.name" type="text" placeholder="My API Service"
                class="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"/>
            </div>
            <!-- URL -->
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">URL *</label>
              <input [(ngModel)]="form.url" type="url" placeholder="https://api.example.com/health"
                class="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"/>
            </div>
            <!-- Type + Interval row -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type</label>
                <select [(ngModel)]="form.type"
                  class="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="API">API</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Interval (s)</label>
                <input [(ngModel)]="form.interval" type="number" min="10" max="86400" placeholder="60"
                  class="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"/>
              </div>
            </div>
            <!-- Error -->
            <p *ngIf="error$ | async" class="text-xs text-red-400 font-medium">{{ error$ | async }}</p>
            <p *ngIf="localError()" class="text-xs text-red-400 font-medium">{{ localError() }}</p>
          </div>
          <div class="px-6 pb-5 flex items-center space-x-3">
            <button (click)="closeCreateModal()"
              class="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/40 transition-all">
              Cancel
            </button>
            <button (click)="submitCreate()"
              [disabled]="(isSubmitting$ | async)!"
              class="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              <i *ngIf="isSubmitting$ | async" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i *ngIf="!(isSubmitting$ | async)" class="fa-solid fa-plus text-xs"></i>
              <span>{{ (isSubmitting$ | async) ? 'Creating...' : 'Create Monitor' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Monitor Modal -->
      <app-edit-monitor-modal
        [isOpen]="!!editingMonitor()"
        [monitor]="editingMonitor()"
        (closed)="closeEditModal()"
        (saved)="onMonitorSaved($event)">
      </app-edit-monitor-modal>

      <!-- Success Toast Notification -->
      <div *ngIf="successToast()"
           class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-emerald-500/50 text-emerald-400 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <i class="fa-solid fa-circle-check text-base"></i>
        <span class="text-xs font-semibold text-white">{{ successToast() }}</span>
        <button (click)="successToast.set(null)" class="text-slate-400 hover:text-white ml-2 text-xs p-1">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

    </div>
  `,
})
export class MonitorsPage implements OnInit {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  readonly monitors$ = this.store.select(selectAllMonitors);
  readonly loading$ = this.store.select(selectMonitorsLoading);
  readonly totalCount$ = this.store.select(selectMonitorCount);
  readonly isSubmitting$ = this.store.select(selectIsSubmitting);
  readonly error$ = this.store.select(selectMonitorsError);

  // Signals for UI state
  readonly updatingId = signal<string | null>(null);
  readonly showCreateModal = signal(false);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly localError = signal<string | null>(null);
  readonly editingMonitor = signal<MonitorItem | null>(null);
  readonly successToast = signal<string | null>(null);

  form = {
    name: '',
    url: '',
    type: 'WEBSITE' as 'WEBSITE' | 'API',
    interval: 60,
    timeout: 5000,
  };

  readonly statusOptions: Array<{
    value: MonitorStatus;
    label: string;
    icon: string;
    activeClass: string;
  }> = [
      {
        value: 'UP',
        label: 'Up',
        icon: 'fa-check-circle',
        activeClass:
          'bg-emerald-950/50 border-emerald-700/50 text-emerald-400',
      },
      {
        value: 'DOWN',
        label: 'Down',
        icon: 'fa-times-circle',
        activeClass: 'bg-red-950/50 border-red-700/50 text-red-400',
      },
      {
        value: 'PAUSED',
        label: 'Pause',
        icon: 'fa-pause-circle',
        activeClass: 'bg-slate-800 border-slate-600 text-slate-300',
      },
      {
        value: 'PENDING',
        label: 'Pending',
        icon: 'fa-clock',
        activeClass:
          'bg-amber-950/50 border-amber-700/50 text-amber-400',
      },
    ];

  ngOnInit(): void {
    this.store.dispatch(monitorsActions.loadMonitors());

    // Close modal on create success
    this.actions$.pipe(
      ofType(monitorsActions.createMonitorSuccess),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.closeCreateModal();
    });

    // Clear deleting state after delete completes (success or fail)
    this.actions$.pipe(
      ofType(monitorsActions.deleteMonitorSuccess, monitorsActions.deleteMonitorFailure),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.deletingId.set(null);
      this.confirmDeleteId.set(null);
    });
  }

  updateStatus(monitor: MonitorItem, status: MonitorStatus): void {
    if (monitor.status === status) return;
    this.updatingId.set(monitor._id);
    this.store.dispatch(
      monitorsActions.updateStatus({ id: monitor._id, status })
    );
    // Clear spinner after a short delay (effect handles the real update)
    setTimeout(() => this.updatingId.set(null), 1500);
  }

  openCreateModal(): void {
    this.form = { name: '', url: '', type: 'WEBSITE', interval: 60, timeout: 5000 };
    this.localError.set(null);
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  openEditModal(monitor: MonitorItem): void {
    this.editingMonitor.set(monitor);
  }

  closeEditModal(): void {
    this.editingMonitor.set(null);
  }

  onMonitorSaved(updated: MonitorItem): void {
    // In-memory reactive state update without a full page refresh
    this.store.dispatch(monitorsActions.updateMonitorSuccess({ monitor: updated }));
    this.successToast.set(`Monitor "${updated.name}" updated successfully!`);
    setTimeout(() => {
      this.successToast.set(null);
    }, 4500);
  }

  requestDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.deletingId.set(id);
    this.store.dispatch(monitorsActions.deleteMonitor({ id }));
  }

  submitCreate(): void {
    if (!this.form.name.trim() || !this.form.url.trim()) {
      this.localError.set('Name and URL are required.');
      return;
    }
    this.localError.set(null);
    this.store.dispatch(
      monitorsActions.createMonitor({
        payload: {
          name: this.form.name.trim(),
          url: this.form.url.trim(),
          type: this.form.type,
          interval: Number(this.form.interval),
          timeout: Number(this.form.timeout),
        },
      })
    );
  }
}
