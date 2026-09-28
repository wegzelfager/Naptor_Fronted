import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '../services/settings.service';
import { finalize } from 'rxjs/operators';

const TIMEZONES = [
  { label: 'UTC (Coordinated Universal Time)',     value: 'UTC'                 },
  { label: 'Africa/Cairo (GMT+2 / GMT+3 DST)',     value: 'Africa/Cairo'        },
  { label: 'Europe/London (GMT / GMT+1 BST)',      value: 'Europe/London'       },
  { label: 'Europe/Paris (CET / CEST)',            value: 'Europe/Paris'        },
  { label: 'America/New_York (EST / EDT)',         value: 'America/New_York'    },
  { label: 'America/Chicago (CST / CDT)',          value: 'America/Chicago'     },
  { label: 'America/Los_Angeles (PST / PDT)',      value: 'America/Los_Angeles' },
  { label: 'Asia/Dubai (GST GMT+4)',               value: 'Asia/Dubai'          },
  { label: 'Asia/Riyadh (AST GMT+3)',              value: 'Asia/Riyadh'         },
  { label: 'Asia/Kolkata (IST GMT+5:30)',          value: 'Asia/Kolkata'        },
  { label: 'Asia/Singapore (SGT GMT+8)',           value: 'Asia/Singapore'      },
  { label: 'Asia/Tokyo (JST GMT+9)',               value: 'Asia/Tokyo'          },
  { label: 'Australia/Sydney (AEST / AEDT)',       value: 'Australia/Sydney'    },
];

import { NotificationPreferencesComponent } from '../components/notification-preferences.component';

