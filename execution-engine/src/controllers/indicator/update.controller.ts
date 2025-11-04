import { Request, Response } from 'express';
import { Indicator } from '../../models/indicator.model';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import logger from '../../utils/logger';

/**
 * @swagger
 * /api/indicators/{id}:
 *   put:
 *     summary: Update indicator
 *     tags: [Indicators]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Indicator ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the indicator
 *               type:
 *                 type: string
 *                 enum: ["PRE-DEFINED", "CUSTOM"]
 *                 description: Type of the indicator
 *               description:
 *                 type: string
 *                 description: Description of the indicator
 *               code:
 *                 type: object
 *                 description: Code/configuration for custom indicators
 *     responses:
 *       200:
 *         description: Indicator updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Indicator updated successfully"
 *                 indicator:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     description:
 *                       type: string
 *                     code:
 *                       type: object
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
 *         description: Indicator not found
 *       409:
 *         description: Conflict - Indicator name already exists
 */
export const updateIndicator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, type, description, code } = req.body;

    const indicator = await Indicator.findById(id);
    if (!indicator) {
      throw new NotFoundError('Indicator not found');
    }

    // Validate type enum if provided
    if (type && !['PRE-DEFINED', 'CUSTOM'].includes(type)) {
      throw new ValidationError('Type must be either PRE-DEFINED or CUSTOM');
    }

    // Check for name conflicts if name is being updated
    if (name && name !== indicator.name) {
      const existingIndicator = await Indicator.findOne({ name, _id: { $ne: id } });
      if (existingIndicator) {
        throw new ConflictError('Indicator with this name already exists');
      }
    }

    // Update fields
    if (name) indicator.name = name;
    if (type) indicator.type = type;
    if (description) indicator.description = description;
    if (code !== undefined) indicator.code = code;
    indicator.updatedAt = new Date();

    const updatedIndicator = await indicator.save();

    logger.info('Indicator updated successfully', {
      indicatorId: updatedIndicator._id,
      name: updatedIndicator.name,
    });

    res.status(200).json({
      message: 'Indicator updated successfully',
      indicator: {
        _id: updatedIndicator._id,
        name: updatedIndicator.name,
        type: updatedIndicator.type,
        description: updatedIndicator.description,
        code: updatedIndicator.code,
        createdAt: updatedIndicator.createdAt,
        updatedAt: updatedIndicator.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating indicator', {
      error: error instanceof Error ? error.message : 'Unknown error',
      indicatorId: req.params?.['id'],
      body: req.body,
    });
    throw error;
  }
};
