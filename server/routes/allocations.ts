import { Hono } from 'hono'

const allocations = new Hono()

// TODO: thread-management-33 GET /api/allocations - List allocations with filters (order, status, thread_type)
// TODO: thread-management-34 POST /api/allocations - HIGH RISK: Create soft allocation (calls RPC, handles conflicts)
// TODO: thread-management-36 POST /api/allocations/:id/issue - Convert soft to hard allocation (calls issue RPC)
// TODO: thread-management-37 DELETE /api/allocations/:id - Cancel allocation, release reserved stock
// TODO: thread-management-38 GET /api/allocations/conflicts - List active allocation conflicts
// TODO: thread-management-39 POST /api/allocations/conflicts/:id/resolve - Resolve conflict with priority adjustment

export default allocations
