export type MessageType = 'success' | 'warning' | 'info' | 'error';
export default function message(options: string | {
    message: string;
    type?: MessageType;
    duration?: number;
}): {
    close(): void;
};
