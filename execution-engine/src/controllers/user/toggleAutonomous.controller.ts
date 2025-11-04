import { Request, Response } from "express";
import { User } from "../../models/user.model";

/**
 * @swagger
 * /api/v1/user/{id}/autonomous:
 *   put:
 *     summary: Toggle isAutonomousActive status for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAutonomousActive
 *             properties:
 *               isAutonomousActive:
 *                 type: boolean
 *                 description: Set autonomous mode to true or false
 *                 example: true
 *     responses:
 *       200:
 *         description: Autonomous status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Autonomous mode turned on"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     uniqueWalletId:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     isAutonomousActive:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
export const toggleAutonomous = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { isAutonomousActive } = req.body;

    // Validate required parameters
    if (!id) {
      res.status(400).json({
        error: "User ID parameter is required",
      });
      return;
    }

    if (isAutonomousActive === undefined || isAutonomousActive === null) {
      res.status(400).json({
        error: "isAutonomousActive field is required in request body",
      });
      return;
    }

    // Validate that isAutonomousActive is a boolean
    if (typeof isAutonomousActive !== "boolean") {
      res.status(400).json({
        error: "isAutonomousActive must be a boolean (true or false)",
      });
      return;
    }

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      id,
      {
        isAutonomousActive,
        updatedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Mask private key for security
    if (user.apiWallet?.privateKey) {
      user.apiWallet.privateKey = "********";
    }

    const statusMessage = isAutonomousActive
      ? "Autonomous mode turned on"
      : "Autonomous mode turned off";

    res.status(200).json({
      success: true,
      message: statusMessage,
      data: {
        _id: user._id,
        uniqueWalletId: user.uniqueWalletId,
        walletAddress: user.walletAddress,
        isAutonomousActive: user.isAutonomousActive,
      },
    });
  } catch (err: any) {
    console.error("Error toggling autonomous mode:", err);
    res.status(500).json({
      error: "Failed to toggle autonomous mode",
      message: err.message,
    });
  }
};
