import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../services/alert.service';
import { AlertLog, AlertStatus, AlertToast } from '../../../types/alert.types';

@Component({
  standalone: true,
  selector: 'app-alerts',
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsComponent implements OnInit, OnDestroy {
  readonly alertService = inject(AlertService);

  // --- Filter and Search State ---
  readonly searchQuery = signal<string>('');
  readonly selectedStatus = signal<'ALL' | AlertStatus>('ALL');

  // --- UI Settings & Notifications ---
  readonly soundEnabled = signal<boolean>(
    localStorage.getItem('naptor_alert_sound') !== 'false'
  );
  readonly toasts = signal<AlertToast[]>([]);

  // Periodic interval to keep relative time ("Just now", "2 mins ago") freshly updated
  private timeTickTimer: ReturnType<typeof setInterval> | null = null;
  readonly nowTick = signal<number>(Date.now());

  // --- Computed Alerts filtered by Search and Status ---
  readonly filteredAlerts = computed(() => {
    const list = this.alertService.alerts();
    const query = this.searchQuery().trim().toLowerCase();
    const statusFilter = this.selectedStatus();

    return list.filter((alert) => {
      // Status filter
      if (statusFilter !== 'ALL' && alert.status.toUpperCase() !== statusFilter) {
        return false;
      }

      // Query filter
      if (query) {
        const nameMatch = alert.monitorName?.toLowerCase().includes(query) ?? false;
        const urlMatch = alert.targetUrl?.toLowerCase().includes(query) ?? false;
        const msgMatch = (alert.message || alert.error || '')
          .toLowerCase()
          .includes(query);
        const codeMatch = alert.statusCode?.toString().includes(query) ?? false;

        return nameMatch || urlMatch || msgMatch || codeMatch;
      }

      return true;
    });
  });

  constructor() {
    // Watch for incoming real-time alerts from SSE to trigger Audio and Toasts
    effect(() => {
      const incoming = this.alertService.latestAlert();
      if (incoming) {
        this.handleRealTimeAlertArrival(incoming);
      }
    });
  }

  ngOnInit(): void {
    // 1. Fetch initial historical notification logs via REST API
    this.alertService.getAlertsHistory().subscribe();

    // 2. Establish live SSE stream to /api/alerts/stream
    this.alertService.connectToAlertStream();

    // 3. Update relative time every 15 seconds
    this.timeTickTimer = setInterval(() => {
      this.nowTick.set(Date.now());
    }, 15000);
  }

  ngOnDestroy(): void {
    // Clean up SSE connection and intervals
    this.alertService.disconnect();
    if (this.timeTickTimer) {
      clearInterval(this.timeTickTimer);
    }
  }

  // --- User Actions ---

  refreshHistory(): void {
    this.alertService.getAlertsHistory().subscribe();
  }

  reconnectStream(): void {
    this.alertService.connectToAlertStream();
  }

  toggleSound(): void {
    const updated = !this.soundEnabled();
    this.soundEnabled.set(updated);
    localStorage.setItem('naptor_alert_sound', String(updated));
    if (updated) {
      this.playChime('RECOVERED'); // Quick sample feedback
    }
  }

  dismissToast(toastId: string): void {
    this.toasts.update((existing) => existing.filter((t) => t.id !== toastId));
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  // --- Real-time Notification Feedback ---

  private handleRealTimeAlertArrival(alert: AlertLog): void {
    // 1. Trigger audio chime
    const normalizedStatus = (alert.status || 'DOWN').toUpperCase() as AlertStatus;
    this.playChime(normalizedStatus);

    // 2. Create subtle floating glassmorphic toast
    const toast: AlertToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      alert,
      timestamp: Date.now(),
    };

    this.toasts.update((current) => [toast, ...current.slice(0, 3)]); // Keep max 4 toasts

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      this.dismissToast(toast.id);
    }, 6000);
  }

  /**
   * Generates a sleek, high-tech notification tone using native Web Audio API.
   * Completely self-contained: no external audio files required!
   */
  private playChime(status: AlertStatus | string): void {
    if (!this.soundEnabled()) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (status === 'DOWN') {
        // Crimson down alert: serious dual-tone descending alert
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.3); // D4
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (status === 'RECOVERED') {
        // Emerald recovered: soothing ascending crystal chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Degraded: mellow pulse tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392.0, now); // G4
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Ignore audio context autoplay blockage
    }
  }

  // --- Formatting Helpers ---

  /**
   * Formats relative time ("Just now", "2 mins ago", "1 hour ago").
   */
  getRelativeTime(dateString: string | Date | undefined): string {
    // Reading nowTick ensures this computes reactively when interval ticks
    this.nowTick();

    if (!dateString) return '—';
    const past = new Date(dateString).getTime();
    if (isNaN(past)) return '—';

    const diffSec = Math.max(0, Math.floor((Date.now() - past) / 1000));

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;

    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Full exact date string for tooltips.
   */
  getFullDate(dateString: string | Date | undefined): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  }

  /**
   * Formats monitor hostname/path cleanly.
   */
  getCleanUrl(url: string | undefined): string {
    if (!url || url === '—') return '—';
    try {
      const parsed = new URL(url);
      return `${parsed.hostname}${parsed.pathname !== '/' ? parsed.pathname : ''}`;
    } catch {
      return url;
    }
  }
}
