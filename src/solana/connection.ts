import { Connection, clusterApiUrl } from '@solana/web3.js';

const NETWORK = clusterApiUrl('devnet');

export const connection = new Connection(NETWORK, 'confirmed');

export const getSolanaConnection = () => connection;
