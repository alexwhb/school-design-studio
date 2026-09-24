declare const _default: {
    downloadImg: (src: string, cb: (progress: number, xhr: XMLHttpRequest) => void, fileName?: string | undefined) => Promise<void>;
    downloadBase64File: (base64Data: string, fileName: string) => void;
};
export default _default;
