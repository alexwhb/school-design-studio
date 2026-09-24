import * as helper from './helper';
export declare const createBase64: typeof helper.createBase64;
export declare const CLOUD_TYPE: {
    text: string;
    image: string;
};
export declare const WRITING_MODE: {
    h: string;
    v: string;
};
export declare function parsePSDFromURL(url: string): Promise<any>;
export declare function convertPSD2Page(psd: any): Promise<{
    background: {
        color: string;
        image: string;
    };
    width: any;
    height: any;
    clouds: never[];
}>;
export declare function processPSD2Page(file: File): Promise<{
    background: {
        color: string;
        image: string;
    };
    width: any;
    height: any;
    clouds: never[];
}>;
