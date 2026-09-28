import { Injectable, inject, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { SettingsService } from './settings.service';
import { User } from '../../auth/models/user.model';
import { UserSettings, UpdateUserSettingsPayload, SettingsResponse } from '../api/settings.api';

/**
 * UserService: Dedicated service for user profile & identity management.
 * Exposes reactive Angular Signals backed by AuthService & SettingsService.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);

  /** Centralized reactive signal for the current user */
  readonly currentUser = this.authService.currentUser;

  /** Signal of the user's display name */
  readonly currentUserName = this.authService.currentUserName;

  /** Initial letter for avatars */
  readonly userInitial = this.authService.userInitial;

  /**
   * Updates user profile using centralized updateUserProfile method
   */
  updateUserProfile(updatedData: Partial<User>): Observable<User> {
    return this.authService.updateUserProfile(updatedData);
  }

  /**
   * Fetches user profile data from GET /api/v1/users/settings
   */
  getUserProfile(): Observable<SettingsResponse<UserSettings>> {
    return this.settingsService.getUserSettings();
  }

  /**
   * Updates the user's name via centralized user profile method
   */
  updateName(name: string): Observable<User> {
    return this.authService.updateUserProfile({ name });
  }

  /**
   * Updates full profile/settings via PUT /api/v1/users/settings
   */
  updateProfile(payload: UpdateUserSettingsPayload): Observable<SettingsResponse<UserSettings>> {
    return this.settingsService.updateUserSettings(payload);
  }

  /**
   * Updates the user's email alerts toggle via PUT /api/v1/users/settings
   */
  updateEmailAlerts(enabled: boolean): Observable<SettingsResponse<UserSettings>> {
    return this.settingsService.updateEmailAlerts(enabled);
  }
}
