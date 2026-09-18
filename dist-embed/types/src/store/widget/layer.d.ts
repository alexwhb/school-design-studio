export type TupdateLayerIndexData = {
    uuid: string;
    value: number;
    isGroup?: boolean;
};
export declare function updateLayerIndex({ uuid, value, isGroup }: TupdateLayerIndexData): void;
export type TLayerOrderEnd = 'front' | 'back';
/**
 * Puts a layer at the very top of the stack, or the very bottom, in one move.
 *
 * Bring forward / send backward step one place at a time, which is what you
 * want for a caption that has to sit just above one photo; this is for the
 * background that has to go behind everything, or the badge that has to come
 * out on top of all of it. A group travels as one thing: its members move with
 * it and stay in the order they were in. A member of a group can only go to
 * the top or bottom of that group, the same limit the single steps observe.
 */
export declare function setLayerOrder({ uuid, to }: {
    uuid: string;
    to: TLayerOrderEnd;
}): void;
export declare function ungroup(uuid: string): void;
export type TsetLayerHiddenData = {
    uuid: string;
    hidden: boolean;
};
/**
 * Takes a layer off the canvas, or puts it back.
 *
 * A hidden layer is not rendered at all rather than merely made transparent,
 * so it cannot be clicked, snapped to, or picked up by a drag selection, and
 * every export that draws the page simply never sees it.
 */
export declare function setLayerHidden({ uuid, hidden }: TsetLayerHiddenData): void;
