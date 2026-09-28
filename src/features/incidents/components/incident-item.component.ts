import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Incident } from '../../../types/incident.types';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

@Component({
  selector: 'tr[app-incident-item], app-incident-item',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Status -->
    <td class="py-3.5 px-4 whitespace-nowrap">
      <span *ngIf="incident.status === 'OPEN'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/60">
        <span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
        OPEN
      </span>
      <span *ngIf="incident.status === 'RESOLVED'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        RESOLVED
      </span>
    </td>

    <!-- Monitor Info -->
    <td class="py-3.5 px-4">
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <a *ngIf="getMonitorId(); else textOnly"
             [routerLink]="['/monitors', getMonitorId()]"
             class="text-sm font-semibold text-white hover:text-blue-400 transition-colors">
            {{ getMonitorName() }}
          </a>
          <ng-template #textOnly>
            <span class="text-sm font-semibold text-white">{{ getMonitorName() }}</span>
          </ng-template>

          <span *ngIf="getMonitorType()"
                class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
            {{ getMonitorType() }}
          </span>
        </div>

        <a *ngIf="getMonitorUrl()"
           [href]="getMonitorUrl()"
           target="_blank"
           rel="noopener noreferrer"
           class="text-xs text-slate-500 hover:text-slate-400 truncate max-w-xs font-mono mt-0.5 flex items-center gap-1">
          <span>{{ getMonitorUrl() }}</span>
          <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
        </a>
      </div>
    </td>

    <!-- Cause / Error -->
    <td class="py-3.5 px-4">
      <div class="text-xs text-slate-300 font-medium max-w-sm break-words bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
        {{ incident.cause || 'Service Unavailable / Request Timeout' }}
      </div>
    </td>

    <!-- Started At -->
    <td class="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400 font-mono">
      {{ incident.startedAt | date:'medium' }}
    </td>

    <!-- Resolved At -->
    <td class="py-3.5 px-4 whitespace-nowrap text-xs font-mono">
      <span *ngIf="incident.resolvedAt; else ongoingBadge" class="text-slate-400">
        {{ incident.resolvedAt | date:'medium' }}
      </span>
      <ng-template #ongoingBadge>
        <span class="text-red-400 font-semibold flex items-center gap-1">
          <i class="fa-solid fa-spinner fa-spin text-[10px]"></i>
          Ongoing
        </span>
      </ng-template>
    </td>

    <!-- Duration -->
    <td class="py-3.5 px-4 whitespace-nowrap text-xs">
      <span *ngIf="incident.status === 'RESOLVED'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50 font-mono">
        <i class="fa-regular fa-clock text-[10px] text-slate-400"></i>
        {{ incident.duration | duration }}
      </span>
      <span *ngIf="incident.status === 'OPEN'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/40 text-red-300 border border-red-800/40 font-mono">
        <i class="fa-solid fa-triangle-exclamation text-[10px] text-red-400"></i>
        Ongoing
      </span>
    </td>
  `
})
export class IncidentItemComponent {
  @Input({ required: true }) incident!: Incident;

  getMonitorName(): string {
    const m = this.incident.monitor;
    if (m && typeof m === 'object' && 'name' in m) {
      return m.name || 'Unnamed Monitor';
    }
    if (typeof m === 'string') {
      return 'Monitor (' + m.slice(-6) + ')';
    }
    return 'Unknown Monitor';
  }

  getMonitorUrl(): string {
    const m = this.incident.monitor;
    if (m && typeof m === 'object' && 'url' in m) {
      return m.url || '';
    }
    return '';
  }

  getMonitorType(): string {
    const m = this.incident.monitor;
    if (m && typeof m === 'object' && 'type' in m) {
      return m.type || '';
    }
    return '';
  }

  getMonitorId(): string {
    const m = this.incident.monitor;
    if (m && typeof m === 'object' && '_id' in m) {
      return m._id;
    }
    if (typeof m === 'string') {
      return m;
    }
    return '';
  }
}
