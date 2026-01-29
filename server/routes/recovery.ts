import { Hono } from 'hono'

const recovery = new Hono()

// TODO: thread-management-40 GET /api/recovery - List pending recovery entries
// TODO: thread-management-41 POST /api/recovery/initiate - Initiate return from production (scan barcode)
// TODO: thread-management-42 POST /api/recovery/:id/weigh - Record weight, calculate remaining meters
// TODO: thread-management-43 POST /api/recovery/:id/confirm - Confirm recovery, update inventory as available
// TODO: thread-management-44 POST /api/recovery/:id/writeoff - Write off if <50g (requires supervisor approval)

export default recovery
