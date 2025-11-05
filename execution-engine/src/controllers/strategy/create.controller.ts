import { Response, Request } from "express";
import { Strategy } from "../../models/strategy.model";
import { UserAgentConfig } from "../../models/userAgentConfig.model";
import { Agent } from "../../models/agent.model";
import { Indicator } from "../../models/indicator.model";
import { User } from "../../models/user.model";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { AuthenticatedRequest } from "../../middleware/auth";
import logger from "../../utils/logger";

/**
 * @swagger
 * /api/strategies:
 *   post:
 *     summary: Create a new strategy for a user (with agent configs and indicators)
 *     tags: [Strategies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - agents
 *               - userId
 *               - risk
 *               - cryptoAsset
 *               - timeframe
 *               - leverage
 *               - depositAmount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the strategy
 *                 example: "BTC EMA Crossover"
 *               userId:
 *                 type: string
 *                 description: "user id"
 *                 example: "1"
 *               description:
 *                 type: string
 *                 description: Description of the strategy
 *                 example: "Goes long when EMA7 crosses EMA30 upward"
 *               cryptoAsset:
 *                 type: string
 *                 description: Cryptocurrency asset (e.g., BTC, ETH)
 *                 example: "BTC"
 *               timeframe:
 *                 type: string
 *                 description: Trading timeframe (e.g., 1h, 4h, 1d)
 *                 example: "1h"
 *               leverage:
 *                 type: number
 *                 description: Leverage multiplier for the strategy
 *                 example: 2.5
 *               depositAmount:
 *                 type: number
 *                 description: Initial deposit amount
 *                 example: 1000
 *               risk:
 *                 type: string
 *                 enum: [High, Medium, Low]
 *                 description: Risk level of the strategy
 *                 example: "Medium"
 *               agents:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - agentId
 *                     - votingPower
 *                   properties:
 *                     agentId:
 *                       type: string
 *                       description: ID of the agent
 *                     votingPower:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                       description: Voting power for this agent in the strategy
 *                     customPrompt:
 *                       type: string
 *                       description: Custom prompt override for this agent
 *                     code:
 *                       type: object
 *                       description: Optional JSON code configuration
 *               indicators:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of indicator IDs to associate with the strategy
 *                 example: ["indicator_id_1", "indicator_id_2"]
 *     responses:
 *       201:
 *         description: Strategy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Strategy created successfully"
 *                 strategy:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     cryptoAsset:
 *                       type: string
 *                     timeframe:
 *                       type: string
 *                     leverage:
 *                       type: number
 *                     depositAmount:
 *                       type: number
 *                     risk:
 *                       type: string
 *                     agentConfigs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     indicators:
 *                       type: array
 *                       items:
 *                         type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User, agent, or indicator not found
 */
export const createStrategy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, agents, userId, risk, indicators, cryptoAsset, timeframe, leverage, depositAmount } = req.body;
    // const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    // Validate required fields
    if (!name || !agents || !Array.isArray(agents) || agents.length === 0) {
      throw new ValidationError(
        "Missing required fields: name and agents array"
      );
    }

    // Validate new required fields
    if (!cryptoAsset || !timeframe || leverage === undefined || depositAmount === undefined) {
      throw new ValidationError(
        "Missing required fields: cryptoAsset, timeframe, leverage, and depositAmount"
      );
    }

    // Validate leverage and depositAmount are numbers
    if (typeof leverage !== "number" || leverage < 0) {
      throw new ValidationError("Leverage must be a non-negative number");
    }

    if (typeof depositAmount !== "number" || depositAmount <= 0) {
      throw new ValidationError("Deposit amount must be a positive number");
    }

    // Validate risk field
    if (!risk || !["High", "Medium", "Low"].includes(risk)) {
      throw new ValidationError("Risk must be one of: High, Medium, Low");
    }

    // Validate agents array
    for (const agent of agents) {
      if (!agent.agentId || agent.votingPower === undefined) {
        throw new ValidationError(
          "Each agent must have agentId and votingPower"
        );
      }
      if (agent.votingPower < 0 || agent.votingPower > 1) {
        throw new ValidationError("Voting power must be between 0 and 1");
      }
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify all agents exist
    const agentIds = agents.map((a) => a.agentId);
    const existingAgents = await Agent.find({ _id: { $in: agentIds } });
    if (existingAgents.length !== agentIds.length) {
      throw new ValidationError("One or more agents not found");
    }

    // Verify all indicators exist if provided
    let indicatorIds: any[] = [];
    if (indicators && Array.isArray(indicators) && indicators.length > 0) {
      const existingIndicators = await Indicator.find({
        _id: { $in: indicators },
      });
      if (existingIndicators.length !== indicators.length) {
        throw new ValidationError("One or more indicators not found");
      }
      indicatorIds = indicators;
    }

    // Create strategy
    const strategy = new Strategy({
      userId,
      name,
      description,
      cryptoAsset,
      timeframe,
      leverage,
      depositAmount,
      risk,
      agentConfigs: [],
      indicators: indicatorIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedStrategy = await strategy.save();

    // Create user agent configs
    const agentConfigs = [];
    for (const agent of agents) {
      const userAgentConfig = new UserAgentConfig({
        userId,
        strategyId: savedStrategy._id,
        agentId: agent.agentId,
        votingPower: agent.votingPower,
        customPrompt: agent.customPrompt || "",
        code: agent.code,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedConfig = await userAgentConfig.save();
      agentConfigs.push(savedConfig._id);
    }

    // Update strategy with agent configs
    savedStrategy.agentConfigs = agentConfigs;
    await savedStrategy.save();

    logger.info("Strategy created successfully", {
      strategyId: savedStrategy._id,
      userId,
      name: savedStrategy.name,
      agentCount: agents.length,
      indicatorCount: indicatorIds.length,
    });

    res.status(201).json({
      message: "Strategy created successfully",
      strategy: {
        _id: savedStrategy._id,
        name: savedStrategy.name,
        description: savedStrategy.description,
        cryptoAsset: savedStrategy.cryptoAsset,
        timeframe: savedStrategy.timeframe,
        leverage: savedStrategy.leverage,
        depositAmount: savedStrategy.depositAmount,
        risk: savedStrategy.risk,
        agentConfigs: agentConfigs,
        indicators: indicatorIds,
        createdAt: savedStrategy.createdAt,
        updatedAt: savedStrategy.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error creating strategy", {
      error: error instanceof Error ? error.message : "Unknown error",
      // userId: req.user?.id,
      body: req.body,
    });
    throw error;
  }
};
