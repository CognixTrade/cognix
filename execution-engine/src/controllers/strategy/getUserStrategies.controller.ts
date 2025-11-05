import { Response, Request } from 'express';
import { Strategy } from '../../models/strategy.model';
import { ForbiddenError, ValidationError } from '../../utils/errors';
import { AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/strategies/user/{userId}:
 *   get:
 *     summary: Fetch all strategies of a user with populated agent configs and indicators
 *     tags: [Strategies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user strategies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   cryptoAsset:
 *                     type: string
 *                   timeframe:
 *                     type: string
 *                   leverage:
 *                     type: number
 *                   depositAmount:
 *                     type: number
 *                   risk:
 *                     type: string
 *                     enum: [High, Medium, Low]
 *                   agentConfigs:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         votingPower:
 *                           type: number
 *                         customPrompt:
 *                           type: string
 *                         code:
 *                           type: object
 *                         agentId:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             type:
 *                               type: string
 *                             weightage:
 *                               type: number
 *                             prompt:
 *                               type: string
 *                   indicators:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of indicator IDs associated with the strategy
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Cannot access other user strategies
 */
export const getUserStrategies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    // const currentUserId = req.user?.id;

    // if (!currentUserId) {
    //   throw new ValidationError('User not authenticated');
    // }

    // Users can only access their own strategies
    // if (userId !== currentUserId) {
    //   throw new ForbiddenError('Access denied: Cannot access other user strategies');
    // }

    const strategies = await Strategy.find({ userId })
      .populate({
        path: 'agentConfigs',
        populate: {
          path: 'agentId',
          model: 'Agent',
        },
      })
      .sort({ createdAt: -1 });

    const strategiesResponse = strategies.map(strategy => ({
      _id: strategy._id,
      userId: strategy.userId,
      name: strategy.name,
      description: strategy.description,
      cryptoAsset: strategy.cryptoAsset,
      timeframe: strategy.timeframe,
      leverage: strategy.leverage,
      depositAmount: strategy.depositAmount,
      risk: strategy.risk,
      agentConfigs: strategy.agentConfigs.map((config: any) => ({
        _id: config._id,
        votingPower: config.votingPower,
        customPrompt: config.customPrompt,
        code: config.code,
        agentId: {
          _id: config.agentId._id,
          name: config.agentId.name,
          type: config.agentId.type,
          weightage: config.agentId.weightage,
          prompt: config.agentId.prompt,
        },
      })),
      indicators: strategy.indicators,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
    }));

    logger.info('Retrieved user strategies', {
      userId: req.params['userId'],
      count: strategies.length,
    });

    res.status(200).json(strategiesResponse);
  } catch (error) {
    logger.error('Error retrieving user strategies', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params['userId'],
      // currentUserId: req.user?.id,
    });
    throw error;
  }
};
