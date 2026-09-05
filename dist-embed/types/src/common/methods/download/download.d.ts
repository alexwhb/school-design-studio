type TCallBack = (progress: number, xhr: XMLHttpRequest) => void;
declare const _default: (src: string, cb: TCallBack, fileName?: string) => Promise<void>;
export default _default;
