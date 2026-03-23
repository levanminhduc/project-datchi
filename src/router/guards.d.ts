import type { Router } from 'vue-router';
/**
 * Setup router navigation guards for authentication and authorization
 *
 * IMPORTANT: All routes require authentication BY DEFAULT.
 * Only routes explicitly marked with `public: true` can be accessed without login.
 *
 * Permission check order:
 * 1. Public routes (meta.public: true) - allow without auth
 * 2. Auth check - redirect to login if not authenticated
 * 3. ROOT check - if user is ROOT, bypass all permission checks
 * 4. Admin check - if route requires admin
 * 5. Permission checks - OR logic or AND logic
 */
export declare function setupRouterGuards(router: Router): void;
