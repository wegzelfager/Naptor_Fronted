import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * ForgotPasswordComponent: Requests a password reset link/token via email.
 * Styled with Cyberpunk Obsidian Glassmorphism matching the Naptor Signal design system.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isSubmitting = signal<boolean>(false);
  readonly isSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submittedEmail = signal<string>('');

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailControl() {
    return this.forgotForm.controls.email;
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const email = this.forgotForm.getRawValue().email.trim();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submittedEmail.set(email);
        this.isSuccess.set(true);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const backendMessage =
          err?.error?.message ||
          (err?.error?.errors?.[0]?.message) ||
          'Failed to request password reset. Please check the email address and try again.';
        this.errorMessage.set(backendMessage);
      },
    });
  }

  resetForm(): void {
    this.isSuccess.set(false);
    this.errorMessage.set(null);
    this.forgotForm.reset();
  }
}
