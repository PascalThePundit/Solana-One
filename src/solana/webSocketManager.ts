import { Connection, LogsFilter, LogsCallback } from '@solana/web3.js';

export class WebSocketManager {
  private connection: Connection;
  private activeSubscriptions: Map<string, number> = new Map();
  private reconnectTimeout: any = null;
  private isConnected: boolean = false;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public subscribeToLogs(filter: LogsFilter, callback: LogsCallback, key: string): void {
    if (this.activeSubscriptions.has(key)) {
      console.warn(`WebSocketManager: Duplicate subscription for key ${key} prevented.`);
      return;
    }

    try {
      const subId = this.connection.onLogs(filter, (logs, ctx) => {
        // Throttling or processing logic can go here
        callback(logs, ctx);
      }, 'confirmed');
      
      this.activeSubscriptions.set(key, subId);
      this.isConnected = true;
    } catch (err) {
      console.error('WebSocketManager: Subscription failed', err);
      this.scheduleReconnect(() => this.subscribeToLogs(filter, callback, key));
    }
  }

  public unsubscribe(key: string): void {
    const subId = this.activeSubscriptions.get(key);
    if (subId !== undefined) {
      this.connection.removeOnLogsListener(subId).catch(err => {
        console.error(`WebSocketManager: Failed to unsubscribe ${key}`, err);
      });
      this.activeSubscriptions.delete(key);
    }
  }

  private scheduleReconnect(retryFn: () => void) {
    if (this.reconnectTimeout) return;
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      retryFn();
    }, 5000);
  }

  public cleanup(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.activeSubscriptions.forEach((subId) => {
      this.connection.removeOnLogsListener(subId).catch(() => {});
    });
    this.activeSubscriptions.clear();
  }
}
