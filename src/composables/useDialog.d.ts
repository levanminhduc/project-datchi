export declare function useDialog<T = any>(defaultValue?: T): {
    isOpen: any;
    data: any;
    open: (payload?: T) => void;
    close: () => void;
    toggle: () => void;
};
