import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/store/app.state';
import { authActions } from '../store/auth.actions';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { 
  RegisterRequest, 
  RegisterSuccessResponse, 
  LoginRequest, 
  LoginSuccessResponse, 
  RefreshSuccessResponse 
} from '../api/auth.api';

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject<Store<AppState>>(Store);
  private readonly baseUrl = environment.apiUrl;

  /**
   * 1. Centralized reactive User Signal initialized from LocalStorage.
   * Emits whenever the user is updated, logged in, or logged out.
   */
  readonly currentUser = signal<User | null>(this.getUserFromStorage());

  /** Derived signal for display name */
  readonly currentUserName = computed(() => this.currentUser()?.name || 'User');

  /** Derived signal for avatar initial letter */
  readonly userInitial = computed(() => {
    const name = this.currentUser()?.name;
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'U';
  });

  /**
   * Reads stored user data safely from LocalStorage.
   */
  getUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        return JSON.parse(raw);
      }
      const token = localStorage.getItem('token');
      if (token) {
        return { id: 'user_session', email: 'user@naptor.io', name: 'User', role: 'user' };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Sets current user across Reactive Signal, LocalStorage, and NgRx store.
   */
  setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    try {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        this.store.dispatch(authActions.updateUser({ user: user as any }));
      } else {
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('[AuthService] Error persisting user to storage', err);
    }
  }

  /**
   * 2. Update User Profile Method:
   * When updating the user name via API in Settings, updates reactive signal AND syncs localStorage.
   */
  updateUserProfile(updatedData: Partial<User>): Observable<User> {
    const patchUrl = `${this.baseUrl}/api/settings/profile`;
    const putUrl = `${this.baseUrl}/api/v1/users/settings`;

    // Try PATCH /api/settings/profile, with fallback to PUT /api/v1/users/settings
    return this.http.patch<any>(patchUrl, updatedData).pipe(
      catchError(() => this.http.put<any>(putUrl, updatedData)),
      map((res) => {
        const backendUser = res?.user || res?.data || res;
        const current = this.currentUser() || { id: 'user_1', email: '', name: '', role: 'user' };
        const merged: User = {
          ...current,
          ...(typeof backendUser === 'object' && backendUser ? backendUser : {}),
          ...updatedData,
        };
        return merged;
      }),
      tap((updatedUser) => {
        // 1. Update Reactive Signal
        this.currentUser.set(updatedUser);
        // 2. Sync LocalStorage so it persists across page reloads
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // 3. Keep NgRx Store synchronized
        this.store.dispatch(authActions.updateUser({ user: updatedUser as any }));
      })
    );
  }

  /**
   * GET /api/v1/auth/verify-email?token=${token}
   * Verifies a user's email address using the token provided in the verification email.
   */
  verifyEmail(token: string): Observable<{ success: boolean; message: string }> {
    const encodedToken = encodeURIComponent(token.trim());
    const primaryUrl = `${this.baseUrl}/api/v1/auth/verify-email?token=${encodedToken}`;
    const fallbackUrl = `${this.baseUrl}/api/auth/verify-email/${encodedToken}`;

    return this.http.get<{ success: boolean; message: string }>(primaryUrl).pipe(
      catchError((err) => {
        if (err.status === 404) {
          return this.http.get<{ success: boolean; message: string }>(fallbackUrl);
        }
        return throwError(() => err);
      })
    );
  }

  /** POST /api/auth/register - Register a new user */
  register(payload: RegisterRequest): Observable<RegisterSuccessResponse> {
    return this.http.post<RegisterSuccessResponse>(
      `${this.baseUrl}/api/auth/register`,
      payload
    );
  }

  /** POST /api/auth/login - Authenticate user and receive access token */
  login(payload: LoginRequest): Observable<LoginSuccessResponse> {
    return this.http.post<LoginSuccessResponse>(
      `${this.baseUrl}/api/auth/login`,
      payload
    ).pipe(
      tap((res) => {
        if (res.accessToken) {
          const user: User = {
            id: 'user_1',
            email: payload.email,
            name: payload.email.split('@')[0],
            role: 'user'
          };
          this.setCurrentUser(user);
        }
      })
    );
  }

  /** POST /api/auth/refresh - Refresh Access Token via body payload */
  refreshToken(refreshToken: string): Observable<RefreshSuccessResponse> {
    return this.http.post<RefreshSuccessResponse>(
      `${this.baseUrl}/api/auth/refresh`,
      { refreshToken }
    );
  }

  /**
   * POST /api/auth/reset-password
   * Request password reset link/token sent to user email.
   */
  requestPasswordReset(email: string): Observable<{ status?: string; message: string; success?: boolean }> {
    return this.http.post<{ status?: string; message: string; success?: boolean }>(
      `${this.baseUrl}/api/auth/reset-password`,
      { email }
    );
  }

  /**
   * POST /api/auth/reset-new-password
   * Reset password with the verification token and new password.
   */
  confirmNewPassword(payload: { token: string; newPassword: string }): Observable<{ status?: string; message: string; success?: boolean }> {
    return this.http.post<{ status?: string; message: string; success?: boolean }>(
      `${this.baseUrl}/api/auth/reset-new-password`,
      {
        token: payload.token,
        newPassword: payload.newPassword,
        password: payload.newPassword
      }
    );
  }

  /** Clears user session */
  logout(): void {
    this.setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.store.dispatch(authActions.logout());
  }
}
