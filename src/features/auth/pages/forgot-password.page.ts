import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ForgotPasswordComponent } from '../components/forgot-password.component';

/** ForgotPasswordPage: wraps ForgotPasswordComponent within AuthLayout */
@Component({
  standalone: true,
  selector: 'app-forgot-password-page',
  imports: [ForgotPasswordComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-forgot-password></app-forgot-password>`
})
export class ForgotPasswordPage {}
