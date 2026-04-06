import { Hono } from 'hono'
import type { AppEnv } from '../../types/hono-env'
import coreRoutes from './core'
import calculationRoutes from './calculation'
import deliveryRoutes from './deliveries'
import loansReservationsRoutes from './loans-reservations'

// Mount order matters: core -> calculation -> deliveries -> loans-reservations
// Each sub-router registers static paths before parameterized /:id paths
const weeklyOrder = new Hono<AppEnv>()

weeklyOrder.route('/', coreRoutes)
weeklyOrder.route('/', calculationRoutes)
weeklyOrder.route('/', deliveryRoutes)
weeklyOrder.route('/', loansReservationsRoutes)

export default weeklyOrder
