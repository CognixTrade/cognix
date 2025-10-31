// Calculate EMA (Exponential Moving Average)
// Formula: EMA = (Close - EMA_prev) * multiplier + EMA_prev
// multiplier = 2 / (N + 1)

const calculateEMA = (closes, period) => {
  if (closes.length === 0) return null;
  if (closes.length < period) {
    // Use SMA for initial values
    return calculateSMA(closes, closes.length);
  }

  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(closes.slice(0, period), period);

  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return ema;
};

// Calculate Simple Moving Average (SMA)
const calculateSMA = (values, period) => {
  if (values.length < period) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  return (
    values.slice(-period).reduce((a, b) => a + b, 0) / period
  );
};

// Get EMA values for all candles
const getEMAValues = (candles, period) => {
  if (!candles || candles.length === 0) return [];

  const closes = candles.map((c) => c.close);
  const multiplier = 2 / (period + 1);
  const emaValues = [];

  // Calculate initial SMA
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaValues.push(ema);

  // Calculate EMA for remaining candles
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
    emaValues.push(ema);
  }

  return emaValues;
};

// Detect EMA crossover signal
// Returns: 'bullish' (9 crosses above 50), 'bearish' (9 crosses below 50), or null
const detectCrossover = (ema9Array, ema50Array) => {
  if (
    ema9Array.length < 2 ||
    ema50Array.length < 2 ||
    ema9Array.length !== ema50Array.length
  ) {
    return null;
  }

  const currentIdx = ema9Array.length - 1;
  const previousIdx = currentIdx - 1;

  const currentEMA9 = ema9Array[currentIdx];
  const previousEMA9 = ema9Array[previousIdx];
  const currentEMA50 = ema50Array[currentIdx];
  const previousEMA50 = ema50Array[previousIdx];

  // Bullish crossover: 9 was below 50, now above 50
  if (previousEMA9 < previousEMA50 && currentEMA9 > currentEMA50) {
    return "bullish";
  }

  // Bearish crossover: 9 was above 50, now below 50
  if (previousEMA9 > previousEMA50 && currentEMA9 < currentEMA50) {
    return "bearish";
  }

  return null;
};

module.exports = {
  calculateEMA,
  calculateSMA,
  getEMAValues,
  detectCrossover,
};
