import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/store/app.state';
import { authActions } from '../store/auth.actions';
import { selectEmailVerified, selectVerifyEmailError, selectIsSubmitting } from '../store/auth.selectors';

@Component({
  standalone: true,
  selector: 'app-verify-email-page',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="w-full max-w-md p-8 md:p-10 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6 text-center">

      <!-- Loading state -->
      <ng-container *ngIf="isSubmitting()">
        <div class="flex justify-center">
          <div class="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <i class="fa-solid fa-spinner animate-spin text-4xl text-indigo-400"></i>
          </div>
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-extrabold tracking-tight text-white">Verifying your email…</h2>
          <p class="text-slate-400 text-sm">Please wait while we activate your account.</p>
        </div>
      </ng-container>

      <!-- Success state -->
      <ng-container *ngIf="!isSubmitting() && verified()">
        <div class="flex justify-center">
          <div class="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <i class="fa-solid fa-circle-check text-4xl text-green-400"></i>
          </div>
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-extrabold tracking-tight text-white">Email Verified!</h2>
          <p class="text-slate-400 text-sm">Your account is now active. You can sign in and start monitoring your services.</p>
        </div>
        <a routerLink="/login"
           class="inline-block w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
          Go to Sign In
        </a>
      </ng-container>

      <!-- Error state -->
      <ng-container *ngIf="!isSubmitting() && !verified() && error()">
        <div class="flex justify-center">
          <div class="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <i class="fa-solid fa-circle-xmark text-4xl text-red-400"></i>
          </div>
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-extrabold tracking-tight text-white">Verification Failed</h2>
          <p class="text-red-400 text-sm">{{ error() }}</p>
        </div>
        <div class="pt-2 border-t border-slate-800/60">
          <p class="text-sm text-slate-400">
            Need a new link?
            <a routerLink="/register" class="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors ml-1">Register again</a>
          </p>
        </div>
      </ng-container>
    </div>
  `
})
export class VerifyEmailPage implements OnInit {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly route = inject(ActivatedRoute);

  isSubmitting = this.store.selectSignal(selectIsSubmitting);
  verified = this.store.selectSignal(selectEmailVerified);
  error = this.store.selectSignal(selectVerifyEmailError);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token') || this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.store.dispatch(authActions.verifyEmail({ token }));
    } else {
      this.store.dispatch(authActions.verifyEmailFailure({ error: 'No verification token found in the link.' }));
    }
  }
}
