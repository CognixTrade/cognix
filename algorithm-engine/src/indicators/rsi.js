// Calculate RSI (Relative Strength Index)
// Formula: RSI = 100 - (100 / (1 + RS))
// RS = Average Gain / Average Loss (over period, default 14)

const calculateRSI = (closes, period = 14) => {
  if (closes.length < period + 1) {
    return null;
  }

  const gains = [];
  const losses = [];

  // Calculate gains and losses
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }

  // First average (SMA)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Subsequent averages (EMA)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  // Calculate RS and RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
};

// Get RSI values for all candles
const getRSIValues = (candles, period = 14) => {
  if (!candles || candles.length < period + 1) {
    return [];
  }

  const closes = candles.map((c) => c.close);
  const rsiValues = [];

  const gains = [];
  const losses = [];

  // Calculate gains and losses for all closes
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }

  // First RSI value
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues.push(100 - 100 / (1 + rs));

  // Subsequent RSI values
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues.push(100 - 100 / (1 + rs));
  }

  return rsiValues;
};

// Detect RSI signal
// Returns: 'overbought' (>70), 'oversold' (<30), or null
const detectRSISignal = (rsiValue) => {
  if (rsiValue === null || rsiValue === undefined) {
    return null;
  }

  if (rsiValue > 70) {
    return "overbought";
  }

  if (rsiValue < 30) {
    return "oversold";
  }

  return null;
};

// Detect RSI entry/exit (compares previous and current RSI)
const detectRSIChange = (previousRSI, currentRSI) => {
  if (previousRSI === null || currentRSI === null) {
    return null;
  }

  // Entered overbought
  if (previousRSI <= 70 && currentRSI > 70) {
    return "overbought";
  }

  // Exited overbought
  if (previousRSI > 70 && currentRSI <= 70) {
    return "overbought_exit";
  }

  // Entered oversold
  if (previousRSI >= 30 && currentRSI < 30) {
    return "oversold";
  }

  // Exited oversold
  if (previousRSI < 30 && currentRSI >= 30) {
    return "oversold_exit";
  }

  return null;
};

module.exports = {
  calculateRSI,
  getRSIValues,
  detectRSISignal,
  detectRSIChange,
};
