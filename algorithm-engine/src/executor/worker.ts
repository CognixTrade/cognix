import { getWorker } from '../config/index.ts';
import type { Candle } from '../types/index.ts';
import { log } from '../utils/logger.ts';

export function startExecutionWorker() {
  const worker = getWorker('execution', async (job: { data: { strategy: string; symbol: string; interval: string; candle: Candle; }; }) => {
    const { strategy, symbol, interval, candle } = job.data;
    log(`⚡ Executing ${strategy} for ${symbol} (${interval}) @ ${candle.c}`);
    // Trigger AI backend here
  });

  log('🧠 Execution Worker running...');
}
