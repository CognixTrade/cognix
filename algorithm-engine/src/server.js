const express = require("express");
const WebSocket = require("ws");
const { connectMongo, disconnectMongo, getMongoStatus, Candle } = require("./db/mongo");
const { connectRedis, disconnectRedis, getRedisStatus, storeCandle, getLastCandles } = require("./db/redis");
const { getEMAValues, detectCrossover } = require("./indicators/emaCrossover");
const { getRSIValues, detectRSIChange } = require("./indicators/rsi");

const app = express();
const PORT = process.env.PORT || 3000;

// Global state
let wsConnection = null;
let currentCandles = {
  "5m": [],
  "4h": [],
};
let previousIndicators = {
  "5m": { ema9: null, ema50: null, rsi: null },
  "4h": { ema9: null, ema50: null, rsi: null },
};
let priceBuffer = {
  "5m": [],
  "4h": [],
};

const SYMBOL = "BTC/USD";
const FIVE_MIN = 5 * 60 * 1000;
const FOUR_HOUR = 4 * 60 * 60 * 1000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Generate OHLC bar from price ticks
const generateOHLC = (ticks, timeframeMs) => {
  if (ticks.length === 0) return null;

  const opens = [];
  const highs = [];
  const lows = [];
  const closes = [];

  for (const tick of ticks) {
    opens.push(tick.price);
    highs.push(tick.price);
    lows.push(tick.price);
    closes.push(tick.price);
  }

  return {
    open: opens[0],
    high: Math.max(...highs),
    low: Math.min(...lows),
    close: closes[closes.length - 1],
    timestamp: Math.floor(ticks[0].timestamp / 1000),
  };
};

// Update candles and calculate indicators
const updateIndicators = async (timeframe) => {
  try {
    const candles = currentCandles[timeframe];
    if (candles.length < 9) return; // Need at least 9 candles for EMA9

    // Calculate indicators
    const ema9Values = getEMAValues(candles, 9);
    const ema50Values = getEMAValues(candles, 50);
    const rsiValues = getRSIValues(candles, 14);

    if (ema9Values.length === 0 || ema50Values.length === 0) return;

    const currentEMA9 = ema9Values[ema9Values.length - 1];
    const currentEMA50 = ema50Values[ema50Values.length - 1];
    const currentRSI = rsiValues[rsiValues.length - 1];

    // Check for EMA crossover
    const emaCrossover = detectCrossover(ema9Values, ema50Values);
    if (emaCrossover) {
      console.log(
        `📊 [${timeframe}] EMA Crossover Signal: ${emaCrossover.toUpperCase()}`
      );
      console.log(`   EMA9: ${currentEMA9.toFixed(2)}, EMA50: ${currentEMA50.toFixed(2)}`);
    }

    // Check for RSI signal
    const previousRSI = previousIndicators[timeframe].rsi;
    const rsiSignal = detectRSIChange(previousRSI, currentRSI);
    if (rsiSignal) {
      console.log(
        `📈 [${timeframe}] RSI Signal: ${rsiSignal.toUpperCase()} (RSI: ${currentRSI.toFixed(2)})`
      );
    }

    // Update previous indicators
    previousIndicators[timeframe] = {
      ema9: currentEMA9,
      ema50: currentEMA50,
      rsi: currentRSI,
    };
  } catch (error) {
    console.error(`Error updating indicators for ${timeframe}:`, error.message);
  }
};

// Process price tick and generate candles
const processPriceTick = async (price, timestamp) => {
  try {
    // Store price for both timeframes
    priceBuffer["5m"].push({ price, timestamp });
    priceBuffer["4h"].push({ price, timestamp });

    // Process 5-minute candles
    const lastCandle5m = currentCandles["5m"][currentCandles["5m"].length - 1];
    if (!lastCandle5m || timestamp - lastCandle5m.timestamp * 1000 >= FIVE_MIN) {
      const ohlc5m = generateOHLC(priceBuffer["5m"], FIVE_MIN);
      if (ohlc5m) {
        currentCandles["5m"].push(ohlc5m);
        await storeCandle(SYMBOL, "5m", ohlc5m);

        // Keep only last 50
        if (currentCandles["5m"].length > 50) {
          currentCandles["5m"] = currentCandles["5m"].slice(-50);
        }

        // Save to MongoDB
        await Candle.updateOne(
          { symbol: SYMBOL, timeframe: "5m", timestamp: ohlc5m.timestamp },
          { $set: ohlc5m },
          { upsert: true }
        );

        await updateIndicators("5m");
        priceBuffer["5m"] = [];
      }
    }

    // Process 4-hour candles
    const lastCandle4h = currentCandles["4h"][currentCandles["4h"].length - 1];
    if (!lastCandle4h || timestamp - lastCandle4h.timestamp * 1000 >= FOUR_HOUR) {
      const ohlc4h = generateOHLC(priceBuffer["4h"], FOUR_HOUR);
      if (ohlc4h) {
        currentCandles["4h"].push(ohlc4h);
        await storeCandle(SYMBOL, "4h", ohlc4h);

        // Keep only last 50
        if (currentCandles["4h"].length > 50) {
          currentCandles["4h"] = currentCandles["4h"].slice(-50);
        }

        // Save to MongoDB
        await Candle.updateOne(
          { symbol: SYMBOL, timeframe: "4h", timestamp: ohlc4h.timestamp },
          { $set: ohlc4h },
          { upsert: true }
        );

        await updateIndicators("4h");
        priceBuffer["4h"] = [];
      }
    }
  } catch (error) {
    console.error("Error processing price tick:", error.message);
  }
};

