import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Custom validator ensuring newPassword and confirmPassword match.
 * Sets the 'passwordMismatch' error on both the form group and confirmPassword control.
 */
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!newPassword || !confirmPassword) {
    return null;
  }

  // Preserve existing validators (e.g. required)
  if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
    return null;
  }

  if (newPassword.value && confirmPassword.value && newPassword.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    if (confirmPassword.hasError('passwordMismatch')) {
      const remainingErrors = { ...confirmPassword.errors };
      delete remainingErrors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }
    return null;
  }
};

/**
 * ResetNewPasswordComponent: Consumes reset token and submits the new password.
 * Styled with Cyberpunk Obsidian Glassmorphism matching the Naptor Signal design system.
 */
@Component({
  selector: 'app-reset-new-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-new-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetNewPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly token = signal<string>('');
  readonly tokenMissing = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly isSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly showToast = signal<boolean>(false);
  readonly redirectSeconds = signal<number>(2);

  readonly resetForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] }
  );

  get newPasswordControl() {
    return this.resetForm.controls.newPassword;
  }

  get confirmPasswordControl() {
    return this.resetForm.controls.confirmPassword;
  }

  ngOnInit(): void {
    // Extract token from query params ?token=xxx (with fallback to path parameter)
    this.route.queryParamMap.subscribe((params) => {
      const qToken = params.get('token') || this.route.snapshot.paramMap.get('token');
      if (qToken && qToken.trim().length > 0) {
        this.token.set(qToken.trim());
        this.tokenMissing.set(false);
      } else {
        this.tokenMissing.set(true);
      }
    });
  }

  toggleShowPassword(): void {
    this.showPassword.update((prev) => !prev);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((prev) => !prev);
  }

  /** Calculates password security strength score from 0 to 4 */
  get passwordStrengthScore(): number {
    const val = this.newPasswordControl.value || '';
    if (!val) return 0;
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return score;
  }

  get passwordStrengthLabel(): string {
    const score = this.passwordStrengthScore;
    if (score === 0) return '';
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong & Secure';
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { newPassword } = this.resetForm.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService
      .confirmNewPassword({
        token: this.token(),
        newPassword: newPassword.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isSuccess.set(true);
          this.showToast.set(true);

          // 2-second countdown before redirecting to /login
          let remaining = 2;
          this.redirectSeconds.set(remaining);
          const interval = setInterval(() => {
            remaining--;
            this.redirectSeconds.set(remaining);
            if (remaining <= 0) {
              clearInterval(interval);
              this.router.navigate(['/login']);
            }
          }, 1000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const backendMessage =
            err?.error?.message ||
            (err?.error?.errors?.[0]?.message) ||
            'Password reset failed. The token may be invalid, expired, or previously used.';
          this.errorMessage.set(backendMessage);
        },
      });
  }
}
