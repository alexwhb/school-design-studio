export type ShortcutInstance = {
    save: () => void;
    zoomAdd: () => void;
    zoomSub: () => void;
    zoomFit?: () => void;
    present?: () => void;
    findReplace?: () => void;
};
export default function dealWithCtrl(e: KeyboardEvent, _this: ShortcutInstance): void;
