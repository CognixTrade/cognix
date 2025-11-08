import { startHyperliquidFeed } from './ws/hyperliquidClient.ts';
import { startExecutionWorker } from './executor/worker.ts';
import { startAgenticWebSocket } from './ws/agenticServerClient.ts';
import dotenv from "dotenv";

async function main() {
  dotenv.config();
  startHyperliquidFeed();
  startAgenticWebSocket();
  startExecutionWorker();
}

main();
