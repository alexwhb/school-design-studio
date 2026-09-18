export type WheelZoom = {
    /** Multiply the zoom by `factor`, holding (clientX, clientY) still. */
    scale: (factor: number, clientX: number, clientY: number) => void;
};
/** Chrome and Safari still report the legacy wheelDelta, where a notch is 120. */
type LegacyWheelEvent = WheelEvent & {
    wheelDeltaY?: number;
};
export declare function isMouseWheel(e: LegacyWheelEvent): boolean;
export default function addWheelZoom(elementId: string, zoom: WheelZoom): () => void;
export {};
