import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/** AuthLayout: Stunning dark-themed wrapper for login & register pages */
@Component({
  standalone: true,
  selector: 'app-auth-layout',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen bg-slate-950 flex flex-col justify-between overflow-hidden">
      <!-- Background Ambient Glows -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div class="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- Header Logo Bar -->
      <header class="relative z-10 p-6 md:p-8 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <i class="fa-solid fa-wave-square text-white text-lg"></i>
          </div>
          <span class="text-xl font-extrabold tracking-tight text-white">Naptor <span class="text-blue-500">Signal</span></span>
        </div>
        <div class="flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-full backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>All Systems Operational</span>
        </div>
      </header>

      <!-- Main Card Container -->
      <main class="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer Bar -->
      <footer class="relative z-10 p-6 text-center text-xs text-slate-500">
        &copy; 2026 Naptor Signal Inc. Enterprise Uptime & Performance Monitoring.
      </footer>
    </div>
  `
})
export class AuthLayoutComponent {}
