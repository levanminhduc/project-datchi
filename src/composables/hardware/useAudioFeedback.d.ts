export type AudioFeedbackType = 'success' | 'error' | 'scan';
export declare function useAudioFeedback(): {
    playBeep: (type?: AudioFeedbackType) => void;
};
