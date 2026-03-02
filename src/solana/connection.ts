import { clusterApiUrl } from '@solana/web3.js';
import { RPCFailoverManager, RPCEndpoint } from './rpcManager';
import { WebSocketManager } from './webSocketManager';

const ENDPOINTS: RPCEndpoint[] = [
  { url: clusterApiUrl('devnet'), weight: 100 },
  { url: 'https://api.devnet.solana.com', weight: 90 },
  { url: 'https://devnet.genesysgo.net/', weight: 50 }, // Example secondary
];

export const rpcManager = new RPCFailoverManager(ENDPOINTS);

export const connection = rpcManager.getConnection();

export const webSocketManager = new WebSocketManager(connection);

export const getSolanaConnection = () => rpcManager.getConnection();

/**
 * Execute a transaction or query with automatic failover and retry logic.
 */
export const executeSolanaTask = <T>(task: (conn: any) => Promise<T>) => {
  return rpcManager.executeWithFailover(task);
};
