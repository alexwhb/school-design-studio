/**
 * The Uploads panel, backed by the browser.
 *
 * This fork has no account system and no upload endpoint — the Express service
 * upstream ships exists to render screenshots with Puppeteer, and nothing in
 * `npm start` runs it. The uploader still POSTed to it, so every upload
 * resolved to an empty result, the placed image got an undefined src, and the
 * panel showed Element Plus's "FAILED" thumbnail. That is the "photo upload
 * just says failed" people hit.
 *
 * So uploads live in the browser instead: IndexedDB for the bytes, which is the
 * only client-side store big enough for photographs (localStorage caps out
 * around 5MB across the whole origin) and the only one that keeps them across
 * a reload.
 *
 * Images are stored as data URLs rather than Blobs behind object URLs. An
 * object URL dies with the tab, which would break every design that referenced
 * it; a data URL is self-contained, survives being saved into a design, is
 * same-origin so html2canvas can rasterise it without tainting the canvas, and
 * is what pptxgenjs wants for an embedded picture. The cost is roughly a third
 * more bytes, which `downscale` more than pays back.
 *
 * When the editor is embedded in an app that does have a file store, that app
 * hands one in through the `uploads` prop and `setHostUploads` below routes the
 * three calls to it. IndexedDB is then neither read nor written: a picture a
 * teacher uploaded on the staffroom machine is on their laptop too, which is
 * the whole reason to hand it over. Nothing outside this module — not the
 * Photos panel, not the paste handler, not the picture picker — knows which of
 * the two it is talking to.
 */
import type { HostUploads } from '../hooks/hostApi';
export type LocalUpload = {
    id: string;
    /** Data URL. Named `url` to match what the panels and widgets already read. */
    url: string;
    width: number;
    height: number;
    /** Original filename, shown on hover. */
    title: string;
    created_time: string;
};
/**
 * Shrinks a photo to something a poster can actually use.
 *
 * A phone camera writes 4000px, 6MB files; a poster prints one at a few hundred
 * pixels across. Storing the original would blow through the browser's quota
 * after a handful of uploads and make every later canvas render slower, so the
 * long edge is capped and anything sizeable is re-encoded as JPEG.
 *
 * Returns the data URL plus the dimensions the editor should lay it out at.
 *
 * Exported because it is the rule for any picture the browser makes and then
 * has to keep — a background cut out of a photo goes through it too, so a
 * cut-out is stored on the same terms as the photo it came from.
 */
export declare function downscale(file: File): Promise<{
    url: string;
    width: number;
    height: number;
}>;
export declare function setHostUploads(uploads: HostUploads | null): void;
export declare function hostKeepsUploads(): boolean;
/** Stores one file and returns the record the panel should show. */
export declare function saveUpload(file: File): Promise<LocalUpload>;
/** Newest first, which is the order someone expects after an upload. */
export declare function listUploads(): Promise<LocalUpload[]>;
export declare function deleteUpload(id: string): Promise<void>;
