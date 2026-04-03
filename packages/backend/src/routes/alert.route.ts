import { Router } from 'express'
import { AlertController } from '../controllers/alert.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import type { IAuthRequest } from '../types/express.type'

const router = Router()
const controller = new AlertController()

router.use(authMiddleware)

/**
 * @swagger
 * /api/v1/alerts:
 *   get:
 *     summary: Get all alerts for current user
 *     tags: [Alerts]
 *     responses:
 *       200: { description: List of alerts }
 */
router.get('/', (req, res) => controller.getAll(req as unknown as IAuthRequest, res))

export default router
