import { Hono } from 'hono'

const threads = new Hono()

// TODO: thread-management-23 GET /api/threads - List all thread types with filters (search, color, supplier)
// TODO: thread-management-24 GET /api/threads/:id - Get single thread type by ID
// TODO: thread-management-25 POST /api/threads - Create thread type (check duplicate code, return 409)
// TODO: thread-management-26 PUT /api/threads/:id - Update thread type
// TODO: thread-management-27 DELETE /api/threads/:id - Soft delete thread type

export default threads
