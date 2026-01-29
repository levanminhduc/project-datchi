import { Hono } from 'hono'

const dashboard = new Hono()

// TODO: thread-management-45 GET /api/dashboard/summary - KPI summary (total stock, allocated, available, critical)
// TODO: thread-management-46 GET /api/dashboard/alerts - Low stock and expiry alerts
// TODO: thread-management-47 GET /api/dashboard/conflicts - Active conflicts count and list
// TODO: thread-management-48 GET /api/dashboard/pending - Pending allocations and recovery

export default dashboard
