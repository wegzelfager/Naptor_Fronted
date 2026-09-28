import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResetNewPasswordComponent } from '../components/reset-new-password.component';

/** ResetNewPasswordPage: wraps ResetNewPasswordComponent within AuthLayout */
@Component({
  standalone: true,
  selector: 'app-reset-new-password-page',
  imports: [ResetNewPasswordComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-reset-new-password></app-reset-new-password>`
})
export class ResetNewPasswordPage {}
