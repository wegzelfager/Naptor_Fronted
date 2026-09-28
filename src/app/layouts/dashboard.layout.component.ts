import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '../../core/store/app.state';
import { selectCurrentUser } from '../../features/auth/store/auth.selectors';
import { authActions } from '../../features/auth/store/auth.actions';
import { AuthService } from '../../features/auth/services/auth.service';

/** DashboardLayoutComponent: Main app shell with responsive sidebar + topbar */
@Component({
  standalone: true,
  selector: 'app-dashboard-layout',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen bg-slate-950 overflow-hidden">

      <!-- ── MOBILE BACKDROP ──────────────────────────────────────────────── -->
      <div
        *ngIf="sidebarOpen"
        class="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        (click)="closeSidebar()">
      </div>

      <!-- ── SIDEBAR ──────────────────────────────────────────────────────── -->
      <aside
        [class]="sidebarClasses()">

        <!-- Logo -->
        <div class="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-slate-800/60 flex-shrink-0">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <i class="fa-solid fa-wave-square text-white text-base"></i>
            </div>
            <div>
              <span class="text-base font-extrabold tracking-tight text-white">Naptor</span>
              <span class="text-xs text-slate-500 block -mt-0.5 font-medium">Signal v2.0</span>
            </div>
          </div>
          <!-- Mobile close button -->
          <button
            (click)="closeSidebar()"
            class="lg:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 px-3 mb-3">Overview</p>

          <a routerLink="/dashboard" routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/40"
             [routerLinkActiveOptions]="{ exact: true }"
             (click)="closeSidebar()"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
            <i class="fa-solid fa-chart-line w-4 text-center group-hover:text-blue-400 transition-colors"></i>
            <span class="text-sm font-medium">Dashboard</span>
          </a>

          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 px-3 mb-3 mt-5">Monitoring</p>

          <a routerLink="/monitors" routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/40"
             (click)="closeSidebar()"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
            <i class="fa-solid fa-tower-broadcast w-4 text-center group-hover:text-blue-400 transition-colors"></i>
            <span class="text-sm font-medium">Monitors</span>
          </a>

          <a routerLink="/alerts" routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/40"
             (click)="closeSidebar()"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
            <i class="fa-solid fa-bell w-4 text-center group-hover:text-amber-400 transition-colors"></i>
            <span class="text-sm font-medium">Alerts</span>
          </a>

          <a routerLink="/incidents" routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/40"
             (click)="closeSidebar()"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
            <i class="fa-solid fa-triangle-exclamation w-4 text-center group-hover:text-red-400 transition-colors"></i>
            <span class="text-sm font-medium">Incidents</span>
          </a>

          <p class="text-xs font-semibold uppercase tracking-widest text-slate-500 px-3 mb-3 mt-5">Account</p>

          <a routerLink="/settings/profile" routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/40"
             (click)="closeSidebar()"
             class="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
            <i class="fa-solid fa-sliders w-4 text-center group-hover:text-blue-400 transition-colors"></i>
            <span class="text-sm font-medium">Settings</span>
          </a>
        </nav>

        <!-- User Card (Sidebar Profile Widget - Powered by Centralized Reactive Signal) -->
        <div class="px-3 pb-5 flex-shrink-0" *ngIf="currentUser() as user">
          <div class="flex items-center space-x-3 px-3 py-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-bold text-white select-none">{{ userInitial() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">{{ user.name }}</p>
              <p class="text-xs text-slate-500 truncate">{{ user.email }}</p>
            </div>
            <button (click)="onLogout()" class="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0" title="Logout">
              <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      <!-- ── MAIN CONTENT ─────────────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Topbar -->
        <header class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 bg-slate-900/80 border-b border-slate-800/60 backdrop-blur-md">
          <div class="flex items-center gap-2 sm:gap-3">
            <!-- Hamburger menu (mobile only) -->
            <button
              (click)="toggleSidebar()"
              class="lg:hidden w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/40 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95">
              <i class="fa-solid fa-bars text-sm"></i>
            </button>
            <div>
              <h2 class="text-sm font-bold text-white leading-tight">Infrastructure Monitor</h2>
              <p class="text-xs text-slate-500 hidden sm:block">Real-time uptime &amp; performance tracking</p>
            </div>
          </div>

          <div class="flex items-center gap-2 sm:gap-4">
            <!-- Live badge -->
            <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
              <span class="hidden xs:inline">Live</span>
            </div>

            <!-- Topbar User Avatar & Name (Powered by Centralized Reactive Signal) -->
            <div *ngIf="currentUser() as user" class="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800/80">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-500/20 select-none flex-shrink-0">
                {{ userInitial() }}
              </div>
              <div class="hidden md:block text-left">
                <span class="text-xs font-semibold text-slate-200 block truncate max-w-[100px] lg:max-w-[140px]">{{ user.name }}</span>
                <span class="text-[10px] text-slate-500 block truncate max-w-[100px] lg:max-w-[140px] leading-tight">{{ user.email }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-slate-950">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly store = inject<Store<AppState>>(Store);
  private readonly router = inject(Router);

  /** Centralized reactive user signal directly from AuthService */
  readonly currentUser = this.authService.currentUser;
  readonly userInitial = this.authService.userInitial;

  /** Retain user$ observable for backward compatibility with components expecting stream */
  readonly user$ = this.store.select(selectCurrentUser);

  sidebarOpen = false;

  sidebarClasses(): string {
    const base = 'fixed lg:relative inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col bg-slate-900/95 border-r border-slate-800/60 backdrop-blur-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ';
    return base + (this.sidebarOpen ? 'translate-x-0' : '-translate-x-full');
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
