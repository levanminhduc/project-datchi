type DialogType = 'info' | 'warning' | 'error' | 'success';
interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: DialogType;
    icon?: string;
    html?: boolean;
    persistent?: boolean;
    color?: string;
    ok?: string;
}
interface DeleteConfirmOptions {
    title?: string;
    message?: string;
    itemName: string;
    confirmText?: string;
    cancelText?: string;
}
export declare function useConfirm(): {
    confirm: (config: string | ConfirmOptions) => Promise<boolean>;
    confirmWarning: (message: string, title?: string) => Promise<boolean>;
    confirmDelete: (options: string | DeleteConfirmOptions) => Promise<boolean>;
};
export {};
