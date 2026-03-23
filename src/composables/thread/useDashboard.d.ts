/**
 * Dashboard Composable
 *
 * Provides reactive state and operations for dashboard management.
 * Aggregates metrics, alerts, conflicts, pending items, and activity.
 */
export declare function useDashboard(): {
    summary: any;
    alerts: any;
    conflicts: any;
    pending: any;
    activity: any;
    error: any;
    isLoading: any;
    hasCriticalAlerts: any;
    criticalAlertCount: any;
    hasConflicts: any;
    totalPendingActions: any;
    fetchSummary: () => Promise<void>;
    fetchAlerts: () => Promise<void>;
    fetchConflicts: () => Promise<void>;
    fetchPending: () => Promise<void>;
    fetchActivity: () => Promise<void>;
    fetchAll: () => Promise<void>;
    refreshDashboard: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
};
