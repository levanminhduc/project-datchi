-- Migration: Add 'ORDER_APPROVED' to notification_type enum
-- Reason: Notify order creator when leader signs/approves weekly order
-- Note: notifications.type is ENUM (notification_type), not TEXT+CHECK.
--       Use ALTER TYPE ADD VALUE (idempotent via IF NOT EXISTS).

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ORDER_APPROVED';
