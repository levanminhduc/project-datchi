-- ENUM Types for Thread Inventory System
CREATE TYPE public.allocation_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);
CREATE TYPE public.allocation_status AS ENUM (
    'PENDING',
    'SOFT',
    'HARD',
    'ISSUED',
    'CANCELLED',
    'WAITLISTED'
);
CREATE TYPE public.batch_operation_type AS ENUM (
    'RECEIVE',
    'TRANSFER',
    'ISSUE',
    'RETURN'
);
CREATE TYPE public.cone_status AS ENUM (
    'RECEIVED',
    'INSPECTED',
    'AVAILABLE',
    'SOFT_ALLOCATED',
    'HARD_ALLOCATED',
    'IN_PRODUCTION',
    'PARTIAL_RETURN',
    'PENDING_WEIGH',
    'CONSUMED',
    'WRITTEN_OFF',
    'QUARANTINE'
);
CREATE TYPE public.lot_status AS ENUM (
    'ACTIVE',
    'DEPLETED',
    'EXPIRED',
    'QUARANTINE'
);
CREATE TYPE public.movement_type AS ENUM (
    'RECEIVE',
    'ISSUE',
    'RETURN',
    'TRANSFER',
    'ADJUSTMENT',
    'WRITE_OFF'
);
CREATE TYPE public.permission_action AS ENUM (
    'VIEW',
    'CREATE',
    'EDIT',
    'DELETE',
    'MANAGE'
);
CREATE TYPE public.recovery_status AS ENUM (
    'INITIATED',
    'PENDING_WEIGH',
    'WEIGHED',
    'CONFIRMED',
    'WRITTEN_OFF',
    'REJECTED'
);
CREATE TYPE public.thread_material AS ENUM (
    'POLYESTER',
    'COTTON',
    'NYLON',
    'SILK',
    'RAYON',
    'MIXED'
);
