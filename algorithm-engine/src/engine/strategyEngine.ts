import { pushCandle, getRecentCandles } from "../redis/candleStore.ts";
import { SmaCrossStrategy } from "../strategies/smaCrossStrategy.ts";
import { triggerQueue } from "../config/index.ts";
import { log } from "../utils/logger.ts";
import type { Candle } from "../types/index.ts";

const strategies = [new SmaCrossStrategy()];

export async function handleCandleUpdate(candle: Candle) {
  const symbol = candle.s;
  const interval = candle.i;

  log(`📥 Received candle for ${symbol} (${interval})`);

  await pushCandle(symbol, interval, candle);

  const recentCandles = await getRecentCandles(symbol, interval);

  for (const strategy of strategies) {
    const triggered = await strategy.evaluate(recentCandles);
    if (triggered) {
      log(`🚀 Triggered ${strategy.name} for ${symbol} (${interval})`);
      await triggerQueue.add("trigger", {
        strategy: strategy.name,
        symbol,
        interval,
        candle,
      });
    }
  }
}
