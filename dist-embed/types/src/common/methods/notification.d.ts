type NotifyType = 'success' | 'warning' | 'info' | 'error' | '';
type NotifyOptions = {
    type?: NotifyType;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration?: number;
};
export default function useNotification(title: string, messageText?: string, extra?: NotifyOptions): {
    close: () => void;
};
export {};
