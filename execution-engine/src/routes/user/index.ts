import { Router } from "express";
import {
  getUserById,
  registerUser,
  getAllUsers,
  toggleAutonomous,
  getUserByWalletId,
} from "../../controllers/user";
import { asyncHandler } from "../../middleware/errorHandler";

const router = Router();

// GET /api/v1/user - Get all users
router.get("/", asyncHandler(getAllUsers));

// POST /api/v1/user/register
router.post("/register", asyncHandler(registerUser));

// PUT /api/v1/user/:id/autonomous - Toggle autonomous mode
router.put("/:id/autonomous", asyncHandler(toggleAutonomous));

// GET /api/v1/user/:id - Get user by ID
router.get("/:id", asyncHandler(getUserById));

// GET /api/v1/user/:walletId/walletId - Get user by wallet ID
router.get("/:walletId/walletId", asyncHandler(getUserByWalletId));

export default router;
