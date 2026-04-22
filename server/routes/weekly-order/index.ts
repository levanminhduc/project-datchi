import { Hono } from 'hono'
import type { AppEnv } from '../../types/hono-env'
import coreRoutes from './core'
import calculationRoutes from './calculation'
import deliveryRoutes from './deliveries'
import loansReservationsRoutes from './loans-reservations'
import transferReservedRoutes from './transfer-reserved'

const weeklyOrder = new Hono<AppEnv>()

weeklyOrder.route('/', coreRoutes)
weeklyOrder.route('/', calculationRoutes)
weeklyOrder.route('/', deliveryRoutes)
weeklyOrder.route('/', loansReservationsRoutes)
weeklyOrder.route('/', transferReservedRoutes)

export default weeklyOrder
