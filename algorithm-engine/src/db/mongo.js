const mongoose = require("mongoose");

// Candle Schema for OHLC data
const candleSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    timeframe: { type: String, required: true, enum: ["5m", "4h"], index: true },
    timestamp: { type: Number, required: true, index: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create compound index for unique candles
candleSchema.index({ symbol: 1, timeframe: 1, timestamp: 1 }, { unique: true });

const Candle = mongoose.model("Candle", candleSchema);

// Connect to MongoDB
const connectMongo = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL not set in environment variables");
    }

    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(" MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error(" MongoDB connection failed:", error.message);
    throw error;
  }
};

// Disconnect from MongoDB
const disconnectMongo = async () => {
  try {
    await mongoose.disconnect();
    console.log(" MongoDB disconnected");
  } catch (error) {
    console.error(" MongoDB disconnection error:", error.message);
    throw error;
  }
};

// Get connection status
const getMongoStatus = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  Candle,
  connectMongo,
  disconnectMongo,
  getMongoStatus,
};
