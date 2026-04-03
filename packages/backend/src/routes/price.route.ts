import { Router } from 'express'
import { PriceController } from '../controllers/price.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const controller = new PriceController()

router.use(authMiddleware)

/**
 * @swagger
 * /api/v1/prices:
 *   get:
 *     summary: Query prices
 *     tags: [Prices]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema: { type: string }
 *       - in: query
 *         name: destination
 *         schema: { type: string }
 *       - in: query
 *         name: class
 *         schema: { type: string, enum: [economy, business] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200: { description: Prices }
 */
router.get('/', controller.query)

export default router
