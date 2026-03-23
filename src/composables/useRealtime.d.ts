/**
 * Supabase Real-time Subscription Composable
 *
 * Provides reactive real-time subscriptions to Supabase table changes.
 * Auto-cleanup on component unmount, handles reconnection gracefully.
 */
/**
 * Connection status for real-time channel
 */
export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
/**
 * Supported real-time events
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';
/**
 * Options for subscribing to real-time changes
 */
export interface UseRealtimeOptions {
    /** Table name to subscribe to */
    table: string;
    /** Database schema (default: 'public') */
    schema?: string;
    /** Event type to listen for (default: '*' for all) */
    event?: RealtimeEvent;
    /** Filter expression (e.g., 'thread_type_id=eq.5') */
    filter?: string;
}
/**
 * Payload received from real-time subscription
 */
export interface RealtimePayload<T = Record<string, unknown>> {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: T | null;
    table: string;
    schema: string;
    commitTimestamp: string;
}
/**
 * Callback function for real-time events
 */
export type RealtimeCallback<T = Record<string, unknown>> = (payload: RealtimePayload<T>) => void;
/**
 * Real-time Subscription Composable
 *
 * Provides methods to subscribe to Supabase real-time table changes.
 * Automatically cleans up subscriptions on component unmount.
 *
 * @example
 * ```ts
 * const { status, subscribe, unsubscribe, unsubscribeAll } = useRealtime()
 *
 * // Subscribe to all changes on inventory table
 * subscribe({ table: 'thread_inventory', event: '*' }, (payload) => {
 *   console.log('Change:', payload.eventType, payload.new)
 * })
 *
 * // Subscribe with filter
 * subscribe({ table: 'allocations', event: 'UPDATE', filter: 'status=eq.PENDING' }, (payload) => {
 *   console.log('Allocation updated:', payload.new)
 * })
 * ```
 */
export declare function useRealtime(): {
    status: any;
    lastError: any;
    reconnectAttempts: any;
    activeChannels: any;
    subscribe: <T extends Record<string, unknown> = Record<string, unknown>>(options: UseRealtimeOptions, callback: RealtimeCallback<T>) => string;
    unsubscribe: (channelName: string) => void;
    unsubscribeAll: () => void;
    isConnected: () => boolean;
    getSubscriptionCount: () => number;
};
