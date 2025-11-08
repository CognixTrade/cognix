import { pushCandle, getRecentCandles } from "../redis/candleStore.ts";
import { EmaCrossStrategy } from "../strategies/emaCrossStrategy.ts";
import { triggerQueue } from "../config/index.ts";
import { log } from "../utils/logger.ts";
import type { Candle } from "../types/index.ts";
import { getUsersAndStrategiesByIndicator } from "../services/indicator.ts";

// You can later load these dynamically based on DB
const EMA_9_50_INDICATOR_ID = "690a5940d863d469e89f962f";
const strategies = [new EmaCrossStrategy(9, 50)];

export async function handleCandleUpdate(candle: Candle) {
  const symbol = candle.s;     // e.g. BTCUSDT
  const interval = candle.i;   // e.g. "1h"

  log(`📥 Received candle for ${symbol} (${interval})`);

  // Push candle to Redis
  await pushCandle(symbol, interval, candle);

  // Get latest candles for evaluation
  const recentCandles = await getRecentCandles(symbol, interval);

  // Fetch all user strategies using this indicator
  const userStrategies = await getUsersAndStrategiesByIndicator(EMA_9_50_INDICATOR_ID);
  if (!userStrategies || userStrategies.length === 0) {
    log(`⚠️ No user strategies linked to indicator ${EMA_9_50_INDICATOR_ID}`);
    return;
  }

  // For each user who uses this indicator
  for (const user of userStrategies) {
    const { userId, strategies: userStrats } = user;

    for (const strat of userStrats) {
      // Check if this strategy matches symbol + timeframe + indicator
      const hasIndicator = strat.indicators.some(
        (id: string) => id.toString() === EMA_9_50_INDICATOR_ID
      );

      if (
        strat.cryptoAsset === symbol &&
        strat.timeframe === interval &&
        hasIndicator
      ) {
        // Find the correct strategy instance
        const strategyInstance = strategies.find(s => s.name === `EMA_CROSS_9_50`);
        if (!strategyInstance) continue;

        const signal = await strategyInstance.evaluate(recentCandles);

        if (signal !== "HOLD") {
          log(`🚀 ${signal} signal from ${strategyInstance.name} for ${symbol} (${interval}) - user ${userId}`);

          await triggerQueue.add("trigger", {
            strategyId: strat._id,
            userId,
            assetSymbol: strat.cryptoAsset,
            timeframe: strat.timeframe,
            indicatorName: strategyInstance.indicator,
            direction: signal,
          });
        }
      }
    }
  }
}
