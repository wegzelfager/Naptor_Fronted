import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RegisterFormComponent } from '../components/register-form.component';

/** RegisterPage: composes AuthLayout + RegisterForm. */
@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [RegisterFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-register-form></app-register-form>`
})
export class RegisterPage {}
