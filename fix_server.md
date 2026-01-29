# Dashboard Showing 0 Employees - Root Cause & Fix

## Root Cause

The dashboard is calling `/api/employees/count` but getting a 500 error because the route is matching `/:id` instead of `/count`. The database actually has **1000 active employees**.

## Database Status ✅
- Total employees: 1000
- All with `is_active = true`
- Supabase query works correctly

## API Issue ❌
- `/api/employees/count` endpoint exists in code (line 70-96)
- Route defined BEFORE `/:id` (correct order)
- But server is returning error from `/:id` handler

## Fix Steps

### 1. Stop All Servers
```bash
# Kill all Node processes
taskkill /F /IM node.exe
# Or on Mac/Linux:
killall node
```

### 2. Restart Backend
```bash
npm run server
```

### 3. Test the Endpoint
```bash
curl http://localhost:3000/api/employees/count
# Should return: {"data":{"count":1000},"error":null}
```

### 4. Restart Frontend
```bash
npm run dev
```

## Expected Result
Dashboard should show **"1000"** active employees instead of **"0"**

## Current State
- Database: ✅ 1000 active employees
- API Code: ✅ Endpoint defined correctly  
- Server: ❌ Not routing to correct handler
- Frontend: ❌ Shows 0 (because API returns error)

