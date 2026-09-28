import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginFormComponent } from '../components/login-form.component';

/** LoginPage: composes AuthLayout + LoginForm. */
@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [LoginFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-login-form></app-login-form>`
})
export class LoginPage {}
