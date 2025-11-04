import { BaseStrategy } from './baseStrategy.ts';

export class SmaCrossStrategy extends BaseStrategy {
  constructor() {
    super('SMA_CROSS');
  }

  async evaluate(candles: any[]): Promise<boolean> {
    if (candles.length < 50) return false;

    const sma = (arr: number[], n: number) => arr.slice(-n).reduce((a, b) => a + b, 0) / n;
    const closes = candles.map(c => c.close);

    const sma20 = sma(closes, 20);
    const sma50 = sma(closes, 50);

    return sma20 > sma50;
  }
}
