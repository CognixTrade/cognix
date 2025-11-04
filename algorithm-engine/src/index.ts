import { startHyperliquidFeed } from './ws/hyperliquidClient.ts';
import { startExecutionWorker } from './executor/worker.ts';

async function main() {
  startHyperliquidFeed();
  startExecutionWorker();
}

main();
