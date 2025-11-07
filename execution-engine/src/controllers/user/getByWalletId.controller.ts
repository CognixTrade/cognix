import { Request, Response } from "express";
import { User } from "../../models/user.model";

/**
 * @swagger
 * /api/v1/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (_id)
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
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: "User ID parameter is required",
      });
      return;
    }

    const user = await User.findById(id).lean();

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
    console.error("Error fetching user:", err);
    res.status(500).json({
      error: "Failed to fetch user",
      message: err.message,
    });
  }
};
