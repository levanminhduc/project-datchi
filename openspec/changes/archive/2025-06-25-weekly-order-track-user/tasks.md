## 1. Database Migration

- [x] 1.1 Create migration `supabase/migrations/20260225_add_updated_by_to_thread_order_weeks.sql`: `ALTER TABLE thread_order_weeks ADD COLUMN updated_by VARCHAR(50)` ← (verify: migration runs without errors, column exists after apply)

## 2. Backend Types

- [x] 2.1 Add `updated_by: string | null` to `ThreadOrderWeek` interface in `server/types/weeklyOrder.ts`

## 3. Backend Route Handlers

- [x] 3.1 In `server/routes/weeklyOrder.ts` POST handler (line ~648): get `auth.employeeId` from context, query `employees.full_name`, pass `created_by` into insert
- [x] 3.2 In `server/routes/weeklyOrder.ts` PUT handler (line ~726): get `auth.employeeId` from context, query `employees.full_name`, set `updated_by` in updateFields ← (verify: POST sets created_by, PUT sets updated_by, both use employee full_name from DB)

## 4. Frontend Types

- [x] 4.1 Add `updated_by: string | null` to `ThreadOrderWeek` interface in `src/types/thread/weeklyOrder.ts`

## 5. Frontend UI

- [x] 5.1 Add "Người tạo" column (`created_by`) to `columns` array in `src/components/thread/weekly-order/WeekHistoryDialog.vue`, display "—" when null ← (verify: column shows creator name, legacy null records show "—", table layout is not broken)
