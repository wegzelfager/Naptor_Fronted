import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IncidentsAPI } from '../api/incidents.api';
import { Incident, IncidentsPagination } from '../../../types/incident.types';
import { IncidentItemComponent } from '../components/incident-item.component';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';

type FilterTab = 'ALL' | 'OPEN' | 'RESOLVED';

@Component({
  standalone: true,
  selector: 'app-incidents-page',
  imports: [CommonModule, RouterModule, IncidentItemComponent, DurationPipe],
  template: `
    <div class="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <!-- Header with Refresh Button -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <i class="fa-solid fa-triangle-exclamation text-red-500"></i>
            <span>Downtime & Incidents</span>
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            Real-time audit log of monitor outages, causes, and recovery times across your infrastructure.
          </p>
        </div>

        <button
          (click)="loadIncidents()"
          [disabled]="isLoading()"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
          <i class="fa-solid fa-arrows-rotate" [class.fa-spin]="isLoading()"></i>
          <span>{{ isLoading() ? 'Fetching...' : 'Refresh' }}</span>
        </button>
      </div>

      <!-- Quick Metrics Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <!-- Total Incidents -->
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recorded</span>
            <div class="text-2xl font-bold text-white mt-1">{{ totalCount() }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
        </div>

        <!-- Open Incidents -->
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Outages</span>
            <div class="text-2xl font-bold mt-1" [ngClass]="openCount() > 0 ? 'text-red-400' : 'text-slate-300'">
              {{ openCount() }}
            </div>
          </div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               [ngClass]="openCount() > 0 ? 'bg-red-950/60 text-red-400 border border-red-800/60' : 'bg-slate-800 text-slate-400'">
            <i class="fa-solid fa-circle-exclamation" [class.animate-pulse]="openCount() > 0"></i>
          </div>
        </div>

        <!-- Resolved Incidents -->
        <div class="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved</span>
            <div class="text-2xl font-bold text-emerald-400 mt-1">{{ resolvedCount() }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <i class="fa-solid fa-circle-check"></i>
          </div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab.set(tab.id)"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            [ngClass]="activeTab() === tab.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'">
            {{ tab.label }}
            <span class="ml-1 text-[11px] opacity-80">({{ getTabCount(tab.id) }})</span>
          </button>
        </div>

        <span class="text-xs text-slate-500" *ngIf="lastUpdated()">
          Updated {{ lastUpdated() | date:'shortTime' }}
        </span>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage()"
           class="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-xmark text-red-400"></i>
          <span>{{ errorMessage() }}</span>
        </div>
        <button (click)="loadIncidents()" class="underline font-semibold hover:text-white">Retry</button>
      </div>

      <!-- Main Incidents Table -->
      <div class="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-800 bg-slate-800/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Monitor</th>
                <th class="py-3 px-4">Trigger / Error Cause</th>
                <th class="py-3 px-4">Started At</th>
                <th class="py-3 px-4">Resolved At</th>
                <th class="py-3 px-4">Downtime Duration</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading Skeleton -->
              <tr *ngIf="isLoading() && (!incidents() || incidents().length === 0)">
                <td colspan="6" class="p-8 text-center">
                  <div class="flex flex-col items-center justify-center gap-3">
                    <i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500"></i>
                    <span class="text-xs text-slate-400">Loading incidents...</span>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="!isLoading() && filteredIncidents().length === 0">
                <td colspan="6" class="p-12 text-center">
                  <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div class="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center justify-center text-2xl mb-3 shadow-inner">
                      <i class="fa-solid fa-shield-check"></i>
                    </div>
                    <h3 class="text-base font-bold text-white">No Incidents Found</h3>
                    <p class="text-xs text-slate-400 mt-1">
                      <ng-container *ngIf="activeTab() === 'ALL'">
                        None of your monitors have recorded downtime incidents yet. Everything is healthy!
                      </ng-container>
                      <ng-container *ngIf="activeTab() === 'OPEN'">
                        Great news! There are currently no open downtime incidents.
                      </ng-container>
                      <ng-container *ngIf="activeTab() === 'RESOLVED'">
                        No resolved incidents found.
                      </ng-container>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Render rows using IncidentItemComponent -->
              <ng-container *ngFor="let inc of filteredIncidents(); trackBy: trackById">
                <tr app-incident-item [incident]="inc"></tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div *ngIf="pagination() && pagination()!.total > 0"
             class="px-4 py-3 border-t border-slate-800/80 bg-slate-800/30 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
          <div>
            Showing page <strong class="text-white">{{ pagination()!.page }}</strong> of <strong class="text-white">{{ pagination()!.pages }}</strong>
            <span class="ml-1 text-slate-500">({{ pagination()!.total }} total incidents)</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() <= 1 || isLoading()"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <i class="fa-solid fa-chevron-left mr-1 text-[10px]"></i> Prev
            </button>
            <span class="px-2 font-mono font-semibold text-blue-400">{{ currentPage() }}</span>
            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() >= pagination()!.pages || isLoading()"
              class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next <i class="fa-solid fa-chevron-right ml-1 text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class IncidentsPage implements OnInit {
  private readonly incidentsApi = inject(IncidentsAPI);

  readonly incidents = signal<Incident[]>([]);
  readonly pagination = signal<IncidentsPagination | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(20);
  readonly activeTab = signal<FilterTab>('ALL');

  readonly tabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'ALL', label: 'All Incidents' },
    { id: 'OPEN', label: 'Active Outages' },
    { id: 'RESOLVED', label: 'Resolved' }
  ];

  readonly totalCount = computed(() => this.incidents().length);
  readonly openCount = computed(() => this.incidents().filter(i => i.status === 'OPEN').length);
  readonly resolvedCount = computed(() => this.incidents().filter(i => i.status === 'RESOLVED').length);

  readonly filteredIncidents = computed(() => {
    const all = this.incidents();
    const tab = this.activeTab();
    if (tab === 'OPEN') {
      return all.filter(i => i.status === 'OPEN');
    }
    if (tab === 'RESOLVED') {
      return all.filter(i => i.status === 'RESOLVED');
    }
    return all;
  });

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.incidentsApi.getIncidents(this.currentPage(), this.pageSize()).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.lastUpdated.set(new Date());
        if (res.success && Array.isArray(res.data)) {
          this.incidents.set(res.data);
          this.pagination.set(res.pagination || {
            total: res.data.length,
            page: this.currentPage(),
            pages: 1
          });
        } else {
          this.incidents.set([]);
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.message || 'Failed to load incidents from server.');
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagination() && page > this.pagination()!.pages)) return;
    this.currentPage.set(page);
    this.loadIncidents();
  }

  getTabCount(tab: FilterTab): number {
    switch (tab) {
      case 'ALL': return this.totalCount();
      case 'OPEN': return this.openCount();
      case 'RESOLVED': return this.resolvedCount();
    }
  }

  trackById(_index: number, incident: Incident): string {
    return incident._id;
  }
}
