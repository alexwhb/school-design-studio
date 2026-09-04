import type { TCellRef } from './TableGrid';
export type TCellAction = 'row-above' | 'row-below' | 'col-left' | 'col-right' | 'delete-row' | 'delete-col';
type Props = {
    at: {
        x: number;
        y: number;
    } & TCellRef;
    rows: number;
    cols: number;
    onAction: (action: TCellAction, cell: TCellRef) => void;
    onClose: () => void;
};
export default function CellMenu({ at, rows, cols, onAction, onClose }: Props): import("react").ReactPortal;
export {};
