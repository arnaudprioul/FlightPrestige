import type { Response } from 'express'
import type { Request } from 'express'
import { ApiResponse } from '../classes/api-response.class'
import { RouteRepository } from '../repositories/route.repository'
import { PriceRepository } from '../repositories/price.repository'
import { AlertRepository } from '../repositories/alert.repository'
import { AppDataSource } from '../configs/database.config'
import { Route } from '../entities/route.entity'
import { detectionService } from '../services/detection.service'
import { runPriceCheck } from '../workers/scheduler.worker'
import type { IAuthRequest } from '../types/express.type'

export class RouteController {
  getAll = async (req: IAuthRequest, res: Response): Promise<void> => {
    const routes = await RouteRepository.findByUserId(req.user.id)
    ApiResponse.ok(routes).send(res)
  }

  create = async (req: IAuthRequest, res: Response): Promise<void> => {
    const { origin, destination, flexibleDates = false } = req.body as {
      origin?: string
      destination?: string
      flexibleDates?: boolean
    }

    if (!origin || origin.length !== 3) {
      ApiResponse.badRequest('Origin must be a 3-letter IATA code').send(res)
      return
    }
    if (!destination || destination.length !== 3) {
      ApiResponse.badRequest('Destination must be a 3-letter IATA code').send(res)
      return
    }

    const route = AppDataSource.getRepository(Route).create({
      userId: req.user.id,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      flexibleDates,
    })

    await AppDataSource.getRepository(Route).save(route)

    // Fire-and-forget immediate price check
    setImmediate(() => {
      runPriceCheck(route.id, route.origin, route.destination).catch((err: unknown) =>
        console.error('[RouteController] Price check failed:', err),
      )
    })

    ApiResponse.created(route).send(res)
  }

  getById = async (req: Request, res: Response): Promise<void> => {
    const route = await AppDataSource.getRepository(Route).findOne({
      where: { id: req.params.id },
    })
    if (!route) { ApiResponse.notFound('Route not found').send(res); return }
    ApiResponse.ok(route).send(res)
  }

  toggle = async (req: IAuthRequest, res: Response): Promise<void> => {
    const route = await RouteRepository.findByIdAndUser(req.params.id, req.user.id)
    if (!route) { ApiResponse.notFound('Route not found').send(res); return }

    await AppDataSource.getRepository(Route).update(route.id, { active: !route.active })
    ApiResponse.ok({ ...route, active: !route.active }).send(res)
  }

  delete = async (req: IAuthRequest, res: Response): Promise<void> => {
    const route = await RouteRepository.findByIdAndUser(req.params.id, req.user.id)
    if (!route) { ApiResponse.notFound('Route not found').send(res); return }

    await AppDataSource.getRepository(Route).delete(route.id)
    ApiResponse.noContent().send(res)
  }

  getPrices = async (req: IAuthRequest, res: Response): Promise<void> => {
    const route = await RouteRepository.findByIdAndUser(req.params.id, req.user.id)
    if (!route) { ApiResponse.notFound('Route not found').send(res); return }

    const prices = await PriceRepository.findByRoute(route.origin, route.destination)
    ApiResponse.ok(prices).send(res)
  }

  getBaseline = async (req: IAuthRequest, res: Response): Promise<void> => {
    const route = await RouteRepository.findByIdAndUser(req.params.id, req.user.id)
    if (!route) { ApiResponse.notFound('Route not found').send(res); return }

    const baseline = await detectionService.computeBaseline(route.origin, route.destination)
    if (!baseline) { ApiResponse.notFound('Insufficient data for baseline').send(res); return }

    ApiResponse.ok(baseline).send(res)
  }

  getAlerts = async (req: IAuthRequest, res: Response): Promise<void> => {
    const route = await RouteRepository.findByIdAndUser(req.params.id, req.user.id)
    if (!route) { ApiResponse.notFound('Route not found').send(res); return }

    const alerts = await AlertRepository.findByRouteId(route.id)
    ApiResponse.ok(alerts).send(res)
  }
}
