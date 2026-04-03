import { Router } from 'express'
import { RouteController } from '../controllers/route.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import type { IAuthRequest } from '../types/express.type'

const router = Router()
const controller = new RouteController()

router.use(authMiddleware)

/**
 * @swagger
 * /api/v1/routes:
 *   get:
 *     summary: Get all routes for current user
 *     tags: [Routes]
 *     responses:
 *       200: { description: List of routes }
 */
router.get('/', (req, res) => controller.getAll(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/routes:
 *   post:
 *     summary: Create a new monitored route
 *     tags: [Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination]
 *             properties:
 *               origin: { type: string, minLength: 3, maxLength: 3 }
 *               destination: { type: string, minLength: 3, maxLength: 3 }
 *               flexibleDates: { type: boolean }
 *     responses:
 *       201: { description: Route created }
 */
router.post('/', (req, res) => controller.create(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/routes/{id}:
 *   get:
 *     summary: Get a route by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Route }
 *       404: { description: Route not found }
 */
router.get('/:id', controller.getById)

/**
 * @swagger
 * /api/v1/routes/{id}/toggle:
 *   patch:
 *     summary: Toggle route active state
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Route toggled }
 */
router.patch('/:id/toggle', (req, res) => controller.toggle(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/routes/{id}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Route deleted }
 */
router.delete('/:id', (req, res) => controller.delete(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/routes/{id}/prices:
 *   get:
 *     summary: Get price history for a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Price history }
 */
router.get('/:id/prices', (req, res) => controller.getPrices(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/routes/{id}/baseline:
 *   get:
 *     summary: Get 30-day economy baseline for a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Baseline data }
 *       404: { description: Insufficient data }
 */
router.get('/:id/baseline', (req, res) => controller.getBaseline(req as unknown as IAuthRequest, res))

/**
 * @swagger
 * /api/v1/routes/{id}/alerts:
 *   get:
 *     summary: Get alerts for a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Alerts }
 */
router.get('/:id/alerts', (req, res) => controller.getAlerts(req as unknown as IAuthRequest, res))

export default router
