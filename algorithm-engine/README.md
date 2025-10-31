# Algorithm Engine - Real-Time EMA & RSI Trading Signals

A Node.js server that processes real-time cryptocurrency price data, calculates technical indicators (EMA and RSI), and triggers trading signals based on crossovers and overbought/oversold conditions.

## Features

- **Real-time Price Data**: WebSocket connection to Twelve Data for live BTC/USD prices
- **OHLC Generation**: Automatically generates 5-minute and 4-hour candles from price ticks
- **Technical Indicators**:
  - EMA (9 & 50 periods)
  - RSI (14 periods)
- **Signal Detection**:
  - EMA 9/50 bullish/bearish crossovers
  - RSI overbought (>70) and oversold (<30) conditions
- **Data Persistence**:
  - MongoDB for historical data storage
  - Redis for in-memory caching of last 50 candles per timeframe
- **Health Monitoring**: REST endpoints for server health and info checks
- **Graceful Shutdown**: Proper cleanup of connections on termination

## Prerequisites

- Node.js 14+ or higher
- MongoDB (local or cloud)
- Redis (via docker-compose)
- Yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd algorithm-engine
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**

   Copy the `.env` file and update with your configuration:
   ```bash
   # MongoDB URL (required)
   MONGO_URL=mongodb://localhost:27017/algorithm-engine

   # Redis Configuration (for docker-compose)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password

   # API Keys (already configured)
   TWELVE_DATA_API_ENDPOINT=wss://ws.twelvedata.com/v1/quotes/price?apikey=...
   ```

4. **Start Redis (if using docker-compose)**
   ```bash
   docker-compose up -d
   ```

5. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

## Running the Server

### Development Mode
```bash
yarn dev
```
Uses nodemon for auto-reload on file changes.

### Production Mode
```bash
yarn start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and connectivity info for all services.

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "websocket": "connected"
  }
}
```

**Response (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "services": {
    "mongodb": "disconnected",
    "redis": "connected",
    "websocket": "disconnected"
  }
}
```

### Info Endpoint
```
GET /info
```
Returns current server state and configuration.

**Response:**
```json
{
  "symbol": "BTC/USD",
  "timeframes": ["5m", "4h"],
  "indicators": {
    "ema": [9, 50],
    "rsi": 14
  },
  "candles": {
    "5m": 45,
    "4h": 23
  }
}
```

## Signal Log Format

Signals are logged to console when triggered:

### EMA Crossover Signal
```
📊 [5m] EMA Crossover Signal: BULLISH
   EMA9: 42850.25, EMA50: 42100.15
```

### RSI Signal
```
📈 [4h] RSI Signal: OVERBOUGHT (RSI: 75.32)
```

## Project Structure

```
src/
├── index.js                 # Entry point
├── server.js               # Main server orchestration
├── db/
│   ├── mongo.js           # MongoDB connection & schema
│   └── redis.js           # Redis connection & operations
├── indicators/
│   ├── emaCrossover.js    # EMA calculation & crossover detection
│   └── rsi.js             # RSI calculation & signal detection
└── services/
    └── historicalOHLC.js  # Historical data fetching (for future use)
```

## Technical Details

### OHLC Generation
- Prices are buffered and aggregated into OHLC bars
- 5-minute bars: Closes every 300 seconds
- 4-hour bars: Closes every 14,400 seconds
- Only the last 50 bars are kept in memory and Redis

### EMA Calculation
- Uses exponential smoothing with multiplier: 2 / (period + 1)
- Initial values use SMA if insufficient data
- Calculated for every candle

### RSI Calculation
- Standard 14-period RSI
- Uses exponential moving average for subsequent values
- Signals on crossover into overbought (>70) and oversold (<30) zones

### Data Storage
- **Redis**: Fast in-memory cache of last 50 candles per timeframe
- **MongoDB**: Persistent storage with compound index on (symbol, timeframe, timestamp)
- Auto-upsert on new candles to avoid duplicates

## Error Handling

- WebSocket reconnection: Automatic retry after 5 seconds on disconnect
- Database errors: Logged and continue operation
- Missing environment variables: Server exits with clear error message
- Graceful shutdown: SIGINT (Ctrl+C) closes all connections properly

## Performance Considerations

- Real-time price processing: O(1) per tick
- Indicator calculation: O(n) where n is number of candles (efficient with cached values)
- Redis operations: Sub-millisecond latency
- MongoDB operations: Indexed queries for fast lookups

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGO_URL` | Yes | - | MongoDB connection string |
| `REDIS_HOST` | No | localhost | Redis server host |
| `REDIS_PORT` | No | 6379 | Redis server port |
| `REDIS_PASSWORD` | No | your-redis-password | Redis authentication |
| `TWELVE_DATA_API_ENDPOINT` | Yes | - | WebSocket endpoint for price data |
| `PORT` | No | 3000 | HTTP server port |
| `NODE_ENV` | No | development | Environment mode |

## Troubleshooting

### "MONGO_URL not set in environment variables"
- Ensure `.env` file has `MONGO_URL` defined
- Verify MongoDB is running and accessible

### "Redis connection failed"
- Check Redis is running: `docker-compose up -d`
- Verify `REDIS_PASSWORD` matches docker-compose config
- Check network connectivity

### "WebSocket disconnected"
- Server will auto-reconnect in 5 seconds
- Verify API key is valid
- Check internet connection

### No signals appearing
- Ensure at least 50 candles are loaded (takes 250+ minutes for 5m bars)
- Check console for errors
- Verify real-time prices are being received (look for 💹 logs)

## Future Enhancements

- [ ] Support multiple trading pairs
- [ ] Add Webhook notifications for signals
- [ ] Email/Discord alerts
- [ ] Custom indicator configuration
- [ ] Backtest historical data
- [ ] Trade execution integration

## License

MIT
