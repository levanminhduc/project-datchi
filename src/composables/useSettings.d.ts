/**
 * System Settings Management Composable
 * Cai dat he thong - System Settings
 *
 * Provides reactive state and operations for managing system settings.
 * Handles fetching, getting individual settings, and updating values.
 */
import { type SystemSetting } from '@/services/settingsService';
export declare function useSettings(): {
    settings: any;
    error: any;
    isLoading: any;
    hasSettings: any;
    fetchSettings: () => Promise<void>;
    getSetting: (key: string) => Promise<SystemSetting | null>;
    updateSetting: (key: string, value: unknown) => Promise<SystemSetting | null>;
    getSettingValue: <T = unknown>(key: string) => T | undefined;
    clearSettings: () => void;
    clearError: () => void;
};
