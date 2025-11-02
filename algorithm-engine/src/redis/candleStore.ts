import { redis } from '../config/index.ts';
import type { Candle } from '../types/index.ts';
import { log } from "../utils/logger.ts";

export async function pushCandle(symbol: string, interval: string, candle: Candle) {
  const key = `candle:${symbol}:${interval}`;

  // Ensure numeric timestamp for comparison
  const currentT = Number(candle.t);

  const lastRaw = await redis.lindex(key, -1);
  if (lastRaw) {
    const lastCandle: Candle = JSON.parse(lastRaw);
    const lastT = Number(lastCandle.t);

    // 🔁 If same open timestamp, update last candle
    if (lastT === currentT) {
      await redis.lset(key, -1, JSON.stringify(candle));
      console.log('🟡 Updated latest candle', candle.s, candle.i, candle.t);
      return;
    }
  }

  // 🆕 Otherwise, push new candle
  await redis.rpush(key, JSON.stringify(candle));
  await redis.ltrim(key, -2016, -1);
  console.log('🟢 Added new candle', candle.s, candle.i, candle.t);
}

export async function getRecentCandles(symbol: string, interval: string, n = 100) {
  const key = `candle:${symbol}:${interval}`;
  const data = await redis.lrange(key, -n, -1);
  return data.map((item) => JSON.parse(item));
}
