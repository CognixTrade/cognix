import { Router } from 'express';
import healthRoutes from './health';
import userRoutes from './user';
import agentRoutes from './agent';
import strategyRoutes from './strategy';
import userAgentConfigRoutes from './userAgentConfig';
import hyperliquidRoutes from './exchange/hyperliquid';
import indicatorRoutes from './indicator';

const router = Router();

// Mount route modules
router.use('/health', healthRoutes);

// Mount user route modules
router.use('/api/v1/user', userRoutes);

// Mount agent route modules
router.use('/api/agents', agentRoutes);

// Mount strategy route modules
router.use('/api/strategies', strategyRoutes);

// Mount user agent config route modules
router.use('/api/user-agent-config', userAgentConfigRoutes);

// Mount Hyperliquid routes
router.use('/api/hyperliquid', hyperliquidRoutes);

// Mount Indicator routes
router.use('/api/indicators', indicatorRoutes);

// API routes placeholder
router.use('/api/v1', (req, res) => {
  res.json({
    message: 'API v1 endpoint',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
