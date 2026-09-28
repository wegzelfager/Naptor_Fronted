import { Injectable, inject } from '@angular/core';
import { SseClient } from './sse.client';
import { SSEHandlers } from './types/sse.types';

interface ChannelEntry {
  handlers: SSEHandlers;
  refCount: number;
}

/**
 * SseManager — ref-counted registry of named SSE channels.
 *
 * Prevents duplicate EventSource connections when multiple components
 * or services subscribe to the same channel simultaneously.
 * Only closes the underlying EventSource when the last consumer calls closeChannel().
 */
@Injectable({ providedIn: 'root' })
export class SseManager {
  private readonly sseClient = inject(SseClient);

  /** Map<channelName, ChannelEntry> */
  private readonly channels = new Map<string, ChannelEntry>();

  /**
   * Opens (or increments ref-count on) a named SSE channel.
   *
   * @param name     - Logical channel identifier (e.g. 'heartbeat-stream')
   * @param handlers - SSE event handlers for this channel
   */
  openChannel(name: string, handlers: SSEHandlers): void {
    const existing = this.channels.get(name);

    if (existing) {
      // Channel already open — just increment reference count
      existing.refCount++;
      console.log(`[SseManager] Channel "${name}" ref-count → ${existing.refCount}`);
      return;
    }

    this.channels.set(name, { handlers, refCount: 1 });
    this.sseClient.connect(handlers);
    console.log(`[SseManager] Opened channel "${name}"`);
  }

  /**
   * Decrements ref-count for a named channel.
   * Closes the underlying EventSource only when the count reaches 0.
   *
   * @param name - Logical channel identifier
   */
  closeChannel(name: string): void {
    const entry = this.channels.get(name);
    if (!entry) return;

    entry.refCount--;
    console.log(`[SseManager] Channel "${name}" ref-count → ${entry.refCount}`);

    if (entry.refCount <= 0) {
      this.channels.delete(name);
      this.sseClient.disconnect();
      console.log(`[SseManager] Closed channel "${name}" — no more consumers.`);
    }
  }

  /** Expose the reactive status observable from the underlying client. */
  get status$() {
    return this.sseClient.status$;
  }

  /** Force-close all channels (e.g. on user logout). */
  closeAll(): void {
    this.channels.clear();
    this.sseClient.disconnect();
    console.log('[SseManager] All SSE channels closed.');
  }
}
