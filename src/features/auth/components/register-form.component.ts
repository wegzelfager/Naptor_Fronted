import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';

import { authActions, RegisterPayload } from '../store/auth.actions';
import { AppState } from '../../../core/store/app.state';
import {
  selectIsSubmitting, selectAuthError,
  selectRegistrationSuccess, selectRegisteredEmail
} from '../store/auth.selectors';

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, RouterLink],
  template: `
    <!-- ═══════════════ POST-REGISTRATION SUCCESS CARD ═══════════════ -->
    <div *ngIf="registrationSuccess()"
         class="w-full max-w-md p-8 md:p-10 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6 text-center animate-fadeIn">

      <!-- Glowing envelope icon -->
      <div class="flex justify-center">
        <div class="relative w-24 h-24 flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse"></div>
          <div class="relative w-20 h-20 rounded-full bg-indigo-500/10 border-2 border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i class="fa-solid fa-envelope-circle-check text-4xl text-indigo-400"></i>
          </div>
        </div>
      </div>

      <!-- Headline -->
      <div class="space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mx-auto">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Account created
        </div>
        <h2 class="text-2xl font-extrabold tracking-tight text-white mt-2">Check your inbox</h2>
        <p class="text-slate-400 text-sm leading-relaxed">
          We've sent a verification link to
          <span class="font-semibold text-indigo-300 break-all">{{ registeredEmail() ?? 'your email address' }}</span>.
          Click it to activate your Naptor Signal account.
        </p>
      </div>

      <!-- Info callout -->
      <div class="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4 text-left space-y-2.5">
        <p class="text-xs text-slate-400 flex items-start gap-2.5">
          <i class="fa-solid fa-clock text-indigo-400 mt-0.5 shrink-0"></i>
          The link expires in <span class="text-white font-medium ml-1">24 hours</span>.
        </p>
        <p class="text-xs text-slate-400 flex items-start gap-2.5">
          <i class="fa-solid fa-triangle-exclamation text-amber-400 mt-0.5 shrink-0"></i>
          Can't find it? Check your <span class="text-white font-medium ml-1">spam or junk folder</span>.
        </p>
      </div>

      <!-- Actions -->
      <div class="space-y-3 pt-1">
        <a routerLink="/login"
           class="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25">
          <i class="fa-solid fa-right-to-bracket"></i>
          Proceed to Login
        </a>
        <button (click)="resetAndRegisterAnother()"
                class="w-full py-2.5 text-sm text-slate-400 hover:text-slate-200 font-medium transition-colors">
          Register with another email
        </button>
      </div>
    </div>

    <!-- ═══════════════ REGISTRATION FORM ═══════════════ -->
    <div *ngIf="!registrationSuccess()"
         class="w-full max-w-md p-8 md:p-10 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6">
      <div class="space-y-2 text-center">
        <h2 class="text-3xl font-extrabold tracking-tight text-white">Create Account</h2>
        <p class="text-sm text-slate-400">Start monitoring your services in real-time</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
          <app-input formControlName="name" placeholder="John Doe"></app-input>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
          <app-input formControlName="email" type="email" placeholder="you@example.com"></app-input>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
          <app-input formControlName="password" type="password" placeholder="••••••••••••"></app-input>
        </div>

        <div *ngIf="error()" class="flex items-center space-x-2 text-sm text-red-400 bg-red-950/40 border border-red-800/60 p-3.5 rounded-xl">
          <i class="fa-solid fa-circle-exclamation text-red-400"></i>
          <span>{{ error() }}</span>
        </div>

        <app-button type="submit" [disabled]="form.invalid || submitting()">
          <i *ngIf="submitting()" class="fa-solid fa-spinner animate-spin mr-2"></i>
          <span>{{ submitting() ? 'Creating account...' : 'Get Started Free' }}</span>
        </app-button>
      </form>

      <div class="pt-4 border-t border-slate-800/80 text-center">
        <p class="text-sm text-slate-400">
          Already have an account?
          <a routerLink="/login" class="font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors ml-1">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterFormComponent {
  private readonly store = inject<Store<AppState>>(Store);
  private readonly fb = inject(NonNullableFormBuilder);

  form = this.fb.group({
    name:     ['', [Validators.required]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submitting         = this.store.selectSignal(selectIsSubmitting);
  error              = this.store.selectSignal(selectAuthError);
  registrationSuccess = this.store.selectSignal(selectRegistrationSuccess);
  registeredEmail    = this.store.selectSignal(selectRegisteredEmail);

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload: RegisterPayload = this.form.getRawValue();
    this.store.dispatch(authActions.register({ payload }));
  }

  resetAndRegisterAnother() {
    this.store.dispatch(authActions.resetRegistrationStatus());
    this.form.reset();
  }
}
