import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeartbeatItem } from '../api/heartbeats.api';

@Component({
  standalone: true,
  selector: 'app-heartbeat-chart',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-bold text-white">Response Time Latency</h4>
          <p class="text-xs text-slate-500">Latency distribution over last 50 heartbeats (ms)</p>
        </div>
        <div class="flex items-center space-x-3 text-xs">
          <span class="text-slate-400">Avg: <strong class="text-white">{{ getAvgLatency() }}ms</strong></span>
          <span class="text-slate-400">Max: <strong class="text-white">{{ getMaxLatency() }}ms</strong></span>
        </div>
      </div>

      <!-- Latency Chart Bars -->
      <div class="h-32 flex items-end space-x-1 pt-4 pb-1 border-b border-slate-800/60">
        <div
          *ngFor="let hb of heartbeats"
          [title]="hb.responseTime + 'ms at ' + (hb.createdAt | date:'shortTime')"
          class="flex-1 flex flex-col justify-end group relative h-full">
          <div
            [style.height.%]="getBarHeight(hb.responseTime)"
            [class]="'w-full rounded-t-sm transition-all duration-300 ' +
              (hb.status === 'DOWN' ? 'bg-red-500' :
               hb.responseTime < 200 ? 'bg-emerald-500 group-hover:bg-emerald-400' :
               hb.responseTime < 500 ? 'bg-amber-500 group-hover:bg-amber-400' : 'bg-rose-500')">
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Older</span>
        <div class="flex items-center space-x-3">
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>&lt;200ms</span></span>
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span><span>200-500ms</span></span>
          <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded-full bg-red-500"></span><span>Down</span></span>
        </div>
        <span>Recent</span>
      </div>
    </div>
  `
})
export class HeartbeatChartComponent {
  @Input() heartbeats: HeartbeatItem[] = [];

  getMaxLatency(): number {
    if (!this.heartbeats.length) return 0;
    return Math.max(...this.heartbeats.map(h => h.responseTime || 0));
  }

  getAvgLatency(): number {
    if (!this.heartbeats.length) return 0;
    const valid = this.heartbeats.filter(h => h.status === 'UP');
    if (!valid.length) return 0;
    const sum = valid.reduce((acc, h) => acc + h.responseTime, 0);
    return Math.round(sum / valid.length);
  }

  getBarHeight(responseTime: number): number {
    const max = this.getMaxLatency() || 500;
    const pct = Math.round((responseTime / max) * 100);
    return Math.max(pct, 5);
  }
}
