export declare function useLoading(initialState?: boolean): {
    isLoading: any;
    loadingCount: any;
    start: () => void;
    stop: () => void;
    reset: () => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
};
