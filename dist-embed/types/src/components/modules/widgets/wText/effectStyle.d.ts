/**
 * The CSS one layer of a stacked text effect turns into.
 *
 * Three places draw the same stack — the widget on the canvas, the static copy
 * the artboard strip renders, and the preview glyph in the settings panel —
 * and each used to inline its own copy of this expression. That is how the
 * preview came to be missing whatever the canvas had gained, so the stack
 * lives here now and they all read from it.
 *
 * `scale` is what the preview needs: it draws at 22px, so every distance has
 * to come down with the type or a 14px outline swallows the glyph.
 */
import type { CSSProperties } from 'react';
import type { TPatternFill } from './patternFill';
export type TTextEffect = {
    filling?: {
        enable: boolean;
        type: number | string;
        color: string;
        gradient?: Record<string, any>;
        imageContent?: {
            image?: string;
            pattern?: TPatternFill;
        };
    };
    stroke?: {
        enable: boolean;
        width: number;
        color: string;
        type?: string;
    };
    shadow?: {
        enable: boolean;
        color: string;
        offsetX: number;
        offsetY: number;
        blur: number;
    };
    offset?: {
        enable: boolean;
        x: number;
        y: number;
    };
    skew?: {
        enable: boolean;
        x: number;
        y: number;
    };
};
export default function effectStyle(effect: TTextEffect, scale?: number): CSSProperties;
