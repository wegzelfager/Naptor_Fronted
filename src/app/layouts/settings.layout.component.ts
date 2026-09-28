import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** SettingsLayout: Nested settings shell with responsive left-side tab navigation */
@Component({
  standalone: true,
  selector: 'app-settings-layout',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 sm:p-6 lg:p-8">
      <!-- Page Title -->
      <div class="mb-4 sm:mb-6">
        <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Settings</h1>
        <p class="text-sm text-slate-400 mt-0.5">Manage your account, security, and notification preferences</p>
      </div>

      <!-- Mobile Tab Bar (visible on small screens) -->
      <div class="flex lg:hidden items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        <a routerLink="/settings/profile"
           routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/30"
           [routerLinkActiveOptions]="{ exact: true }"
           id="mobile-settings-tab-profile"
           class="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 text-xs font-semibold">
          <i class="fa-solid fa-user-pen text-xs"></i>
          <span>Profile</span>
        </a>
        <a routerLink="/settings/profile"
           id="mobile-settings-tab-security"
           class="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 text-xs font-semibold">
          <i class="fa-solid fa-shield-halved text-xs"></i>
          <span>Security</span>
        </a>
        <a routerLink="/settings/notifications"
           routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/30"
           id="mobile-settings-tab-notifications"
           class="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 text-xs font-semibold">
          <i class="fa-solid fa-bell text-xs"></i>
          <span>Notifications</span>
        </a>
      </div>

      <div class="flex gap-4 lg:gap-6 items-start">

        <!-- ─── Left Tab Navigation (Desktop only) ──────────────────────── -->
        <aside class="hidden lg:block w-56 flex-shrink-0 sticky top-6">
          <nav class="bg-slate-900/80 border border-slate-800/60 rounded-2xl backdrop-blur-xl overflow-hidden">
            <div class="px-3 py-3 space-y-1">

              <!-- Profile Tab -->
              <a routerLink="/settings/profile"
                 routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/30"
                 [routerLinkActiveOptions]="{ exact: true }"
                 id="settings-tab-profile"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
                <div class="w-7 h-7 rounded-lg bg-slate-800/60 group-hover:bg-blue-600/15 flex items-center justify-center flex-shrink-0 transition-colors">
                  <i class="fa-solid fa-user-pen text-xs group-hover:text-blue-400 transition-colors"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold">Profile</p>
                  <p class="text-[10px] text-slate-600 truncate">Name &amp; avatar</p>
                </div>
              </a>

              <!-- Security Tab -->
              <a routerLink="/settings/profile"
                 id="settings-tab-security"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
                <div class="w-7 h-7 rounded-lg bg-slate-800/60 group-hover:bg-amber-600/15 flex items-center justify-center flex-shrink-0 transition-colors">
                  <i class="fa-solid fa-shield-halved text-xs group-hover:text-amber-400 transition-colors"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold">Security</p>
                  <p class="text-[10px] text-slate-600 truncate">Password</p>
                </div>
              </a>

              <div class="border-t border-slate-800/60 my-1"></div>

              <!-- Notifications Tab -->
              <a routerLink="/settings/notifications"
                 routerLinkActive="bg-blue-600/15 text-blue-400 border-blue-500/30"
                 id="settings-tab-notifications"
                 class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all duration-150 group">
                <div class="w-7 h-7 rounded-lg bg-slate-800/60 group-hover:bg-violet-600/15 flex items-center justify-center flex-shrink-0 transition-colors">
                  <i class="fa-solid fa-bell text-xs group-hover:text-violet-400 transition-colors"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold">Notifications</p>
                  <p class="text-[10px] text-slate-600 truncate">Alerts &amp; timezone</p>
                </div>
              </a>

            </div>

            <!-- Version Footer -->
            <div class="px-4 py-3 border-t border-slate-800/40">
              <p class="text-[10px] text-slate-600 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Naptor Signal v2.0
              </p>
            </div>
          </nav>
        </aside>

        <!-- ─── Right Content Area ─────────────────────────────────────── -->
        <div class="flex-1 min-w-0">
          <router-outlet></router-outlet>
        </div>

      </div>
    </div>
  `
})
export class SettingsLayoutComponent {}
