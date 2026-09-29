import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPage } from './pages/login.page';
import { RegisterPage } from './pages/register.page';
import { VerifyEmailPage } from './pages/verify-email.page';
import { VerifyEmailPendingPage } from './pages/verify-email-pending.page';
import { ForgotPasswordPage } from './pages/forgot-password.page';
import { ResetNewPasswordPage } from './pages/reset-new-password.page';
import { guestGuard } from './guards/guest.guard';

const routes: Routes = [
  { path: 'login',                component: LoginPage,               canActivate: [guestGuard] },
  { path: 'register',             component: RegisterPage,            canActivate: [guestGuard] },
  { path: 'forgot-password',      component: ForgotPasswordPage,      canActivate: [guestGuard] },
  { path: 'reset-new-password',   component: ResetNewPasswordPage,    canActivate: [guestGuard] },
  { path: 'reset-password',       component: ResetNewPasswordPage,    canActivate: [guestGuard] },
  { path: 'verify-email/:token',         component: VerifyEmailPage },
  { path: 'verify-email-pending', component: VerifyEmailPendingPage },
  { path: '',                     redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}
