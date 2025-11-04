import { Router } from 'express';
import { getUserByWalletId, registerUser, getAllUsers } from '../../controllers/user';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// GET /api/v1/user - Get all users
router.get('/', asyncHandler(getAllUsers));

// POST /api/v1/user/register
router.post('/register', asyncHandler(registerUser));

// GET /api/v1/user/:uniqueWalletId - Get user by wallet ID
router.get('/:uniqueWalletId', asyncHandler(getUserByWalletId));

export default router;
