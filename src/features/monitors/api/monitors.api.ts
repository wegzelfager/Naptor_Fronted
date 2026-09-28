import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type MonitorType = 'WEBSITE' | 'API';
export type MonitorStatus = 'PAUSED' | 'PENDING' | 'UP' | 'DOWN';

export interface CreateMonitorRequest {
  name: string;
  url: string;
  type?: MonitorType;
  interval?: number;
  timeout?: number;
}

export interface MonitorItem {
  _id: string;
  userId: string;
  name: string;
  url: string;
  type: MonitorType;
  interval: number;
  timeout: number;
  status: MonitorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonitorResponse {
  status: 'success';
  message: string;
  monitor: MonitorItem;
}

export interface UpdateMonitorStatusRequest {
  status: MonitorStatus;
}

export interface UpdateMonitorStatusResponse {
  success: boolean;
  message: string;
  data: MonitorItem;
}

export interface UpdateMonitorRequest {
  status: 'UP' | 'DOWN' | MonitorStatus;
  name?: string;
  url?: string;
  type?: 'WEBSITE' | 'API' | MonitorType | string;
  port?: number;
  interval?: number;
  timeout?: number;
}

export interface UpdateMonitorResponse {
  status?: string;
  success?: boolean;
  message?: string;
  monitor?: MonitorItem;
  data?: MonitorItem;
}

// Normalised list wrapper — adapts whatever shape the server returns
export interface GetMonitorsResponse {
  monitors: MonitorItem[];
}

@Injectable({ providedIn: 'root' })
export class MonitorsAPI {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * GET /api/monitors — List all monitors for the authenticated user.
   * Backend: monitorRouter.get('/')
   */
  getMonitors(): Observable<GetMonitorsResponse> {
    return this.http
      .get<any>(`${this.baseUrl}/api/monitors`)
      .pipe(
        catchError(() => of({ monitors: [] }))
      );
  }

  /**
   * GET /api/monitors/:id — Fetch one monitor.
   * Backend: monitorRouter.get('/:id')
   */
  getMonitorById(id: string): Observable<MonitorItem | null> {
    return this.http
      .get<any>(`${this.baseUrl}/api/monitors/${id}`)
      .pipe(catchError(() => of(null)));
  }

  /** POST /api/monitors/monitors — Create a new uptime monitor */
  createMonitor(payload: CreateMonitorRequest): Observable<CreateMonitorResponse> {
    return this.http.post<CreateMonitorResponse>(
      `${this.baseUrl}/api/monitors/monitors`,
      payload
    );
  }

  /**
   * PATCH /api/monitors/:id/status — Update monitor operational status.
   * Documented: api_documentation.md § B. Update Monitor Status
   */
  updateMonitorStatus(id: string, status: MonitorStatus): Observable<UpdateMonitorStatusResponse> {
    return this.http.patch<UpdateMonitorStatusResponse>(
      `${this.baseUrl}/api/monitors/${id}/status`,
      { status }
    );
  }

  /**
   * PATCH /api/monitors/:id/global-status
   * Full monitor update: name, url, type, interval, timeout + required status.
   * Matches backend: monitorRouter.patch('/:id/global-status', validate(globalUpdateMonitorStatusSchema), ...)
   */
  updateMonitor(id: string, payload: UpdateMonitorRequest): Observable<UpdateMonitorResponse> {
    return this.http.patch<UpdateMonitorResponse>(
      `${this.baseUrl}/api/monitors/${id}/global-status`,
      payload
    );
  }

  /**
   * DELETE /api/monitors/:id -- Delete a monitor by ID for the authenticated user.
   */
  deleteMonitor(id: string): Observable<{ status: string; message: string; data: MonitorItem }> {
    return this.http.delete<{ status: string; message: string; data: MonitorItem }>(
      `${this.baseUrl}/api/monitors/${id}`
    );
  }

}
