// ─── Settings API Types ──────────────────────────────────────────────────────

export interface UserSettings {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  sendEmail?: boolean;
  profile?: SettingsProfile;
  preferences?: UserPreferences;
  isVerified?: boolean;
  isActive?: boolean;
  [key: string]: any;
}

export interface SettingsProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface UserPreferences {
  emailAlerts: boolean;
  weeklyReport: boolean;
  timezone: string;
  [key: string]: any;
}

export interface UpdateUserSettingsPayload {
  name?: string;
  avatar?: string;
  sendEmail?: boolean;
  preferences?: Partial<UserPreferences>;
  [key: string]: any;
}

/** Backward compatibility alias for UpdateUserSettingsPayload */
export type UpdateProfilePayload = UpdateUserSettingsPayload;

export interface ChangePasswordPayload {
  oldPassword?: string;
  password?: string;
  // Aliases for compatibility
  currentPassword?: string;
  newPassword?: string;
}

export interface SettingsResponse<T = any> {
  status: 'success' | 'error' | 'fail' | string;
  message?: string;
  user?: T;
  data?: T;
}
