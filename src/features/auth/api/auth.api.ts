import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterSuccessResponse {
  status: 'success';
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  status: 'success';
  accessToken: string;
}

export interface RefreshSuccessResponse {
  status: 'success';
  accessToken: string;
}

export interface ApiErrorResponse {
  status: 'fail' | 'error';
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

@Injectable({ providedIn: 'root' })
export class AuthAPI {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /** GET /health - Server health check */
  getHealth(): Observable<string> {
    return this.http.get(`${this.baseUrl}/health`, { responseType: 'text' });
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
    );
  }

  /** POST /api/auth/refresh - Refresh Access Token via body payload */
  refreshToken(refreshToken: string): Observable<RefreshSuccessResponse> {
    return this.http.post<RefreshSuccessResponse>(
      `${this.baseUrl}/api/auth/refresh`,
      { refreshToken }
    );
  }

  /** GET /api/auth/verify-email/:token - Verify user email with token from path */
  verifyEmail(token: string): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(
      `${this.baseUrl}/api/auth/verify-email/${encodeURIComponent(token.trim())}`
    );
  }

  /** POST /api/auth/reset-password - Request password reset token */
  requestPasswordReset(email: string): Observable<{ status?: string; message: string; success?: boolean }> {
    return this.http.post<{ status?: string; message: string; success?: boolean }>(
      `${this.baseUrl}/api/auth/reset-password`,
      { email }
    );
  }

  /** POST /api/auth/reset-new-password - Submit new password with reset token */
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
}
