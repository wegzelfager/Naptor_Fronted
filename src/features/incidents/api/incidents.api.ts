import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IncidentsResponse, UptimeResponse } from '../../../types/incident.types';

@Injectable({ providedIn: 'root' })
export class IncidentsAPI {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * GET /api/v1/incidents - List all incidents for the current authenticated user.
   */
  getIncidents(page: number = 1, limit: number = 20): Observable<IncidentsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<IncidentsResponse>(`${this.baseUrl}/api/v1/incidents`, { params })
      .pipe(
        catchError(error => {
          console.error('[IncidentsAPI] Failed to fetch incidents:', error);
          return of({
            success: false,
            data: [],
            pagination: { total: 0, page: 1, pages: 1 },
            message: error?.error?.message || error.message || 'Failed to load incidents'
          });
        })
      );
  }

  /**
   * GET /api/v1/monitors/:monitorId/incidents - List incidents for a specific monitor.
   */
  getIncidentsByMonitor(
    monitorId: string,
    page: number = 1,
    limit: number = 10
  ): Observable<IncidentsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<IncidentsResponse>(`${this.baseUrl}/api/v1/monitors/${encodeURIComponent(monitorId)}/incidents`, { params })
      .pipe(
        catchError(error => {
          console.error(`[IncidentsAPI] Failed to fetch incidents for monitor ${monitorId}:`, error);
          return of({
            success: false,
            data: [],
            pagination: { total: 0, page: 1, pages: 1 },
            message: error?.error?.message || error.message || 'Failed to load monitor incidents'
          });
        })
      );
  }

  /**
   * GET /api/v1/monitors/:monitorId/uptime - Fetch uptime percentages (24h, 7d, 30d).
   */
  getUptimeStats(monitorId: string): Observable<UptimeResponse | null> {
    return this.http
      .get<UptimeResponse>(`${this.baseUrl}/api/v1/monitors/${encodeURIComponent(monitorId)}/uptime`)
      .pipe(
        catchError(error => {
          console.error(`[IncidentsAPI] Failed to fetch uptime stats for monitor ${monitorId}:`, error);
          return of(null);
        })
      );
  }
}

export { IncidentsAPI as IncidentService };
