import { Response, Request } from 'express';
import { Strategy } from '../../models/strategy.model';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/strategies/user/{userId}/strategy/{strategyId}:
 *   get:
 *     summary: Fetch single strategy by userId and strategyId with all agent configs and indicators populated
 *     tags: [Strategies]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: strategyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Strategy ID
 *     responses:
 *       200:
 *         description: Strategy details with populated agent configs and indicators
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 cryptoAsset:
 *                   type: string
 *                 timeframe:
 *                   type: string
 *                 leverage:
 *                   type: number
 *                 depositAmount:
 *                   type: number
 *                 risk:
 *                   type: string
 *                   enum: [High, Medium, Low]
 *                 agentConfigs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       votingPower:
 *                         type: number
 *                       customPrompt:
 *                         type: string
 *                       code:
 *                         type: object
 *                       agentId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           prompt:
 *                             type: string
 *                 indicators:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of indicator IDs associated with the strategy
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Strategy does not belong to the specified user
 *       404:
 *         description: Strategy not found
 */
export const getByUserIdAndStrategyId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, strategyId } = req.params;

    if (!userId || !strategyId) {
      throw new ValidationError('Both userId and strategyId are required');
    }

    logger.info('Retrieving strategy by userId and strategyId', {
      userId,
      strategyId,
    });

    const strategy = await Strategy.findById(strategyId)
      .populate({
        path: 'agentConfigs',
        populate: {
          path: 'agentId',
          model: 'Agent',
        },
      });

    if (!strategy) {
      throw new NotFoundError('Strategy not found');
    }

    // Verify that the strategy belongs to the specified user
    if (strategy.userId.toString() !== userId) {
      throw new ForbiddenError('Access denied: Strategy does not belong to the specified user');
    }

    const strategyResponse = {
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
          prompt: config.agentId.prompt,
        },
      })),
      indicators: strategy.indicators,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
    };

    logger.info('Successfully retrieved strategy', {
      userId,
      strategyId,
    });

    res.status(200).json(strategyResponse);
  } catch (error) {
    logger.error('Error retrieving strategy by userId and strategyId', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params['userId'],
      strategyId: req.params['strategyId'],
    });
    throw error;
  }
};
