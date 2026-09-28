import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthAPI } from '../api/auth.api';
import { authActions } from './auth.actions';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authApi = inject(AuthAPI);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.login),
      switchMap(({ payload }) =>
        this.authApi.login(payload).pipe(
          map((res) => {
            let storedUser: any = null;
            try {
              const raw = localStorage.getItem('user');
              if (raw) storedUser = JSON.parse(raw);
            } catch {}

            const user = {
              id: storedUser?.id || 'user_1',
              email: payload.email,
              name: (storedUser?.email === payload.email && storedUser?.name) ? storedUser.name : payload.email.split('@')[0],
              role: 'user'
            };
            if (res.accessToken) {
              localStorage.setItem('token', res.accessToken);
              localStorage.setItem('user', JSON.stringify(user));
            }
            this.authService.setCurrentUser(user);
            return authActions.loginSuccess({ user, token: res.accessToken });
          }),
          catchError((err) => {
            const errorMsg =
              err?.error?.message ||
              (err?.error?.errors?.[0]?.message) ||
              'Invalid email or password';
            return of(authActions.loginFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  /** After register success, navigate to the "check your email" page */
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.register),
      switchMap(({ payload }) =>
        this.authApi.register(payload).pipe(
          map(() => authActions.registerSuccess({ email: payload.email })),
          catchError((err) => {
            const errorMsg =
              err?.error?.message ||
              (err?.error?.errors?.[0]?.message) ||
              'Registration failed. Email might already exist.';
            return of(authActions.registerFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  /** Redirect to the pending-verification page after successful registration */
  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.registerSuccess),
        tap(() => { /* register success - component reacts via store selector */ })
      ),
    { dispatch: false }
  );

  /** Call the backend verify-email endpoint */
  verifyEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.verifyEmail),
      switchMap(({ token }) =>
        this.authApi.verifyEmail(token).pipe(
          map(() => authActions.verifyEmailSuccess()),
          catchError((err) => {
            const errorMsg =
              err?.error?.message ||
              'Email verification failed. The link may have expired.';
            return of(authActions.verifyEmailFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.logout),
        tap(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.authService.setCurrentUser(null);
        })
      ),
    { dispatch: false }
  );
}
