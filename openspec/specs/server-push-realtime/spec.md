## Requirements

### Requirement: Database change notifications via LISTEN/NOTIFY
The system SHALL emit change notifications from PostgreSQL using triggers that `pg_notify` a channel with a compact JSON payload when watched tables change, added via migration. The watched tables are exactly two — `thread_inventory` and `allocation_conflicts` — covering the three frontend consumers (`useInventory` and `useConeSummary` watch `thread_inventory`; `useConflicts` watches `allocation_conflicts`).

#### Scenario: Insert emits notification
- **WHEN** a row is inserted into a watched table
- **THEN** a NOTIFY payload `{ table, eventType: 'INSERT', ... }` is published on the change channel

#### Scenario: Update emits notification
- **WHEN** a row in a watched table is updated
- **THEN** a NOTIFY payload with `eventType: 'UPDATE'` is published

#### Scenario: Delete emits notification
- **WHEN** a row in a watched table is deleted (or soft-deleted)
- **THEN** a NOTIFY payload with the corresponding event type is published

#### Scenario: Payload stays within size limit
- **WHEN** a notification is built
- **THEN** the payload carries only minimal keys (table, event, identifying fields) to stay within the NOTIFY size limit

### Requirement: Backend SSE change feed
The system SHALL surface change notifications to clients through an authenticated Hono Server-Sent Events endpoint backed by a long-lived `pg` LISTEN connection.

#### Scenario: Authenticated stream connection
- **WHEN** an authenticated client connects to the realtime stream endpoint
- **THEN** the backend keeps an SSE connection open and forwards matching change events

#### Scenario: Unauthenticated connection rejected
- **WHEN** an unauthenticated client attempts to connect to the stream endpoint
- **THEN** the connection is rejected by the JWT middleware

#### Scenario: Notification fan-out
- **WHEN** a NOTIFY event arrives on the LISTEN connection
- **THEN** it is delivered to all connected SSE clients subscribed to that table

### Requirement: useRealtime composable interface preserved
The frontend `useRealtime` composable SHALL keep its existing public interface (`subscribe`, `unsubscribe`, `unsubscribeAll`, `status`, reconnect/backoff) while switching its internals from Supabase channels to the SSE feed, so the three consumers remain unchanged.

#### Scenario: Existing consumers unchanged
- **WHEN** `useInventory`, `useConeSummary`, and `useConflicts` call `subscribe(options, callback)` — the first two for table `thread_inventory`, the third for `allocation_conflicts`
- **THEN** they receive change payloads in the same callback shape as before without code changes

#### Scenario: Client-side filtering
- **WHEN** a consumer subscribes with a table/event/filter
- **THEN** the composable delivers only matching events to that callback

#### Scenario: Reconnect with backoff
- **WHEN** the SSE connection drops
- **THEN** the composable reconnects using the existing exponential-backoff strategy and restores subscriptions
