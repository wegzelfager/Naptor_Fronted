import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { SettingsService } from '../services/settings.service';

/**
 * NotificationPreferencesComponent
 * Displays the "Email Alerts" preference notification card UI matching the Obsidian Glassmorphism theme.
 * Connects directly to the backend settings API with instant snappy updates & optimistic rollback.
 */
@Component({
  standalone: true,
  selector: 'app-notification-preferences',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <!-- ═══════════════ Email Alerts Preference Card ═══════════════ -->
      <div
        class="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition-all duration-200 shadow-lg shadow-black/20">

        <!-- Left: Icon Box + Descriptions -->
        <div class="flex items-center gap-3.5 min-w-0">
          <!-- Icon Wrapper: Electric Blue Mail SVG Icon -->
          <div
            class="w-10 h-10 rounded-lg bg-blue-950/50 border border-blue-800/30 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-sm">
            <svg
              class="w-5 h-5 text-[#3B82F6]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <!-- Text Section -->
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-white tracking-wide">
              Email Alerts
            </h4>
            <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Receive immediate email notifications when a monitor goes
              <span class="text-red-400 font-semibold">DOWN</span> or recovers
              <span class="text-emerald-400 font-semibold">UP</span>.
            </p>
          </div>
        </div>

        <!-- Right: Animated Smooth Toggle Switch -->
        <div class="flex items-center gap-3 flex-shrink-0 ml-4">
          <!-- Subtle Loading Spinner during network sync -->
          <i
            *ngIf="isUpdating()"
            class="fa-solid fa-spinner fa-spin text-xs text-blue-400"
            title="Saving preference..."></i>

          <button
            type="button"
            role="switch"
            id="email-alerts-toggle"
            [attr.aria-checked]="emailAlerts()"
            (click)="toggleEmailAlerts()"
            [disabled]="isUpdating()"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
            [class.bg-blue-600]="emailAlerts()"
            [class.bg-slate-700]="!emailAlerts()">
            <span class="sr-only">Toggle Email Alerts</span>
            <span
              aria-hidden="true"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out"
              [class.translate-x-5]="emailAlerts()"
              [class.translate-x-0]="!emailAlerts()">
            </span>
          </button>
        </div>

      </div>

      <!-- Toast Feedback Notification -->
      <div
        *ngIf="toastMessage()"
        [class]="toastClass()">
        <i [class]="toastIconClass()"></i>
        <span class="text-xs font-medium text-white flex-1">{{ toastMessage() }}</span>
        <button
          type="button"
          (click)="toastMessage.set(null)"
          class="text-slate-400 hover:text-white transition-colors ml-1 p-0.5">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.15s ease-out forwards;
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State Signals ────────────────────────────────────────────────────────
  readonly emailAlerts = signal<boolean>(true);
  readonly isUpdating = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error'>('success');

  ngOnInit(): void {
    // Pre-fill toggle state from user preferences / profile
    this.settingsService
      .getUserSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const user = res?.user || res?.data;
          // Check backend sendEmail flag and preferences.emailAlerts
          const enabled =
            user?.sendEmail !== undefined
              ? user.sendEmail
              : user?.preferences?.emailAlerts !== undefined
              ? user.preferences.emailAlerts
              : true;
          this.emailAlerts.set(enabled);
        },
        error: () => {
          // Defaults to true if settings fetch fails
          this.emailAlerts.set(true);
        },
      });
  }

  toggleEmailAlerts(): void {
    if (this.isUpdating()) return;

    const previousState = this.emailAlerts();
    const newState = !previousState;

    // 1. Instantly update local signal for snappy UI response
    this.emailAlerts.set(newState);
    this.isUpdating.set(true);
    this.toastMessage.set(null);

    // 2. Call backend API to persist preference
    this.settingsService
      .updateEmailAlerts(newState)
      .pipe(
        finalize(() => this.isUpdating.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.showToast(
            `Email alerts ${newState ? 'enabled' : 'disabled'} successfully!`,
            'success'
          );
        },
        error: (err) => {
          // 3. Rollback state gracefully on failure
          this.emailAlerts.set(previousState);
          const errorMsg =
            err?.error?.message ||
            'Failed to update email alert preferences. Please try again.';
          this.showToast(errorMsg, 'error');
        },
      });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  toastClass(): string {
    const base = 'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950/90 border backdrop-blur-md shadow-lg animate-fadeIn';
    return this.toastType() === 'success'
      ? `${base} border-emerald-500/40`
      : `${base} border-red-500/40`;
  }

  toastIconClass(): string {
    return this.toastType() === 'success'
      ? 'fa-solid fa-circle-check text-emerald-400 text-xs'
      : 'fa-solid fa-circle-exclamation text-red-400 text-xs';
  }
}
