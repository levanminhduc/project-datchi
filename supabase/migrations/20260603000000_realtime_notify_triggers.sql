-- W3 Realtime: replace Supabase Realtime (postgres_changes/WAL) with LISTEN/NOTIFY.
-- Triggers on the two watched tables emit a compact JSON payload on channel
-- 'datchi_realtime'. Payload carries the changed id plus the columns the
-- frontend smart-filters need (warehouse_id, thread_type_id, status) so the
-- existing consumers keep working unchanged. Well under the 8000-byte NOTIFY limit.
--
-- NOTE: the conflicts consumer (src/composables/thread/useConflicts.ts) subscribes
-- to logical table name 'allocation_conflicts', but the real table is
-- 'thread_conflicts'. The trigger emits table='allocation_conflicts' so the
-- unchanged consumer receives events (this also fixes a latent bug where conflict
-- live-updates never fired under Supabase, since no such table was published).

CREATE OR REPLACE FUNCTION fn_notify_thread_inventory_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
  payload json;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    rec := OLD;
  ELSE
    rec := NEW;
  END IF;

  payload := json_build_object(
    'table', 'thread_inventory',
    'eventType', TG_OP,
    'id', rec.id,
    'warehouse_id', rec.warehouse_id,
    'thread_type_id', rec.thread_type_id,
    'status', rec.status
  );

  PERFORM pg_notify('datchi_realtime', payload::text);

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_notify_thread_conflicts_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
  payload json;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    rec := OLD;
  ELSE
    rec := NEW;
  END IF;

  payload := json_build_object(
    'table', 'allocation_conflicts',
    'eventType', TG_OP,
    'id', rec.id,
    'thread_type_id', rec.thread_type_id,
    'status', rec.status
  );

  PERFORM pg_notify('datchi_realtime', payload::text);

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_thread_inventory ON thread_inventory;
CREATE TRIGGER trg_notify_thread_inventory
  AFTER INSERT OR UPDATE OR DELETE ON thread_inventory
  FOR EACH ROW EXECUTE FUNCTION fn_notify_thread_inventory_change();

DROP TRIGGER IF EXISTS trg_notify_thread_conflicts ON thread_conflicts;
CREATE TRIGGER trg_notify_thread_conflicts
  AFTER INSERT OR UPDATE OR DELETE ON thread_conflicts
  FOR EACH ROW EXECUTE FUNCTION fn_notify_thread_conflicts_change();
