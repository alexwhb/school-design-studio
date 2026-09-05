interface Position {
    x: number;
    y: number;
}
interface RegisterMoveablePanelOptions {
    wrapEl?: HTMLElement;
    onmousedown?(position: Position, event: MouseEvent): void;
    onmousemove?(position: Position, event: MouseEvent): void;
    onmouseup?(position: Position, event: MouseEvent): void;
}
export declare const registerMoveableElement: (el: HTMLElement, { onmousedown, onmousemove, onmouseup }?: RegisterMoveablePanelOptions) => {
    destroy(): void;
};
export {};
