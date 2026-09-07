export declare const isSupportFontFamily: (f: string) => boolean;
export declare function generateFontStyle(name: string, url: string): HTMLStyleElement;
export declare function base642Blob(b64Data: string, contentType?: string, sliceSize?: number): Blob;
export declare function blob2Base64(blob: Blob): Promise<string>;
