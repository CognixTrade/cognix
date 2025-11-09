import { Request, Response } from "express";
import { User } from "../../models/user.model";

/**
 * @swagger
 * /api/v1/user/{walletId}/walletId:
 *   get:
 *     summary: Get user by wallet ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet ID (did:privy:...)
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Missing user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export const getUserByWalletId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { walletId } = req.params;

    if (!walletId) {
      res.status(400).json({
        error: "Wallet ID parameter is required",
      });
      return;
    }

    const user = await User.findOne({ uniqueWalletId: walletId }).lean();

    if (!user) {
      res.status(404).json({
        success: false,
        exists: false,
        message: "User not found",
      });
      return;
    }

    if (user.apiWallet?.privateKey) {
      user.apiWallet.privateKey = "********";
    }

    res.status(200).json({
      success: true,
      exists: true,
      data: user,
    });
  } catch (err: any) {
    console.error("Error fetching user with walletId:", err);
    res.status(500).json({
      error: "Failed to fetch user with walletId",
      message: err.message,
    });
  }
};
