import { Hono } from 'hono'
import type { AppEnv } from '../../types/hono-env'
import coreRoutes from './core'
import calculationRoutes from './calculation'
import deliveryRoutes from './deliveries'
import loansReservationsRoutes from './loans-reservations'
import transferReservedRoutes from './transfer-reserved'

const weeklyOrder = new Hono<AppEnv>()

// IMPORTANT: transferReservedRoutes has /search-po which must be registered
// BEFORE coreRoutes' /:id to avoid Hono matching 'search-po' as an id param
weeklyOrder.route('/', transferReservedRoutes)
weeklyOrder.route('/', coreRoutes)
weeklyOrder.route('/', calculationRoutes)
weeklyOrder.route('/', deliveryRoutes)
weeklyOrder.route('/', loansReservationsRoutes)

export default weeklyOrder
