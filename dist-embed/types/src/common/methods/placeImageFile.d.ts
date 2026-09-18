export type TUploadDoneData = {
    width: number;
    height: number;
    url: string;
    id?: string;
    title?: string;
};
/**
 * What a file picker offers and what a drop will take.
 *
 * SVG earns its place rather than arriving with `image/*`: a crest or a mascot
 * is drawn as vector art, and every other format here turns it into pixels that
 * go soft the moment somebody scales it up for a poster. It is also the one
 * entry that is a document rather than a picture — see the host's own upload
 * route, which reads the markup before it will store one. Standalone, the file
 * only ever reaches this browser's IndexedDB.
 *
 * WebP and AVIF are left off deliberately, the same way the host leaves WebP
 * off: a design becomes a `.pptx`, and a picture some copies of PowerPoint draw
 * and some do not is worse than one nobody could add.
 */
export declare const IMAGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/gif,image/svg+xml";
/** The same list, for a person reading it under a button. */
export declare const IMAGE_UPLOAD_LABEL = "jpg, png, gif, svg";
/**
 * The `accept` attribute is a filter on a dialog, not a rule — a drop never saw
 * one, and every file dialog has an "All files" escape hatch.
 */
export declare function isUploadableImage(file: File): boolean;
/**
 * Store one file, with the notice on failure. Null means it did not land, and
 * the caller has already been told why.
 */
export declare function uploadImageFile(file: File): Promise<TUploadDoneData | null>;
/**
 * Put a stored picture on the current page.
 *
 * `at` is a point in page coordinates, and the picture is centred on it — where
 * somebody let go is where they meant the middle of it to be, not its corner.
 * Without one it lands in the middle of the page, which is what the dock and
 * the panel have always done.
 */
export declare function placeUploadedImage(res: TUploadDoneData, at?: {
    x: number;
    y: number;
}): Promise<void>;
/**
 * Upload a set of files and lay them on the page, one after another.
 *
 * Serial rather than parallel: each has to be stored before the next, or a host
 * with a per-school count cap accepts however many happen to win the race. Each
 * one after the first is nudged along the diagonal so a drop of four pictures
 * is four pictures rather than one pile.
 */
export declare function uploadAndPlaceImages(files: File[], at?: {
    x: number;
    y: number;
}): Promise<number>;
/**
 * Where on the page a pointer at these client coordinates is, or null when the
 * pointer was not over the page at all.
 *
 * The canvas carries a `scale()` for the zoom, and `getBoundingClientRect`
 * reports the box after that transform — so dividing by the zoom is enough and
 * the transform's origin, which changes at 100%, does not come into it.
 */
export declare function pagePointAt(clientX: number, clientY: number): {
    x: number;
    y: number;
} | null;
