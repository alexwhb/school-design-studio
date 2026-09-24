/**
 * Where the composer writes down what it could not do.
 *
 * Nothing a model writes is ever thrown away without a line here. A heading cut
 * to fit, a bullet with nowhere to go, a slide past the page limit: each is one
 * entry, with the words in full, so the host can say "two points did not fit"
 * rather than a person finding out in front of a room.
 */
import type { ComposeReport, DroppedText } from './types';
export type Reason = DroppedText['reason'];
export type Recorder = {
    report: ComposeReport;
    /** The page being composed now, and the outline item it came from. */
    page: number;
    source: number;
    note(field: string, text: string, reason: Reason, page?: number): void;
};
export declare function recorder(): Recorder;
/** A recorder whose notes go nowhere, for callers that never asked. */
export declare function silent(): Recorder;
/** `maxPages` as asked for, within what a design can hold. */
export declare function pageCap(asked: number | undefined, most: number): number;
