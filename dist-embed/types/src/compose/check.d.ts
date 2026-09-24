/**
 * The check the editor runs before a download, on a stored design: text off
 * the page or too big for its box, text too small or too faint to read, and
 * photos with no alt text. A host can run it on a design it composed before
 * anybody opens it. See `checkDesign.ts` for what each check means.
 */
import { type DesignIssue } from '../common/methods/accessibility/checkDesign';
import type { DesignDocument } from './types';
export type { DesignIssue };
export declare function checkDocument(doc: DesignDocument): DesignIssue[];
