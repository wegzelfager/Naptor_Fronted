import { Injectable, NgZone, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertLog, AlertsApiResponse, SseConnectionStatus } from '../../../types/alert.types';

@Injectable({
  providedIn: 'root'
})
export class AlertService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly baseUrl = environment.apiUrl;

  // --- Reactive Signals State ---
  readonly alerts = signal<AlertLog[]>([]);
  readonly connectionStatus = signal<SseConnectionStatus>('disconnected');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly latestAlert = signal<AlertLog | null>(null);

  // Computed state
  readonly isLive = computed(() => this.connectionStatus() === 'connected');
  readonly totalCount = computed(() => this.alerts().length);
  readonly downCount = computed(() => this.alerts().filter(a => a.status.toUpperCase() === 'DOWN').length);
  readonly degradedCount = computed(() => this.alerts().filter(a => a.status.toUpperCase() === 'DEGRADED').length);
  readonly recoveredCount = computed(() => this.alerts().filter(a => a.status.toUpperCase() === 'RECOVERED').length);

  // --- SSE Internal Variables ---
  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private delayMs = 1000;
  private readonly maxDelayMs = 30000;
  private intentionalDisconnect = false;

  /**
   * Fetches historical notification logs from GET /api/alerts via REST API.
   */
  getAlertsHistory(): Observable<AlertLog[]> {
    this.isLoading.set(true);
    this.error.set(null);

    // Note: AuthInterceptor automatically handles Bearer token and baseURL if relative
    return this.http.get<AlertsApiResponse | AlertLog[]>(`${this.baseUrl}/api/alerts`).pipe(
      map(response => {
        let list: AlertLog[] = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response && Array.isArray(response.data)) {
          list = response.data;
        } else if (response && Array.isArray(response.alerts)) {
          list = response.alerts;
        }
        return list.map(item => this.normalizeAlert(item));
      }),
      tap(normalizedAlerts => {
        this.zone.run(() => {
          this.alerts.set(normalizedAlerts);
          this.isLoading.set(false);
        });
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('[AlertService] Failed to load alerts history:', err);
        const errMsg = err.error?.message || err.message || 'Failed to fetch historical alerts';
        this.zone.run(() => {
          this.error.set(errMsg);
          this.isLoading.set(false);
        });
        return of([]);
      })
    );
  }

  /**
   * Establishes a real-time SSE connection using native browser EventSource
   * listening to GET /api/alerts/stream.
   */
  connectToAlertStream(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.intentionalDisconnect = false;
    this.connectionStatus.set('connecting');

    // Build URL: EventSource cannot set Authorization header natively,
    // so token is supplied via query param if present
    const token = localStorage.getItem('token');
    const streamEndpoint = `${this.baseUrl}/api/alerts/stream`;
    const streamUrl = token ? `${streamEndpoint}?token=${encodeURIComponent(token)}` : streamEndpoint;

    this.zone.runOutsideAngular(() => {
      try {
        const es = new EventSource(streamUrl, { withCredentials: true });
        this.eventSource = es;

        es.onopen = () => {
          this.zone.run(() => {
            console.log('[AlertService] SSE Stream Connected to /api/alerts/stream');
            this.connectionStatus.set('connected');
            this.delayMs = 1000; // Reset backoff delay
          });
        };

        // Standard unnamed message handler
        es.onmessage = (event: MessageEvent) => {
          this.handleIncomingStreamMessage(event.data);
        };

        // Named event: 'alert'
        es.addEventListener('alert', (event: MessageEvent) => {
          this.handleIncomingStreamMessage(event.data);
        });

        // Named event: 'new_alert'
        es.addEventListener('new_alert', (event: MessageEvent) => {
          this.handleIncomingStreamMessage(event.data);
        });

        // Named event: 'notification'
        es.addEventListener('notification', (event: MessageEvent) => {
          this.handleIncomingStreamMessage(event.data);
        });

        es.onerror = (err) => {
          this.zone.run(() => {
            console.warn('[AlertService] SSE Connection error or backend disconnected:', err);
            this.connectionStatus.set('error');
            this._closeSource();

            if (!this.intentionalDisconnect) {
              this._scheduleReconnect();
            }
          });
        };
      } catch (err) {
        this.zone.run(() => {
          console.error('[AlertService] Failed to initialize EventSource:', err);
          this.connectionStatus.set('error');
          if (!this.intentionalDisconnect) {
            this._scheduleReconnect();
          }
        });
      }
    });
  }

  /**
   * Prepend a new incoming alert to the state without requiring a full page refresh.
   */
  prependAlert(rawAlert: unknown): void {
    const alert = this.normalizeAlert(rawAlert as AlertLog);
    alert.isNew = true;

    this.zone.run(() => {
      this.alerts.update(existing => {
        // Prevent duplicate entries if event is sent more than once
        const exists = existing.some(item => (item.id && item.id === alert.id) || (item._id && item._id === alert._id));
        if (exists) {
          return existing.map(item => ((item.id && item.id === alert.id) || (item._id && item._id === alert._id)) ? alert : item);
        }
        return [alert, ...existing];
      });

      // Update latest alert signal to trigger visual toast & audio
      this.latestAlert.set(alert);
    });
  }

  /**
   * Disconnects EventSource stream and cancels any scheduled reconnect timers.
   */
  disconnect(): void {
    this.intentionalDisconnect = true;
    this._clearReconnectTimer();
    this._closeSource();
    this.connectionStatus.set('disconnected');
    console.log('[AlertService] SSE Stream disconnected.');
  }

  /**
   * Removes an alert from state manually if requested.
   */
  removeAlert(id: string): void {
    this.alerts.update(existing => existing.filter(a => a.id !== id && a._id !== id));
  }

  /**
   * Clears all alerts from local state.
   */
  clearAllAlerts(): void {
    this.alerts.set([]);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  // --- Private Helpers ---

  private handleIncomingStreamMessage(dataString: string): void {
    if (!dataString) return;

    try {
      const parsed = JSON.parse(dataString);

      // Filter out keep-alive pings or connection confirmation messages
      if (parsed.type === 'ping' || parsed.event === 'ping' || parsed.message === 'connected') {
        return;
      }

      const alertPayload = parsed.alert || parsed.data || parsed;
      this.prependAlert(alertPayload);
    } catch (e) {
      console.warn('[AlertService] Non-JSON or malformed SSE message received:', dataString);
    }
  }

  private _scheduleReconnect(): void {
    this._clearReconnectTimer();

    // Exponential backoff with ±500ms jitter
    const jitter = (Math.random() - 0.5) * 1000;
    const delay = Math.max(1000, Math.min(this.delayMs + jitter, this.maxDelayMs));

    console.log(`[AlertService] Scheduling SSE reconnect in ${Math.round(delay)}ms...`);
    this.connectionStatus.set('connecting');

    this.reconnectTimer = setTimeout(() => {
      if (!this.intentionalDisconnect) {
        this.delayMs = Math.min(this.delayMs * 2, this.maxDelayMs);
        this.connectToAlertStream();
      }
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private _closeSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Standardizes incoming alert objects across various backend payload structures.
   */
  private normalizeAlert(raw: any): AlertLog {
    if (!raw) {
      return {
        id: `alert-${Date.now()}`,
        status: 'DOWN',
        monitorName: 'Unknown Monitor',
        targetUrl: '—',
        timestamp: new Date().toISOString()
      };
    }

    const id = raw._id || raw.id || `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Monitor info resolution
    let monitorName = raw.monitorName || 'Unknown Monitor';
    let targetUrl = raw.targetUrl || '—';

    if (raw.monitor && typeof raw.monitor === 'object') {
      monitorName = raw.monitor.name || monitorName;
      targetUrl = raw.monitor.url || targetUrl;
    } else if (raw.monitorId && typeof raw.monitorId === 'object') {
      monitorName = raw.monitorId.name || monitorName;
      targetUrl = raw.monitorId.url || targetUrl;
    }

    // Status normalization
    let rawStatus = (raw.status || raw.type || 'DOWN').toString().toUpperCase();
    if (rawStatus === 'SENT' || rawStatus === 'FAILED') {
      rawStatus = (raw.type || 'DOWN').toString().toUpperCase();
    }

    let status = rawStatus;
    if (status === 'UP' || status === 'RESOLVED') {
      status = 'RECOVERED';
    } else if (status === 'WARNING' || status === 'LATENCY_HIGH') {
      status = 'DEGRADED';
    }

    const timestamp = raw.timestamp || raw.createdAt || raw.triggeredAt || new Date().toISOString();

    return {
      ...raw,
      id,
      _id: id,
      monitorName,
      targetUrl,
      status,
      statusCode: raw.statusCode ?? (status === 'RECOVERED' ? 200 : raw.httpStatus ?? undefined),
      responseTime: raw.responseTime ?? raw.duration ?? undefined,
      message: raw.message || raw.error || (status === 'RECOVERED' ? 'Service recovered and responding within thresholds.' : 'Service unavailable or health check failed.'),
      timestamp
    };
  }
}
