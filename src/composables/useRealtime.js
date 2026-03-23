"use strict";
/**
 * Supabase Real-time Subscription Composable
 *
 * Provides reactive real-time subscriptions to Supabase table changes.
 * Auto-cleanup on component unmount, handles reconnection gracefully.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRealtime = useRealtime;
var vue_1 = require("vue");
var supabase_1 = require("@/lib/supabase");
/**
 * Vietnamese messages for user feedback
 */
var MESSAGES = {
    CONNECTED: 'Đã kết nối real-time',
    DISCONNECTED: 'Mất kết nối real-time',
    RECONNECTING: 'Đang kết nối lại...',
    ERROR: 'Lỗi kết nối real-time',
    SUBSCRIBE_ERROR: 'Không thể đăng ký nhận cập nhật',
};
/**
 * Generate unique channel name
 */
function generateChannelName(options) {
    var table = options.table, _a = options.schema, schema = _a === void 0 ? 'public' : _a, _b = options.event, event = _b === void 0 ? '*' : _b, filter = options.filter;
    var filterPart = filter ? "-".concat(filter.replace(/[=.]/g, '_')) : '';
    return "".concat(schema, ":").concat(table, ":").concat(event).concat(filterPart, "-").concat(Date.now());
}
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
function useRealtime() {
    // State
    var status = (0, vue_1.ref)('disconnected');
    var channelNames = (0, vue_1.ref)(new Set());
    var channelMap = new Map();
    var lastError = (0, vue_1.ref)(null);
    var reconnectAttempts = (0, vue_1.ref)(0);
    var maxReconnectAttempts = 5;
    /**
     * Subscribe to real-time changes on a table
     * @param options - Subscription options (table, schema, event, filter)
     * @param callback - Function called when changes occur
     * @returns Channel name for unsubscribing
     */
    var subscribe = function (options, callback) {
        var channelName = generateChannelName(options);
        var table = options.table, _a = options.schema, schema = _a === void 0 ? 'public' : _a, _b = options.event, event = _b === void 0 ? '*' : _b, filter = options.filter;
        status.value = 'connecting';
        lastError.value = null;
        try {
            // Build the subscription configuration
            var subscriptionConfig = {
                event: event,
                schema: schema,
                table: table,
            };
            // Add filter if provided
            if (filter) {
                subscriptionConfig.filter = filter;
            }
            // Create channel and subscribe
            var channel = supabase_1.supabase.channel(channelName);
            channel.on('postgres_changes', subscriptionConfig, function (payload) {
                var _a, _b;
                var realtimePayload = {
                    eventType: payload.eventType,
                    new: ((_a = payload.new) !== null && _a !== void 0 ? _a : null),
                    old: ((_b = payload.old) !== null && _b !== void 0 ? _b : null),
                    table: payload.table,
                    schema: payload.schema,
                    commitTimestamp: payload.commit_timestamp,
                };
                callback(realtimePayload);
            });
            channel.subscribe(function (subscriptionStatus) {
                switch (subscriptionStatus) {
                    case 'SUBSCRIBED':
                        status.value = 'connected';
                        reconnectAttempts.value = 0;
                        console.log("[useRealtime] ".concat(MESSAGES.CONNECTED, ": ").concat(channelName));
                        break;
                    case 'CHANNEL_ERROR':
                        status.value = 'error';
                        lastError.value = MESSAGES.ERROR;
                        console.error("[useRealtime] ".concat(MESSAGES.ERROR, ": ").concat(channelName));
                        handleReconnect(options, callback);
                        break;
                    case 'TIMED_OUT':
                        status.value = 'error';
                        lastError.value = MESSAGES.SUBSCRIBE_ERROR;
                        console.error("[useRealtime] ".concat(MESSAGES.SUBSCRIBE_ERROR, ": ").concat(channelName));
                        handleReconnect(options, callback);
                        break;
                    case 'CLOSED':
                        status.value = 'disconnected';
                        console.log("[useRealtime] ".concat(MESSAGES.DISCONNECTED, ": ").concat(channelName));
                        break;
                }
            });
            channelMap.set(channelName, channel);
            channelNames.value.add(channelName);
            return channelName;
        }
        catch (err) {
            status.value = 'error';
            lastError.value = err instanceof Error ? err.message : MESSAGES.SUBSCRIBE_ERROR;
            console.error('[useRealtime] Subscribe error:', err);
            return channelName;
        }
    };
    /**
     * Handle reconnection with exponential backoff
     */
    var handleReconnect = function (options, callback) {
        if (reconnectAttempts.value >= maxReconnectAttempts) {
            console.error('[useRealtime] Max reconnect attempts reached');
            return;
        }
        reconnectAttempts.value++;
        var delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000);
        console.log("[useRealtime] ".concat(MESSAGES.RECONNECTING, " (attempt ").concat(reconnectAttempts.value, "/").concat(maxReconnectAttempts, ")"));
        setTimeout(function () {
            // Unsubscribe from failed channel first
            var channelName = generateChannelName(options);
            unsubscribe(channelName);
            // Re-subscribe
            subscribe(options, callback);
        }, delay);
    };
    /**
     * Unsubscribe from a specific channel
     * @param channelName - Name of the channel to unsubscribe from
     */
    var unsubscribe = function (channelName) {
        var channel = channelMap.get(channelName);
        if (channel) {
            supabase_1.supabase.removeChannel(channel);
            channelMap.delete(channelName);
            channelNames.value.delete(channelName);
            console.log("[useRealtime] Unsubscribed: ".concat(channelName));
        }
        // Update status if no channels remain
        if (channelMap.size === 0) {
            status.value = 'disconnected';
        }
    };
    /**
     * Unsubscribe from all active channels
     */
    var unsubscribeAll = function () {
        channelMap.forEach(function (channel, name) {
            supabase_1.supabase.removeChannel(channel);
            console.log("[useRealtime] Unsubscribed: ".concat(name));
        });
        channelMap.clear();
        channelNames.value.clear();
        status.value = 'disconnected';
    };
    /**
     * Check if connected to any channel
     */
    var isConnected = function () {
        return status.value === 'connected' && channelMap.size > 0;
    };
    /**
     * Get count of active subscriptions
     */
    var getSubscriptionCount = function () {
        return channelMap.size;
    };
    // Auto cleanup on component unmount
    (0, vue_1.onUnmounted)(function () {
        unsubscribeAll();
    });
    return {
        // State (readonly for external use)
        status: (0, vue_1.readonly)(status),
        lastError: (0, vue_1.readonly)(lastError),
        reconnectAttempts: (0, vue_1.readonly)(reconnectAttempts),
        activeChannels: (0, vue_1.readonly)(channelNames),
        // Methods
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        unsubscribeAll: unsubscribeAll,
        isConnected: isConnected,
        getSubscriptionCount: getSubscriptionCount,
    };
}
