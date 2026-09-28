import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/store/app.state';
import { authActions } from '../../auth/store/auth.actions';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import {
  UserSettings,
  UpdateUserSettingsPayload,
  UpdateProfilePayload,
  ChangePasswordPayload,
  SettingsResponse,
} from '../api/settings.api';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly store = inject<Store<AppState>>(Store);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = environment.apiUrl;
  // Backend mounts userRouter at /api/v1/users
  private readonly usersEndpoint = `${this.baseUrl}/api/v1/users`;

  // Reactive state signals for real-time component consumption
  readonly currentUser = signal<UserSettings | null>(null);
  readonly currentUserName = signal<string>('');

  /**
   * GET /api/v1/users/settings
   * Fetches the current user's profile and settings.
   */
  getUserSettings(): Observable<SettingsResponse<UserSettings>> {
    return this.http.get<SettingsResponse<UserSettings>>(
      `${this.usersEndpoint}/settings`
    ).pipe(
      tap((res) => {
        const u = res?.user || res?.data;
        if (u) {
          this.currentUser.set(u);
          if (u.name) {
            this.currentUserName.set(u.name);
          }
          this.authService.setCurrentUser(u);
        }
      })
    );
  }

  /**
   * Alias for getUserSettings
   */
  getSettings(): Observable<SettingsResponse<UserSettings>> {
    return this.getUserSettings();
  }

  /**
   * PUT /api/v1/users/settings
   * Updates only the user's name.
   */
  updateName(name: string): Observable<SettingsResponse<UserSettings>> {
    return this.updateUserSettings({ name });
  }

  /**
   * PUT /api/v1/users/settings
   * Updates the email alerts notification preference.
   */
  updateEmailAlerts(enabled: boolean): Observable<SettingsResponse<UserSettings>> {
    return this.updateUserSettings({
      sendEmail: enabled,
      preferences: { emailAlerts: enabled },
    });
  }

  /**
   * PUT /api/v1/users/settings
   * Updates user settings (name, avatar, preferences, etc.).
   */
  updateUserSettings(payload: UpdateUserSettingsPayload): Observable<SettingsResponse<UserSettings>> {
    return this.http.put<SettingsResponse<UserSettings>>(
      `${this.usersEndpoint}/settings`,
      payload
    ).pipe(
      tap((res) => {
        const u = res?.user || res?.data;
        const newName = u?.name || payload.name;
        if (newName) {
          this.currentUserName.set(newName);
        }
        if (u) {
          this.currentUser.set(u);
        }
        const updated = { ...(u || {}), ...(payload || {}), ...(newName ? { name: newName } : {}) };
        this.authService.setCurrentUser(updated);
      })
    );
  }

  /**
   * Alias for updateUserSettings for backward compatibility
   */
  updateProfile(payload: UpdateProfilePayload): Observable<SettingsResponse<UserSettings>> {
    return this.updateUserSettings(payload);
  }

  /**
   * PUT /api/v1/users/change-password
   * Changes the user's password.
   */
  changePassword(payload: ChangePasswordPayload): Observable<SettingsResponse> {
    const body = {
      oldPassword: payload.oldPassword ?? payload.currentPassword,
      password: payload.password ?? payload.newPassword,
    };
    return this.http.put<SettingsResponse>(
      `${this.usersEndpoint}/change-password`,
      body
    );
  }
}
