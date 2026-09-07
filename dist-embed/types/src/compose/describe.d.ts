/**
 * What a model is shown of a design it is being asked to change.
 *
 * Text and ids and nothing else. A page carrying a photograph is a megabyte of
 * base64 that says nothing about what the page means, and a page's geometry is
 * not something a model should be reasoning about — it has a layout engine on
 * this side of the wire and it is this module's neighbours. So each page comes
 * back as its words, in reading order, each with the id that `setText` takes.
 *
 * The `role` is the one hint about what a box is *for*: the merge field it
 * holds, or the part it was composed to play. Without it a model shown eleven
 * strings has to guess which is the heading, and it guesses by length.
 */
import type { DesignDocument, DesignKind, DocumentView } from './types';
/**
 * Which kind a stored design is, read back off its first page rather than
 * stored — a document that has been resized is what it now measures.
 */
export declare function kindOf(doc: DesignDocument): DesignKind | 'unknown';
export declare function describeDocument(doc: DesignDocument): DocumentView;
