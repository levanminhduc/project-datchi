import { Hono } from 'hono'

const inventory = new Hono()

// TODO: thread-management-28 GET /api/inventory - List inventory with filters (thread_type, warehouse, status)
// TODO: thread-management-29 GET /api/inventory/:id - Get single cone details
// TODO: thread-management-30 POST /api/inventory/receive - Receive stock (create cones, calculate meters from weight)
// TODO: thread-management-31 GET /api/inventory/available - Get available stock for allocation (exclude soft-allocated)
// TODO: thread-management-32 Implement batch fetching for >1000 rows using .range()

export default inventory
