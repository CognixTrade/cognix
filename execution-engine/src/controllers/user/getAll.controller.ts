import { Request, Response } from "express";
import { User } from "../../models/user.model";

/**
 * @swagger
 * /api/v1/user:
 *   get:
 *     summary: Get all users from the database
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: User ID
 *                   uniqueWalletId:
 *                     type: string
 *                     description: Unique wallet ID (e.g., Privy DID)
 *                   walletAddress:
 *                     type: string
 *                     description: Wallet address
 *                   apiWallet:
 *                     type: object
 *                     properties:
 *                       address:
 *                         type: string
 *                         description: API wallet address
 *                       privateKey:
 *                         type: string
 *                         description: API wallet private key (masked for security)
 *                   signature:
 *                     type: string
 *                   agentSquadDetails:
 *                     type: array
 *                     items:
 *                       type: string
 *                   isAutonomousActive:
 *                     type: boolean
 *                     description: Whether autonomous mode is active
 *                   totalPnL:
 *                     type: number
 *                     description: Total Profit and Loss
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: User creation timestamp
 *                   lastLoginAt:
 *                     type: string
 *                     format: date-time
 *                     description: Last login timestamp
 *       500:
 *         description: Server error
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).lean();

    // Mask private keys for security
    const secureUsers = users.map((user: any) => {
      if (user.apiWallet?.privateKey) {
        user.apiWallet.privateKey = "********";
      }
      return user;
    });

    res.status(200).json({
      success: true,
      count: secureUsers.length,
      data: secureUsers,
    });
  } catch (err: any) {
    console.error("Error fetching all users:", err);
    res.status(500).json({
      error: "Failed to fetch users",
      message: err.message,
    });
  }
};
