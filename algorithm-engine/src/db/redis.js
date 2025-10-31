const redis = require("redis");

let redisClient;

// Connect to Redis
const connectRedis = async () => {
  try {
    const redisPassword = process.env.REDIS_PASSWORD || "your-redis-password";
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = process.env.REDIS_PORT || 6379;

    redisClient = redis.createClient({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    redisClient.on("error", (err) =>
      console.error(" Redis Client Error:", err)
    );
    redisClient.on("connect", () =>
      console.log(" Redis connected successfully")
    );

    await redisClient.connect();
    return true;
  } catch (error) {
    console.error(" Redis connection failed:", error.message);
    throw error;
  }
};

// Disconnect from Redis
const disconnectRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.disconnect();
      console.log(" Redis disconnected");
    }
  } catch (error) {
    console.error(" Redis disconnection error:", error.message);
    throw error;
  }
};

// Get connection status
const getRedisStatus = () => {
  return redisClient && redisClient.isOpen;
};

// Store candles in Redis (maintain last 50 per timeframe)
const storeCandle = async (symbol, timeframe, candle) => {
  try {
    const key = `candles:${symbol}:${timeframe}`;
    // Store as JSON
    await redisClient.lPush(key, JSON.stringify(candle));
    // Keep only last 50
    await redisClient.lTrim(key, 0, 49);
    // Set expiration (24 hours)
    await redisClient.expire(key, 86400);
  } catch (error) {
    console.error("Error storing candle in Redis:", error.message);
    throw error;
  }
};

// Get all candles from Redis
const getCandles = async (symbol, timeframe) => {
  try {
    const key = `candles:${symbol}:${timeframe}`;
    const candles = await redisClient.lRange(key, 0, -1);
    return candles.map((c) => JSON.parse(c));
  } catch (error) {
    console.error("Error getting candles from Redis:", error.message);
    throw error;
  }
};

// Get last N candles
const getLastCandles = async (symbol, timeframe, count = 50) => {
  try {
    const key = `candles:${symbol}:${timeframe}`;
    const candles = await redisClient.lRange(key, 0, count - 1);
    return candles.map((c) => JSON.parse(c));
  } catch (error) {
    console.error("Error getting last candles from Redis:", error.message);
    throw error;
  }
};

// Store current prices
const storePrice = async (symbol, price, timestamp) => {
  try {
    const key = `price:${symbol}`;
    await redisClient.hSet(key, {
      price: price.toString(),
      timestamp: timestamp.toString(),
    });
    await redisClient.expire(key, 3600); // 1 hour expiration
  } catch (error) {
    console.error("Error storing price in Redis:", error.message);
    throw error;
  }
};

// Get current price
const getPrice = async (symbol) => {
  try {
    const key = `price:${symbol}`;
    const data = await redisClient.hGetAll(key);
    return data && data.price
      ? { price: parseFloat(data.price), timestamp: parseInt(data.timestamp) }
      : null;
  } catch (error) {
    console.error("Error getting price from Redis:", error.message);
    throw error;
  }
};

// Clear all data for a symbol
const clearSymbolData = async (symbol) => {
  try {
    const keys = await redisClient.keys(`*:${symbol}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Error clearing symbol data from Redis:", error.message);
    throw error;
  }
};

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisStatus,
  storeCandle,
  getCandles,
  getLastCandles,
  storePrice,
  getPrice,
  clearSymbolData,
};