// ============================================================================
// EXPRESS SERVER
// ============================================================================

// Health check endpoint
app.get("/health", (req, res) => {
  const mongoConnected = getMongoStatus();
  const redisConnected = getRedisStatus();
  const wsConnected = wsConnection && wsConnection.readyState === WebSocket.OPEN;

  const status = {
    status: mongoConnected && redisConnected && wsConnected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoConnected ? "connected" : "disconnected",
      redis: redisConnected ? "connected" : "disconnected",
      websocket: wsConnected ? "connected" : "disconnected",
    },
  };

  const statusCode = status.status === "ok" ? 200 : 503;
  res.status(statusCode).json(status);
});

// Additional info endpoint
app.get("/info", (req, res) => {
  res.json({
    symbol: SYMBOL,
    timeframes: ["5m", "4h"],
    indicators: {
      ema: [9, 50],
      rsi: 14,
    },
    candles: {
      "5m": currentCandles["5m"].length,
      "4h": currentCandles["4h"].length,
    },
  });
});

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

const connectWebSocket = () => {
  try {
    const wsUrl = process.env.TWELVE_DATA_API_ENDPOINT;
    if (!wsUrl) {
      throw new Error("TWELVE_DATA_API_ENDPOINT not set in environment");
    }

    wsConnection = new WebSocket(wsUrl);

    wsConnection.on("open", () => {
      console.log("✓ WebSocket connected to Twelve Data");

      // Subscribe to price quotes
      const subscribe = {
        action: "subscribe",
        params: {
          symbols: SYMBOL,
        },
      };
      wsConnection.send(JSON.stringify(subscribe));
      console.log(`📡 Subscribed to ${SYMBOL}`);
    });

    wsConnection.on("message", (data) => {
      try {
        const message = JSON.parse(data);

        if (message.event === "price") {
          const { price, timestamp, symbol } = message;
          console.log(
            `💹 ${symbol}: $${price.toFixed(2)} (${new Date(timestamp * 1000).toISOString()})`
          );
          processPriceTick(price, timestamp * 1000);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error.message);
      }
    });

    wsConnection.on("error", (error) => {
      console.error("✗ WebSocket error:", error.message);
    });

    wsConnection.on("close", () => {
      console.log("✗ WebSocket disconnected, attempting to reconnect in 5s...");
      setTimeout(connectWebSocket, 5000);
    });
  } catch (error) {
    console.error("Error connecting to WebSocket:", error.message);
    setTimeout(connectWebSocket, 5000);
  }
};

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    console.log("🚀 Starting Algorithm Engine Server...");

    // Connect to databases
    await connectMongo();
    await connectRedis();

    // Load initial candles from Redis
    try {
      currentCandles["5m"] = await getLastCandles(SYMBOL, "5m", 50);
      currentCandles["4h"] = await getLastCandles(SYMBOL, "4h", 50);
      console.log(`✓ Loaded ${currentCandles["5m"].length} 5m candles from Redis`);
      console.log(`✓ Loaded ${currentCandles["4h"].length} 4h candles from Redis`);
    } catch (error) {
      console.log("ℹ No historical candles found, will build from price ticks");
    }

    // Connect to WebSocket
    connectWebSocket();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`ℹ  Info endpoint: http://localhost:${PORT}/info`);
    });
  } catch (error) {
    console.error("✗ Server startup failed:", error.message);
    process.exit(1);
  }
};

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server gracefully...");

  if (wsConnection) {
    wsConnection.close();
  }

  await disconnectRedis();
  await disconnectMongo();

  console.log("✓ Server shutdown complete");
  process.exit(0);
});

module.exports = { startServer, app };
