import { Connection, ConnectionConfig } from '@solana/web3.js';

export interface RPCEndpoint {
  url: string;
  weight: number;
}

export class RPCFailoverManager {
  private endpoints: RPCEndpoint[];
  private currentIdx: number = 0;
  private connections: Map<string, Connection> = new Map();
  private config: ConnectionConfig;

  constructor(endpoints: RPCEndpoint[], config: ConnectionConfig = { commitment: 'confirmed' }) {
    this.endpoints = endpoints.sort((a, b) => b.weight - a.weight);
    this.config = config;
  }

  public getConnection(): Connection {
    const endpoint = this.endpoints[this.currentIdx];
    if (!this.connections.has(endpoint.url)) {
      this.connections.set(endpoint.url, new Connection(endpoint.url, this.config));
    }
    return this.connections.get(endpoint.url)!;
  }

  public async executeWithFailover<T>(fn: (conn: Connection) => Promise<T>, retries: number = 3): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retries) {
      try {
        const conn = this.getConnection();
        return await fn(conn);
      } catch (err) {
        lastError = err as Error;
        console.warn(`RPC Failover: Attempt ${attempt + 1} failed on ${this.endpoints[this.currentIdx].url}. Error: ${lastError.message}`);
        this.switchToNext();
        attempt++;
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 500; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('RPC Failover: All endpoints failed');
  }

  private switchToNext() {
    this.currentIdx = (this.currentIdx + 1) % this.endpoints.length;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const conn = this.getConnection();
      const slot = await conn.getSlot();
      return slot > 0;
    } catch {
      return false;
    }
  }
}
