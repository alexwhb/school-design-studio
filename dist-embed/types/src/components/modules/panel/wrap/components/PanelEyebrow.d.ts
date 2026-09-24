/**
 * The heading over one block of a browsing panel.
 *
 * Lighter than the settings panel's `PanelSection`: no hairline and nothing to
 * collapse, because a browsing panel's sections are a way of naming what you
 * are looking at rather than a set of controls you fold away.
 */
import type { ReactNode } from 'react';
import './panelEyebrow.less';
type Props = {
    label: ReactNode;
    /** A count or an aside, when there is nothing to click. */
    note?: ReactNode;
    onAction?: () => void;
    actionLabel?: string;
};
export default function PanelEyebrow({ label, note, onAction, actionLabel }: Props): import("react").JSX.Element;
export {};
