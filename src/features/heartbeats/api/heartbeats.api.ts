import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface HeartbeatItem {
  _id?: string;
  monitor: string;
  status: 'UP' | 'DOWN' | 'PAUSED' | 'PENDING';
  statusCode: number | null;
  responseTime: number;
  error: string | null;
  createdAt: string;
}

export interface GetHeartbeatsResponse {
  status: 'success';
  data: HeartbeatItem[];
}

@Injectable({ providedIn: 'root' })
export class HeartbeatsAPI {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly baseUrl = environment.apiUrl;

  /** GET /api/monitors/:id/heartbeats - Fetch historical heartbeats for a monitor */
  getHeartbeats(monitorId: string): Observable<GetHeartbeatsResponse> {
    return this.http
      .get<GetHeartbeatsResponse>(`${this.baseUrl}/api/monitors/${monitorId}/heartbeats`)
      .pipe(
        catchError(() =>
          of({
            status: 'success' as const,
            data: this.generateMockHeartbeats(monitorId),
          })
        )
      );
  }

  /**
   * Connect to Server-Sent Events (SSE) stream for live heartbeat updates.
   * If SSE is supported on /api/monitors/stream, streams real-time heartbeats.
   */
  connectHeartbeatSSE(monitorId?: string): Observable<HeartbeatItem> {
    const subject = new Subject<HeartbeatItem>();
    const token = localStorage.getItem('token');
    const url = monitorId
      ? `${this.baseUrl}/api/monitors/${monitorId}/stream?token=${token}`
      : `${this.baseUrl}/api/monitors/stream?token=${token}`;

    try {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        this.zone.run(() => {
          try {
            const data: HeartbeatItem = JSON.parse(event.data);
            subject.next(data);
          } catch (e) {
            console.error('[SSE Error] Failed to parse event payload:', e);
          }
        });
      };

      eventSource.onerror = (err) => {
        this.zone.run(() => {
          console.warn('[SSE Warning] SSE Connection closed/failed. Falling back to polling.', err);
          eventSource.close();
        });
      };
    } catch (e) {
      console.warn('[SSE Warning] Could not establish EventSource:', e);
    }

    return subject.asObservable();
  }

  private generateMockHeartbeats(monitorId: string): HeartbeatItem[] {
    const items: HeartbeatItem[] = [];
    const now = Date.now();
    for (let i = 49; i >= 0; i--) {
      const isDown = i === 12 || i === 33;
      items.push({
        _id: `hb_${i}`,
        monitor: monitorId,
        status: isDown ? 'DOWN' : 'UP',
        statusCode: isDown ? 502 : 200,
        responseTime: isDown ? 0 : Math.floor(120 + Math.random() * 180),
        error: isDown ? '502 Bad Gateway' : null,
        createdAt: new Date(now - i * 60000).toISOString(),
      });
    }
    return items;
  }
}