/** NotificationsPage — Section 3: Notification Preferences & Timezone */
@Component({
  standalone: true,
  selector: 'app-notifications-page',
  imports: [CommonModule, ReactiveFormsModule, NotificationPreferencesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 sm:space-y-6 max-w-2xl">

      <!-- ═══════════════ SECTION 3: Notification Preferences ═══════════════ -->
      <section class="rounded-2xl bg-slate-900/80 border border-slate-800/60 backdrop-blur-xl overflow-hidden">

        <div class="px-6 py-4 border-b border-slate-800/60 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-bell text-violet-400 text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-bold text-white">Notification Preferences</h2>
            <p class="text-xs text-slate-500">Control how and when Naptor Signal notifies you</p>
          </div>
        </div>

        <form [formGroup]="notifForm" (ngSubmit)="savePreferences()" class="px-6 py-5 space-y-5">

          <!-- Loading Skeleton -->
          <ng-container *ngIf="loading()">
            <div *ngFor="let i of [0,1,2]"
              class="animate-pulse flex items-center justify-between py-3 border-b border-slate-800/40">
              <div class="space-y-1.5">
                <div class="h-3.5 bg-slate-700/60 rounded-lg w-40"></div>
                <div class="h-2.5 bg-slate-800/60 rounded-lg w-64"></div>
              </div>
              <div class="w-11 h-6 bg-slate-700/60 rounded-full"></div>
            </div>
          </ng-container>

          <!-- Toggle List -->
          <div *ngIf="!loading()" class="space-y-1">

            <!-- Email Alerts Notification Preference Card -->
            <app-notification-preferences class="block pb-2"></app-notification-preferences>

            <!-- Weekly Uptime Report Toggle -->
            <div class="flex items-center justify-between py-4 border-b border-slate-800/40">
              <div class="flex items-start gap-3">
                <div [class]="weeklyIconBoxClass()">
                  <i [class]="weeklyIconClass()"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">Weekly Uptime Report</p>
                  <p class="text-xs text-slate-500 mt-0.5 leading-relaxed max-w-sm">
                    Get a weekly summary of all your monitors' uptime percentages and
                    incident history every Monday morning.
                  </p>
                </div>
              </div>
              <button type="button"
                id="toggle-weekly-report"
                (click)="toggle('weeklyReport')"
                [class]="weeklyToggleClass()"
                [attr.aria-checked]="notifForm.get('weeklyReport')?.value"
                role="switch">
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
                  [class.translate-x-5]="notifForm.get('weeklyReport')?.value"
                  [class.translate-x-0]="!notifForm.get('weeklyReport')?.value">
                </span>
              </button>
            </div>

            <!-- Timezone Dropdown -->
            <div class="py-4">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i class="fa-solid fa-globe text-slate-400 text-sm"></i>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-white mb-0.5">Timezone</p>
                  <p class="text-xs text-slate-500 mb-3 leading-relaxed">
                    All alert timestamps and weekly reports are displayed in your selected timezone.
                  </p>
                  <div class="relative">
                    <select id="timezone-select"
                      formControlName="timezone"
                      class="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 appearance-none cursor-pointer">
                      <option *ngFor="let tz of timezones" [value]="tz.value">{{ tz.label }}</option>
                    </select>
                    <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                      <i class="fa-solid fa-chevron-down text-xs"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Info Banner -->
          <div class="flex items-start gap-3 bg-blue-950/30 border border-blue-800/30 rounded-xl px-4 py-3">
            <i class="fa-solid fa-circle-info text-blue-400 text-sm flex-shrink-0 mt-0.5"></i>
            <p class="text-xs text-slate-400 leading-relaxed">
              Notification settings take effect immediately. Email alerts are sent to your registered
              email address. Make sure it is verified to ensure delivery.
            </p>
          </div>

          <!-- Save Button Row -->
          <div class="flex items-center justify-between pt-1">
            <div class="h-5">
              <p *ngIf="saveSuccess()" class="text-xs text-emerald-400 flex items-center gap-1">
                <i class="fa-solid fa-circle-check"></i> Preferences saved!
              </p>
              <p *ngIf="saveError()" class="text-xs text-red-400 flex items-center gap-1">
                <i class="fa-solid fa-circle-exclamation"></i> {{ saveError() }}
              </p>
            </div>
            <button type="submit"
              [disabled]="saving()"
              class="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
              <i *ngIf="saving()" class="fa-solid fa-spinner fa-spin text-xs"></i>
              <i *ngIf="!saving()" class="fa-solid fa-floppy-disk text-xs"></i>
              {{ saving() ? 'Saving...' : 'Save Preferences' }}
            </button>
          </div>

        </form>
      </section>

      <!-- Danger Zone -->
      <section class="rounded-2xl bg-slate-900/80 border border-red-900/30 backdrop-blur-xl overflow-hidden">
        <div class="px-6 py-4 border-b border-red-900/30 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-red-950/60 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-triangle-exclamation text-red-400 text-sm"></i>
          </div>
          <div>
            <h2 class="text-sm font-bold text-red-400">Danger Zone</h2>
            <p class="text-xs text-slate-500">Irreversible and destructive actions</p>
          </div>
        </div>
        <div class="px-6 py-5 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-white">Delete Account</p>
            <p class="text-xs text-slate-500 mt-0.5">Permanently delete your account and all associated data.</p>
          </div>
          <button type="button"
            id="btn-delete-account"
            (click)="openDeleteConfirm()"
            class="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-red-800/60 text-red-400 hover:bg-red-950/50 hover:border-red-700/60 transition-all duration-200">
            <i class="fa-solid fa-trash-can"></i> Delete Account
          </button>
        </div>
      </section>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="showDeleteConfirm()"
           class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
           (click)="closeDeleteConfirm()">
        <div class="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
            <div class="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 flex-shrink-0">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Delete Account?</h3>
              <p class="text-xs text-slate-400 mt-0.5">This cannot be undone.</p>
            </div>
          </div>
          <div class="px-6 py-4">
            <p class="text-sm text-slate-300 leading-relaxed">
              All monitors, alerts, incidents, and account data will be
              <strong class="text-red-400">permanently deleted</strong>.
              Please contact support to proceed with account deletion.
            </p>
          </div>
          <div class="px-6 pb-5 flex items-center gap-3">
            <button (click)="closeDeleteConfirm()"
              class="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/40 transition-all">
              Cancel
            </button>
            <a href="mailto:support@naptor.io?subject=Account Deletion Request"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition-all">
              <i class="fa-solid fa-envelope text-xs"></i> Contact Support
            </a>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div *ngIf="toastMessage()" [class]="toastClass()">
        <i [class]="'fa-solid text-base ' + (toastType() === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-red-400')"></i>
        <span class="text-xs font-semibold text-white">{{ toastMessage() }}</span>
        <button (click)="toastMessage.set(null)" class="text-slate-400 hover:text-white ml-2 text-xs p-1 transition-colors">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

    </div>
  `,
})
export class NotificationsPage implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly settings   = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly timezones = TIMEZONES;

  // ── Signals ────────────────────────────────────────────────────────────────
  readonly loading           = signal(true);
  readonly saving            = signal(false);
  readonly saveSuccess       = signal(false);
  readonly saveError         = signal<string | null>(null);
  readonly showDeleteConfirm = signal(false);
  readonly toastMessage      = signal<string | null>(null);
  readonly toastType         = signal<'success' | 'error'>('success');

  // ── Form ───────────────────────────────────────────────────────────────────
  notifForm!: FormGroup;

  ngOnInit(): void {
    this.notifForm = this.fb.group({
      emailAlerts:  [true],
      weeklyReport: [true],
      timezone:     ['UTC'],
    });

    this.settings.getUserSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const p = res?.user?.preferences || res?.data?.preferences;
          if (p) {
            this.notifForm.patchValue({
              emailAlerts:  p.emailAlerts  ?? true,
              weeklyReport: p.weeklyReport ?? true,
              timezone:     p.timezone     ?? 'UTC',
            });
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggle(field: 'emailAlerts' | 'weeklyReport'): void {
    const ctrl = this.notifForm.get(field);
    ctrl?.setValue(!ctrl.value);
  }

  // ── Dynamic class helpers (no [class.X] with / or : in X) ─────────────────
  emailToggleClass(): string {
    const active = this.notifForm?.get('emailAlerts')?.value;
    return `relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${active ? 'bg-blue-600' : 'bg-slate-700'}`;
  }

  weeklyToggleClass(): string {
    const active = this.notifForm?.get('weeklyReport')?.value;
    return `relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${active ? 'bg-emerald-600' : 'bg-slate-700'}`;
  }

  emailIconBoxClass(): string {
    const active = this.notifForm?.get('emailAlerts')?.value;
    return `w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${active ? 'bg-blue-600/15' : 'bg-slate-800/60'}`;
  }

  emailIconClass(): string {
    const active = this.notifForm?.get('emailAlerts')?.value;
    return `fa-solid fa-envelope text-sm ${active ? 'text-blue-400' : 'text-slate-500'}`;
  }

  weeklyIconBoxClass(): string {
    const active = this.notifForm?.get('weeklyReport')?.value;
    return `w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${active ? 'bg-emerald-600/15' : 'bg-slate-800/60'}`;
  }

  weeklyIconClass(): string {
    const active = this.notifForm?.get('weeklyReport')?.value;
    return `fa-solid fa-chart-bar text-sm ${active ? 'text-emerald-400' : 'text-slate-500'}`;
  }

  toastClass(): string {
    const base = 'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border shadow-2xl shadow-black/80 transition-all duration-300 bg-slate-900/95';
    return this.toastType() === 'success' ? `${base} border-emerald-500/50` : `${base} border-red-500/50`;
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  savePreferences(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);

    this.settings.updateProfile({ preferences: this.notifForm.value })
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          this.showToast('Preferences saved successfully!', 'success');
          setTimeout(() => this.saveSuccess.set(false), 4000);
        },
        error: (err) => {
          const msg = err?.error?.message ?? 'Failed to save preferences. Try again.';
          this.saveError.set(msg);
          this.showToast(msg, 'error');
          setTimeout(() => this.saveError.set(null), 5000);
        },
      });
  }

  openDeleteConfirm():  void { this.showDeleteConfirm.set(true);  }
  closeDeleteConfirm(): void { this.showDeleteConfirm.set(false); }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(null), 4500);
  }
}
