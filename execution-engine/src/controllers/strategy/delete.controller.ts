import { Response } from 'express';
import { Strategy } from '../../models/strategy.model';
import { UserAgentConfig } from '../../models/userAgentConfig.model';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/strategies/strategy/{strategyId}:
 *   delete:
 *     summary: Delete a strategy and all its linked user agent configs and indicators
 *     tags: [Strategies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Strategy ID
 *     responses:
 *       200:
 *         description: Strategy deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Strategy deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot delete other user strategies
 *       404:
 *         description: Strategy not found
 */
export const deleteStrategy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { strategyId } = req.params;
    // const currentUserId = req.user?.id;

    // if (!currentUserId) {
    //   throw new ValidationError('User not authenticated');
    // }

    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      throw new NotFoundError('Strategy not found');
    }

    // Users can only delete their own strategies
    // if (strategy.userId.toString() !== currentUserId) {
    //   throw new ForbiddenError('Access denied: Cannot delete other user strategies');
    // }

    // Delete associated user agent configs
    await UserAgentConfig.deleteMany({ strategyId: strategy._id });

    // Delete the strategy
    await Strategy.findByIdAndDelete(strategyId);

    logger.info('Strategy deleted successfully', {
      strategyId,
      // userId: currentUserId,
      name: strategy.name,
    });

    res.status(200).json({
      message: 'Strategy deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting strategy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      strategyId: req.params['strategyId'],
      // userId: req.user?.id,
    });
    throw error;
  }
};
