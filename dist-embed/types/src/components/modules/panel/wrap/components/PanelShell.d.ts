/**
 * The frame every browsing panel is built in.
 *
 * All four of them are the same shape: a header that stays put while you scroll
 * — the search well and whatever chips filter the list — over a body that
 * scrolls. Each panel used to size and pad that itself, which is how the
 * Templates list ended up 14px from the edge and the Photos list 16px, and why
 * a sticky "back" header had to be positioned absolutely over a list that was
 * really the whole panel.
 */
import { type ReactNode } from 'react';
import './panelShell.less';
type WrapProps = {
    id?: string;
    className?: string;
    children: ReactNode;
};
export declare function PanelWrap({ id, className, children }: WrapProps): import("react").JSX.Element;
export declare function PanelHead({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
type BodyProps = {
    className?: string;
    children: ReactNode;
};
/** The scroller, so a panel can hand it to `useInfiniteScroll`. */
export declare const PanelBody: import("react").ForwardRefExoticComponent<BodyProps & import("react").RefAttributes<HTMLDivElement>>;
export declare function PanelSectionBlock({ className, children }: {
    className?: string;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
