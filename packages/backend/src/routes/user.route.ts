import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import type { IAuthRequest } from '../types/express.type'

const router = Router()
const controller = new UserController()

router.use(authMiddleware)

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     responses:
 *       200: { description: User profile }
 */
router.get('/me', (req, res) => controller.getMe(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/user/me:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               phone: { type: string }
 *               notifyEmail: { type: boolean }
 *               notifySms: { type: boolean }
 *     responses:
 *       200: { description: Updated user }
 */
router.patch('/me', (req, res) => controller.updateMe(req as unknown as IAuthRequest, res))

export default router
