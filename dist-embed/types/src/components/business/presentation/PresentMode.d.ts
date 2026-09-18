import './presentMode.less';
export type PresentModeHandle = {
    open: (startAt?: number) => void;
    close: () => void;
};
/**
 * Presentation mode.
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
declare const PresentMode: import("react").ForwardRefExoticComponent<import("react").RefAttributes<PresentModeHandle>>;
export default PresentMode;
