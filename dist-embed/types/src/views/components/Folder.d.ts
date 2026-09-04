import type { ReactNode } from 'react';
import './folder.less';
type Props = {
    onSelect: (name: string) => void;
    /** Ticked state for the rulers, which the editor owns. */
    showGuides?: boolean;
    children: ReactNode;
};
/**
 * The File menu.
 *
 * Three groups, divided: what to do with the whole design, what to do with the
 * file, and what the editor itself shows you. The last group's items are
 * settings rather than actions, so they carry a tick showing what they are
 * currently set to — a menu item that silently toggles something is a menu item
 * you have to press to find out.
 */
export default function Folder({ onSelect, showGuides, children }: Props): import("react").JSX.Element;
export {};
