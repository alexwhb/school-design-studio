import type { TdLayout } from '../../../store/types';
import './presentMode.less';
export type PresentStageProps = {
    /** The pages to present. Read, never written. */
    pages: readonly TdLayout[];
    /** Where to start when `open` is not told: the page somebody is looking at. */
    currentPage?: () => number;
    /** Called as the presentation closes, with the page it finished on. */
    onExit?: (index: number) => void;
    /**
     * Where to draw the stage. It has to be inside a `.ds-root` for the
     * embedded build's styles to reach it; the editor's own root is found
     * without being asked, and the viewer hands in its own.
     */
    container?: () => HTMLElement | null | undefined;
};
export type PresentModeHandle = {
    open: (startAt?: number) => void;
    close: () => void;
};
/**
 * Presentation mode, for any list of pages.
 *
 * Nothing here reads or writes the editor's store: the pages come in as a prop,
 * and where to start and what to do on the way out are the caller's. That is
 * what lets the read-only viewer present a design without loading the editor.
 * The editor's own wrapper is PresentMode.tsx.
 *
 *
 * The design's pages become slides on a full-screen black stage: no toolbars,
 * no panels, nothing but the artwork. Arrow keys, space and page up/down move
 * between slides the way they do in every other presentation tool, so nobody
 * has to learn anything before standing up in front of a room.
 *
 * A slide is mounted once it comes within reach of the current one, and then
 * stays mounted for the rest of the session. Walking forwards through a talk
 * therefore pays for each slide just ahead of needing it, and going back to one
 * costs nothing — it is still there, images and all, so moving between slides is
 * a cross-fade rather than a fresh render. Mounting the whole deck up front
 * would be simpler, but a design may run to MAX_PAGES.
 */
declare const PresentStage: import("react").ForwardRefExoticComponent<PresentStageProps & import("react").RefAttributes<PresentModeHandle>>;
export default PresentStage;
