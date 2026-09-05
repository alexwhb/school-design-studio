/**
 * Dragging a picture off the desktop and letting go of it on the design.
 *
 * The editor already accepted a drag from the Photos panel, but that is a
 * mouse-tracked ghost the studio paints itself and has nothing to do with the
 * browser's file drag. Dropping a file from Finder or Explorer did what an
 * unhandled drop always does: the browser navigated the tab to the file, and
 * whatever was unsaved went with it. So this listens whether or not anybody
 * uses it — even the version that only refuses is better than that.
 *
 * A hook rather than a wrapper component, because the element it belongs on
 * already exists: the editor screen's own root, which is the same element in
 * the standalone app and inside a host. A wrapper would have been a new layer
 * between `.ds-root` and a screen whose layout is written against it.
 *
 * The whole screen is the target, not the page: what somebody aims at is "the
 * design", and a drop that lands two pixels outside the page edge should still
 * work. Where the pointer was decides where the picture goes — over the page,
 * under the pointer; anywhere else, the middle of the page.
 */
import { type DragEventHandler } from 'react';
import './fileDrop.less';
export type FileDropHandlers = {
    onDragEnter: DragEventHandler;
    onDragOver: DragEventHandler;
    onDragLeave: DragEventHandler;
    onDrop: DragEventHandler;
};
export declare function useFileDrop(): {
    dropHandlers: FileDropHandlers;
    dropOverlay: React.ReactNode;
};
