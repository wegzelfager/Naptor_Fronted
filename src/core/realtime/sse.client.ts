import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  HeartbeatSSEPayload,
  ConnectedSSEPayload,
  SSEHandlers,
} from './types/sse.types';

export type SseConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/**
 * SseClient — low-level Angular service wrapping the browser EventSource API.
 *
 * Key design decisions:
 * - Bearer tokens cannot be sent via EventSource headers (browser limitation), so
 *   the token is appended as a `?token=` query parameter — the backend `protect`
 *   middleware must also accept it that way.
 * - Named events (`event: heartbeat`) require explicit `addEventListener()` calls,
 *   not `onmessage` (which only fires for unnamed `data:` frames).
 * - Reconnect uses truncated exponential backoff (1s → 2s → 4s … → 30s) with
 *   ±500 ms jitter to avoid thundering-herd on backend restart.
 * - All state mutations that touch Angular signals/observables are wrapped in
 *   NgZone.run() so change detection is triggered correctly.
 */
@Injectable({ providedIn: 'root' })
export class SseClient {
  private readonly zone = inject(NgZone);

  private eventSource: EventSource | null = null;
  private currentUrl = '';
  private currentHandlers: SSEHandlers = {};

  /** Exponential backoff state */
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private delayMs = 1_000;
  private readonly maxDelayMs = 30_000;
  private intentionalDisconnect = false;

  /** Reactive connection status — subscribe in components or effects */
  readonly status$ = new BehaviorSubject<SseConnectionStatus>('idle');

  /** --- Public API ---------------------------------------------------------------- */

  /**
   * Opens an SSE connection to the heartbeat stream.
   *
   * @param handlers - Typed callback map (onConnected, onHeartbeat, onError)
   */
  connect(handlers: SSEHandlers = {}): void {
    // Build URL: append JWT token as query param (EventSource can't send headers)
    const token = localStorage.getItem('token') ?? '';
    const baseUrl = `${environment.apiUrl}/api/monitors/heartbeats/stream`;
    const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;

    if (this.eventSource) {
      this.disconnect();
    }

    this.currentUrl = url;
    this.currentHandlers = handlers;
    this.intentionalDisconnect = false;

    this._openSource(url, handlers);
  }

  /** Permanently closes the SSE connection and cancels any pending reconnects. */
  disconnect(): void {
    this.intentionalDisconnect = true;
    this._clearReconnectTimer();
    this._closeSource();
    this.status$.next('disconnected');
  }

  /** --- Private helpers ----------------------------------------------------------- */

  private _openSource(url: string, handlers: SSEHandlers): void {
    this.status$.next('connecting');

    // Run outside Angular zone to avoid triggering change detection on every SSE tick
    this.zone.runOutsideAngular(() => {
      const es = new EventSource(url, { withCredentials: true });

      // Named event: `event: connected`
      es.addEventListener('connected', (event: MessageEvent) => {
        this.zone.run(() => {
          this.delayMs = 1_000; // Reset backoff on successful connection
          this.status$.next('connected');
          try {
            const payload: ConnectedSSEPayload = JSON.parse(event.data);
            handlers.onConnected?.(payload);
          } catch {
            console.warn('[SseClient] Failed to parse "connected" payload', event.data);
          }
        });
      });

      // Named event: `event: heartbeat`
      es.addEventListener('heartbeat', (event: MessageEvent) => {
        this.zone.run(() => {
          try {
            const payload: HeartbeatSSEPayload = JSON.parse(event.data);
            handlers.onHeartbeat?.(payload);
          } catch {
            console.error('[SseClient] Failed to parse "heartbeat" payload', event.data);
          }
        });
      });

      es.onerror = (err: Event) => {
        this.zone.run(() => {
          console.warn('[SseClient] SSE connection error or closed.', err);
          this.status$.next('error');
          es.close();
          this.eventSource = null;
          handlers.onError?.(err);

          if (!this.intentionalDisconnect) {
            this._scheduleReconnect();
          }
        });
      };

      this.eventSource = es;
    });
  }

  private _scheduleReconnect(): void {
    const jitter = Math.random() * 500;
    const delay = Math.min(this.delayMs, this.maxDelayMs) + jitter;

    console.log(`[SseClient] Reconnecting in ${Math.round(delay)}ms…`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.intentionalDisconnect) {
        this.delayMs = Math.min(this.delayMs * 2, this.maxDelayMs);
        this._openSource(this.currentUrl, this.currentHandlers);
      }
    }, delay);
  }

  private _clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private _closeSource(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
