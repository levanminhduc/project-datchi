type NotifyPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center';
type NotifyType = 'positive' | 'negative' | 'warning' | 'info' | 'ongoing';
interface SnackbarOptions {
    message: string;
    type?: NotifyType;
    color?: string;
    textColor?: string;
    icon?: string;
    timeout?: number;
    position?: NotifyPosition;
    caption?: string;
    html?: boolean;
    actions?: Array<{
        label: string;
        color?: string;
        handler?: () => void;
    }>;
    progress?: boolean;
    multiLine?: boolean;
}
export declare function useSnackbar(): {
    show: (options: string | SnackbarOptions) => void;
    success: (message: string, timeout?: number) => void;
    error: (message: string, timeout?: number) => void;
    warning: (message: string, timeout?: number) => void;
    info: (message: string, timeout?: number) => void;
    loading: (message: string) => (() => void);
};
export {};
