import { Connection } from '@solana/web3.js';
import { WalletWatcher } from './walletWatcher';
import { incidentService } from './incidentService';

async function testWatcher() {
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const watcher = new WalletWatcher(connection);

  const testWallets = [
    '6k8GfM88yV7q3qW3y9m2K8N8m6q5k8GfM88yV7q3qW3y', // Example public key
  ];

  incidentService.on('incident', (incident) => {
    console.log('ALERT! New Incident Detected:', incident);
  });

  console.log('Starting Wallet Watcher test...');
  await watcher.start(testWallets);

  // Keep process alive for a bit to listen for logs if it were a real test with live data
  // For now, we just verify it starts and subscribes correctly
  setTimeout(() => {
    console.log('Stopping test...');
    watcher.stop();
    process.exit(0);
  }, 10000);
}

// Only run if called directly
if (require.main === module) {
  testWatcher().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}
