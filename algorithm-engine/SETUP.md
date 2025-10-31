# Quick Start Guide

## Prerequisites
- MongoDB running locally or configured in `.env`
- Docker & Docker Compose (for Redis)

## Step 1: Start Redis
```bash
docker-compose up -d
```

## Step 2: Update .env with MongoDB URL
Edit `.env` and set your MongoDB connection:
```
MONGO_URL=mongodb://localhost:27017/algorithm-engine
REDIS_PASSWORD=your-redis-password
```

## Step 3: Start the Server

Development mode (with hot reload):
```bash
yarn dev
```

Production mode:
```bash
yarn start
```

## Step 4: Verify Server is Running

Open in browser or use curl:
```bash
# Health check
curl http://localhost:3000/health

# Server info
curl http://localhost:3000/info
```

## Expected Output

You should see logs like:
```
🚀 Starting Algorithm Engine Server...
✓ MongoDB connected successfully
✓ Redis connected successfully
✓ Server running on http://localhost:3000
✓ WebSocket connected to Twelve Data
📡 Subscribed to BTC/USD
💹 BTC/USD: $109541.26 (2025-11-01T12:00:00.000Z)
```

Once the server receives price data and accumulates candles, you'll see trading signals:
```
📊 [5m] EMA Crossover Signal: BULLISH
   EMA9: 42850.25, EMA50: 42100.15

📈 [4h] RSI Signal: OVERBOUGHT (RSI: 75.32)
```

## Troubleshooting

### Redis Connection Error
```bash
# Check Redis is running
docker ps

# Restart Redis
docker-compose restart redis

# Check Redis password matches in docker-compose.yml
```

### MongoDB Connection Error
```bash
# Verify MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Or use MongoDB Atlas and set MONGO_URL in .env
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/algorithm-engine
```

### No price data coming in
- Check WebSocket URL in `.env`
- Verify internet connection
- Server will auto-reconnect if WebSocket drops

## Data Flow

1. **Price Stream**: Real-time prices from Twelve Data WebSocket
2. **OHLC Generation**: Aggregate prices into 5m and 4h candles
3. **Storage**: Save to Redis (cache) and MongoDB (persistent)
4. **Indicator Calculation**: EMA(9,50) and RSI(14)
5. **Signal Detection**: Log crossovers and extremes
6. **Maintain State**: Keep last 50 candles per timeframe

## API Usage

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

Response indicates status of all services (mongodb, redis, websocket).

### Server Info
```bash
curl http://localhost:3000/info
```

Response shows current candle counts and configuration.

## Next Steps

- Configure webhook notifications for trading signals
- Add additional indicators or trading pairs
- Set up MongoDB backups
- Deploy to production with PM2 or Docker

For full documentation, see `README.md`
