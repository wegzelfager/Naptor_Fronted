import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeartbeatItem } from '../api/heartbeats.api';

@Component({
  standalone: true,
  selector: 'app-heartbeat-dot-strip',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2">
      <!-- Dot Strip Bars -->
      <div class="flex items-center space-x-1 h-8 px-1 overflow-x-auto">
        <div
          *ngFor="let hb of heartbeats; let i = index"
          [title]="getTooltip(hb)"
          [class]="'h-6 flex-1 min-w-[6px] rounded-sm transition-all duration-200 cursor-pointer hover:scale-y-125 hover:z-10 ' +
            (hb.status === 'UP' ? 'bg-emerald-500 hover:bg-emerald-400 shadow-sm shadow-emerald-500/20' :
             hb.status === 'DOWN' ? 'bg-red-500 hover:bg-red-400 shadow-sm shadow-red-500/20' :
             'bg-slate-700 hover:bg-slate-600')">
        </div>
      </div>

      <!-- Footer Labels -->
      <div class="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>50 checks ago</span>
        <span class="text-emerald-400 font-semibold">{{ calculateUptime() }}% uptime</span>
        <span>Just now</span>
      </div>
    </div>
  `
})
export class HeartbeatDotStripComponent {
  @Input() heartbeats: HeartbeatItem[] = [];

  getTooltip(hb: HeartbeatItem): string {
    const time = new Date(hb.createdAt).toLocaleTimeString();
    if (hb.status === 'UP') {
      return `[${time}] Status: 200 OK | Response: ${hb.responseTime}ms`;
    }
    return `[${time}] Status: ${hb.statusCode || 'DOWN'} | Error: ${hb.error || 'Connection Failed'}`;
  }

  calculateUptime(): string {
    if (!this.heartbeats.length) return '100';
    const upCount = this.heartbeats.filter(h => h.status === 'UP').length;
    return Math.round((upCount / this.heartbeats.length) * 100).toString();
  }
}
