# Deploy Note: Custom Access Token Hook

## Supabase Dashboard (Hosted)

1. Go to **Authentication > Hooks** in the Supabase Dashboard
2. Enable **Custom Access Token Hook**
3. Set the function to: `public.custom_access_token_hook`

## Self-hosted Docker

Add these environment variables to the GoTrue (Auth) service:

```env
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_ENABLED=true
GOTRUE_HOOK_CUSTOM_ACCESS_TOKEN_URI=pg-functions://postgres/public/custom_access_token_hook
```

## After enabling the hook

1. Run the database migrations (files `20260226000001` through `20260226000005`)
2. Run the data migration script (`scripts/migrate-auth-users.ts`) to create auth.users entries for existing employees
3. Restart the Auth service to pick up the hook configuration
