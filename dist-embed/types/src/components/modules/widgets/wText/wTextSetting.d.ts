import type { TListStyle } from './listMarkup';
export type TwTextData = {
    name: string;
    type: string;
    uuid: number;
    editable: boolean;
    left: number;
    top: number;
    transform: string;
    lineHeight: number;
    letterSpacing: number;
    fontSize: number;
    zoom: number;
    fontClass: {
        alias: string;
        id: number;
        value: string;
        url: string;
    };
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    writingMode: StyleProperty.WritingMode;
    textDecoration: string;
    color: string;
    textAlign: StyleProperty.TextAlign;
    textAlignLast?: StyleProperty.TextAlign;
    /** Bulleted, numbered or neither — the whole widget, never part of it. */
    listStyle: TListStyle;
    text: string;
    /** How far a curved run sweeps, in degrees. 0, or absent, is straight. */
    curve?: number;
    opacity: number;
    backgroundColor: string;
    parent: string;
    record: {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        dir: string;
    };
    textEffects?: {
        filling: {
            enable: boolean;
            type: number;
            color: string;
        };
        stroke: {
            enable: boolean;
            width: number;
            color: string;
        };
        shadow: {
            enable: boolean;
            offsetY: number;
            offsetX: number;
            blur: number;
            color: string;
        };
        offset: {
            enable: boolean;
            x: number;
            y: number;
        };
    }[];
    width?: number;
    height?: number;
    degree?: number;
};
export declare const wTextSetting: TwTextData;
