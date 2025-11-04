import { Router } from 'express';
import {
  createIndicator,
  getAllIndicators,
  getIndicatorById,
  updateIndicator,
  deleteIndicator,
} from '../../controllers/indicator';
// import { auth, isAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Indicators
 *   description: Indicator management endpoints
 */

// POST /api/indicators - Create a new indicator
router.post('/', asyncHandler(createIndicator));

// GET /api/indicators - List all indicators
router.get('/', asyncHandler(getAllIndicators));

// GET /api/indicators/:id - Get indicator by ID
router.get('/:id', asyncHandler(getIndicatorById));

// PUT /api/indicators/:id - Update indicator
router.put('/:id', asyncHandler(updateIndicator));

// DELETE /api/indicators/:id - Delete indicator
router.delete('/:id', asyncHandler(deleteIndicator));

export default router;
