export type LoadingInstance = {
    close: () => void;
};
export default function loading(text?: string): LoadingInstance;
