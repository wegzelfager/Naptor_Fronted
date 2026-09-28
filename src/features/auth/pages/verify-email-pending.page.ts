import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/store/app.state';
import { selectRegisteredEmail } from '../store/auth.selectors';

@Component({
  standalone: true,
  selector: 'app-verify-email-pending-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="w-full max-w-md p-8 md:p-10 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6 text-center">
      <!-- Icon -->
      <div class="flex justify-center">
        <div class="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
          <i class="fa-solid fa-envelope-circle-check text-4xl text-indigo-400"></i>
        </div>
      </div>

      <!-- Title -->
      <div class="space-y-2">
        <h2 class="text-2xl font-extrabold tracking-tight text-white">Check your inbox</h2>
        <p class="text-slate-400 text-sm leading-relaxed">
          We've sent a verification link to
          <span class="text-indigo-400 font-semibold">{{ email() ?? 'your email address' }}</span>.
          Click the link in the email to activate your account.
        </p>
      </div>

      <!-- Info box -->
      <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-left space-y-2">
        <p class="text-xs text-slate-400 flex items-start gap-2">
          <i class="fa-solid fa-circle-info text-indigo-400 mt-0.5 shrink-0"></i>
          The link expires in <span class="text-white font-medium">24 hours</span>.
        </p>
        <p class="text-xs text-slate-400 flex items-start gap-2">
          <i class="fa-solid fa-triangle-exclamation text-yellow-400 mt-0.5 shrink-0"></i>
          If you don't see it, check your spam folder.
        </p>
      </div>

      <!-- Back to login -->
      <div class="pt-2 border-t border-slate-800/60">
        <p class="text-sm text-slate-400">
          Already verified?
          <a routerLink="/login" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors ml-1">Sign in</a>
        </p>
      </div>
    </div>
  `
})
export class VerifyEmailPendingPage {
  private readonly store = inject<Store<AppState>>(Store);
  email = this.store.selectSignal(selectRegisteredEmail);
}
